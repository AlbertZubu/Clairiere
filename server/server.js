import express from "express";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT, "data", "store.json");
const DIST_DIR = path.join(ROOT, "dist");
const PORT = process.env.PORT || 4000;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b";

const app = express();
app.use(express.json({ limit: "5mb" }));

// ---- Persistance fichier JSON (remplace window.storage) ----
// Le store entier tient dans un seul fichier : chaque écriture est un
// read-modify-write. Au chargement l'app envoie ~7 PUT en parallèle, qui
// lisaient tous le même snapshot — la dernière réponse écrasait les autres et
// les clés disparaissaient. On sérialise donc tous les accès au fichier dans
// une chaîne de promesses, et l'écriture passe par un fichier temporaire
// renommé (atomique) pour ne jamais laisser de store.json tronqué.
let storeQueue = Promise.resolve();

function withStore(fn) {
  const run = storeQueue.then(() => fn());
  // La file avance même si une opération échoue, sans propager le rejet.
  storeQueue = run.then(noop, noop);
  return run;
}
function noop() {}

async function loadStore() {
  let raw;
  try {
    raw = await fs.readFile(DATA_FILE, "utf8");
  } catch {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    // Fichier illisible : on le met de côté au lieu de l'écraser en silence.
    const backup = `${DATA_FILE}.corrupt-${Date.now()}`;
    await fs.rename(DATA_FILE, backup).catch(() => {});
    console.error(`store.json illisible (${e.message}), sauvegardé dans ${backup}`);
    return {};
  }
}

async function saveStore(store) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

// Lit le store, applique `mutate`, réécrit — le tout sous le verrou.
function updateStore(mutate) {
  return withStore(async () => {
    const store = await loadStore();
    const result = mutate(store);
    await saveStore(store);
    return result;
  });
}

app.get("/api/storage/:key", async (req, res) => {
  try {
    const store = await withStore(loadStore);
    const key = req.params.key;
    if (!(key in store)) return res.status(404).json({ error: "not_found" });
    res.json({ key, value: store[key], shared: false });
  } catch (e) {
    console.error("storage get failed:", e.message);
    res.status(500).json({ error: "storage_failure" });
  }
});

app.put("/api/storage/:key", async (req, res) => {
  const key = req.params.key;
  const { value } = req.body || {};
  if (typeof value !== "string") return res.status(400).json({ error: "value_must_be_string" });
  try {
    await updateStore((store) => {
      store[key] = value;
    });
    res.json({ key, value, shared: false });
  } catch (e) {
    console.error("storage put failed:", e.message);
    res.status(500).json({ error: "storage_failure" });
  }
});

app.delete("/api/storage/:key", async (req, res) => {
  const key = req.params.key;
  try {
    const existed = await updateStore((store) => {
      const had = key in store;
      delete store[key];
      return had;
    });
    res.json({ key, deleted: existed, shared: false });
  } catch (e) {
    console.error("storage delete failed:", e.message);
    res.status(500).json({ error: "storage_failure" });
  }
});

app.get("/api/storage", async (req, res) => {
  try {
    const store = await withStore(loadStore);
    const prefix = req.query.prefix || "";
    const keys = Object.keys(store).filter((k) => k.startsWith(prefix));
    res.json({ keys, prefix, shared: false });
  } catch (e) {
    console.error("storage list failed:", e.message);
    res.status(500).json({ error: "storage_failure" });
  }
});

// ---- Chat assistant via Ollama local (remplace l'appel direct à l'API Anthropic) ----
function extractJson(text) {
  let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  return match ? match[0] : cleaned;
}

app.post("/api/chat", async (req, res) => {
  const { messages = [], userInput = "" } = req.body || {};
  const systemPrompt = `Tu es Clairière, un assistant de gestion de tâches personnelles. L'utilisateur te donne des instructions en langage naturel.

Actions disponibles (utilise-les à chaque fois qu'une action concrète est demandée, ne réponds JAMAIS avec un tableau actions vide si l'utilisateur demande d'ajouter/modifier/supprimer quelque chose) :
- add_task : { "type": "add_task", "title": "titre de la tâche" }
- add_dossier : { "type": "add_dossier", "name": "nom du dossier" }
- toggle_task : { "type": "toggle_task", "id": "id de la tâche" }
- delete_task : { "type": "delete_task", "id": "id de la tâche" }

Réponds UNIQUEMENT avec du JSON valide, sans aucun texte ni markdown autour.

Exemple pour "Ajoute faire les courses" :
{"reply":"Tâche ajoutée","status":"ok","actions":[{"type":"add_task","title":"faire les courses"}]}

Exemple pour "Crée un dossier Vacances" :
{"reply":"Dossier créé","status":"ok","actions":[{"type":"add_dossier","name":"Vacances"}]}

Format de sortie exact : {"reply":"...(très court, 3-8 mots)","status":"ok|question|error","actions":[...]}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: userInput },
        ],
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!ollamaRes.ok) throw new Error(`Ollama HTTP ${ollamaRes.status}`);
    const data = await ollamaRes.json();
    const rawText = data.message?.content || "";
    const jsonStr = extractJson(rawText);
    const parsed = JSON.parse(jsonStr);

    res.json({
      reply: parsed.reply || "Action effectuée.",
      status: parsed.status || "ok",
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    });
  } catch (e) {
    clearTimeout(timeout);
    console.error("ollama chat failed:", e.message);
    res.json({ reply: "Le modèle local n'a pas répondu à temps.", status: "error", actions: [] });
  }
});

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use(express.static(DIST_DIR));
app.use("/clairiere", express.static(DIST_DIR));
app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Clairière server running on http://0.0.0.0:${PORT} (modèle chat: ${OLLAMA_MODEL})`);
});
