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
async function loadStore() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
async function saveStore(store) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

app.get("/api/storage/:key", async (req, res) => {
  const store = await loadStore();
  const key = req.params.key;
  if (!(key in store)) return res.status(404).json({ error: "not_found" });
  res.json({ key, value: store[key], shared: false });
});

app.put("/api/storage/:key", async (req, res) => {
  const store = await loadStore();
  const key = req.params.key;
  const { value } = req.body || {};
  if (typeof value !== "string") return res.status(400).json({ error: "value_must_be_string" });
  store[key] = value;
  await saveStore(store);
  res.json({ key, value, shared: false });
});

app.delete("/api/storage/:key", async (req, res) => {
  const store = await loadStore();
  const key = req.params.key;
  const existed = key in store;
  delete store[key];
  await saveStore(store);
  res.json({ key, deleted: existed, shared: false });
});

app.get("/api/storage", async (req, res) => {
  const store = await loadStore();
  const prefix = req.query.prefix || "";
  const keys = Object.keys(store).filter((k) => k.startsWith(prefix));
  res.json({ keys, prefix, shared: false });
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
