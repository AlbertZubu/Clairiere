import express from "express";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { execFile } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT, "data", "store.json");
const DIST_DIR = path.join(ROOT, "dist");
const PORT = process.env.PORT || 4000;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b";
// Modele du chat. Il ne voit que les phrases que l'analyseur deterministe
// (`src/intent.js`) n'a pas su classer, et ne produit qu'un couple
// {intent, target} - jamais de prose. Mesure sur ce Pi 5, sur des
// formulations indirectes, sortie contrainte par schema :
//   qwen2.5:1.5b-instruct  7/8 corrects   2,8 s
//   gemma3:4b              8/8 corrects   9,8 s
//   gemma3:1b              6/8 corrects   5,9 s
//   llama3.2:1b            4/8 corrects   4,2 s
// qwen2.5:1.5b est le seul a tenir sous les 3 s sans s'effondrer en
// justesse. Les 16 Go du Pi lui permettent de rester resident en meme
// temps que gemma3:4b (dictee) - verifie a 8,5 Go pour trois modeles
// charges - donc aucun rechargement en passant du chat a la dictee.
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || "qwen2.5:1.5b-instruct";
// Modèle dédié à la mise en forme d'une dictée en tâche + sous-tâches.
// Séparé du chat : il doit sortir du JSON strict, pas de la conversation.
// Par défaut le même modèle que le chat : un seul 4B reste chargé en RAM,
// donc pas de rechargement de 55 s en passant du chat à la dictée.
const OLLAMA_STRUCTURE_MODEL = process.env.OLLAMA_STRUCTURE_MODEL || OLLAMA_MODEL;
// Transcription locale (whisper.cpp). Si le binaire ou le modèle manque,
// /api/transcribe répond 503 et le navigateur bascule sur sa propre dictée.
// whisper.cpp tourne en service systemd (`whisper.service`) et garde son modèle
// en RAM : relancer le binaire à chaque dictée relisait 488 Mo depuis la carte
// SD, soit ~20 s de latence pure avant même de transcrire.
const WHISPER_URL = process.env.WHISPER_URL || "http://127.0.0.1:8081";

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

// L'ancien /api/chat demandait a gemma3:4b de rediger une phrase de
// confirmation ET un tableau d'actions, sans schema de sortie. Trois couts
// se cumulaient : un modele de 4 milliards de parametres a ~7 jetons/s, une
// sortie longue (la phrase, le markdown ```json, les accolades), et tout
// l'historique de conversation renvoye a chaque tour. Resultat mesure :
// 9,35 s pour "Ajoute faire les courses".
//
// Ici le modele ne redige plus rien : il classe. La phrase de confirmation
// est ecrite par le front, qui sait deja ce qu'il vient de faire. Et il ne
// voit que les phrases refusees par l'analyseur deterministe - soit une
// minorite des cas.
const INTENT_SCHEMA = {
  type: "object",
  properties: {
    intent: { type: "string", enum: ["add", "done", "undone", "delete", "add_folder", "none"] },
    target: { type: "string" },
  },
  required: ["intent", "target"],
};

const INTENT_SYSTEM = `Tu classes une phrase en une action sur une liste de taches.
intent = "add" si la personne veut retenir quelque chose a faire.
intent = "done" si elle dit avoir termine quelque chose.
intent = "undone" si elle dit que quelque chose n est finalement pas fait.
intent = "delete" si elle veut retirer quelque chose de la liste.
intent = "add_folder" si elle veut creer un dossier ou un projet.
intent = "none" si la phrase ne demande aucune action (salutation, question, bavardage).
target = ce qu il faut faire, en francais, sans verbe d ordre. Vide si intent=none.
Reponds uniquement par le JSON demande.`;

app.post("/api/chat", async (req, res) => {
  const text = String(req.body?.text || req.body?.userInput || "").trim();
  if (!text) return res.status(400).json({ error: "empty_text" });

  const controller = new AbortController();
  // 12 s : quatre fois la latence mesuree, de quoi absorber un pic de charge
  // sans laisser l'interface bloquee si Ollama ne repond plus du tout.
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_CHAT_MODEL,
        // Aucun historique : classer une phrase ne demande pas de memoire,
        // et chaque tour rajoute du prompt a evaluer.
        messages: [
          { role: "system", content: INTENT_SYSTEM },
          { role: "user", content: text },
        ],
        format: INTENT_SCHEMA,
        think: false,
        stream: false,
        keep_alive: "30m",
        options: { temperature: 0, num_predict: 60 },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!ollamaRes.ok) throw new Error(`Ollama HTTP ${ollamaRes.status}`);

    const data = await ollamaRes.json();
    const parsed = JSON.parse(extractJson(data.message?.content || "{}"));
    const intent = INTENT_SCHEMA.properties.intent.enum.includes(parsed.intent) ? parsed.intent : "none";

    res.json({ intent, target: String(parsed.target || "").trim(), degraded: false });
  } catch (e) {
    clearTimeout(timeout);
    console.error("chat intent failed:", e.message);
    // Le modele n'a pas repondu : on le dit franchement plutot que
    // d'inventer une action sur les taches de l'utilisateur.
    res.json({ intent: "none", target: "", degraded: true });
  }
});

// ---- Dictée vocale : audio du navigateur -> texte, via whisper.cpp local ----
// Le navigateur envoie le blob brut (webm/opus le plus souvent, mp4/aac sur
// iOS). ffmpeg le normalise en WAV 16 kHz mono, seul format accepté par
// whisper.cpp. Tout reste sur le Pi : aucun audio ne sort de la machine.
function run(cmd, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`${path.basename(cmd)}: ${err.message} ${stderr || ""}`.trim()));
      resolve(stdout);
    });
  });
}

async function whisperAvailable() {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${WHISPER_URL}/`, { signal: controller.signal });
    clearTimeout(t);
    return res.status < 500;
  } catch {
    return false;
  }
}

app.post("/api/transcribe", express.raw({ type: () => true, limit: "25mb" }), async (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ error: "empty_audio" });
  }
  if (!(await whisperAvailable())) {
    // 503 distinct du 500 : le front peut dire « transcription indisponible »
    // plutôt que « échec », et l'utilisateur sait qu'il doit réécrire au clavier.
    return res.status(503).json({ error: "whisper_unavailable" });
  }

  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const inFile = path.join(os.tmpdir(), `clairiere-${stamp}.bin`);
  const wavFile = path.join(os.tmpdir(), `clairiere-${stamp}.wav`);
  const cleanup = () => Promise.all([fs.unlink(inFile).catch(noop), fs.unlink(wavFile).catch(noop)]);

  try {
    await fs.writeFile(inFile, req.body);
    // whisper n'accepte que du PCM 16 kHz mono ; le navigateur envoie de
    // l'opus (Android/Chrome) ou de l'aac (iOS), d'où le passage par ffmpeg.
    await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", inFile,
      "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wavFile], 60000);

    const form = new FormData();
    form.append("file", new Blob([await fs.readFile(wavFile)]), "audio.wav");
    form.append("language", "fr");
    form.append("response_format", "json");

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 180000);
    const wres = await fetch(`${WHISPER_URL}/inference`, {
      method: "POST", body: form, signal: controller.signal,
    });
    clearTimeout(t);
    if (!wres.ok) throw new Error(`whisper HTTP ${wres.status}`);
    const wdata = await wres.json();

    // whisper marque les passages sans parole par [BLANK_AUDIO] / (musique).
    const text = String(wdata.text || "")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !/^[[(].*[\])]$/.test(l))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    res.json({ text });
  } catch (e) {
    console.error("transcribe failed:", e.message);
    res.status(500).json({ error: "transcribe_failure" });
  } finally {
    cleanup();
  }
});

// ---- Mise en forme : texte libre -> tâche + sous-tâches ----
// Ollama sait contraindre sa sortie à un schéma JSON (`format`), ce qui évite
// d'avoir à rattraper du markdown ou du texte parasite autour du JSON.
const TASK_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    subtasks: { type: "array", items: { type: "string" } },
  },
  required: ["title", "subtasks"],
};
const SUBTASK_SCHEMA = {
  type: "object",
  properties: { subtasks: { type: "array", items: { type: "string" } } },
  required: ["subtasks"],
};

// Repli si le modèle est indisponible ou hors sujet : on garde toujours la
// parole de l'utilisateur plutôt que de perdre la dictée.
function fallbackTitle(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 80) return clean;
  return `${clean.slice(0, 77).trimEnd()}...`;
}

app.post("/api/structure", async (req, res) => {
  const { transcript = "", mode = "task", parentTitle = "" } = req.body || {};
  const text = String(transcript).trim();
  if (!text) return res.status(400).json({ error: "empty_transcript" });

  const isSubtask = mode === "subtask";
  const system = isSubtask
    ? `Tu convertis une dictée en sous-tâches d'une tâche existante intitulée "${parentTitle}".
Règles :
- Chaque sous-tâche est une action concrète, à l'infinitif, 8 mots maximum.
- Reprends TOUTES les actions mentionnées, sans en omettre une seule.
- Découpe uniquement ce que la dictée mentionne, n'invente rien.
- Si la dictée ne contient qu'une seule action, renvoie un seul élément.
- 6 sous-tâches maximum. Réponds en français.`
    : `Tu convertis une dictée en tâche structurée.
Règles :
- "title" : le but global, à l'infinitif, 6 mots maximum, sans détail.
- "subtasks" : les étapes concrètes que la dictée mentionne, à l'infinitif, 8 mots maximum chacune.
- Reprends TOUTES les actions mentionnées, sans en omettre une seule.
- N'ajoute JAMAIS une étape que la dictée n'évoque pas. Deux sous-tâches fidèles
  valent mieux que six inventées.
- Si la dictée décrit une action unique et simple, "subtasks" doit être vide.
- 6 sous-tâches maximum. Réponds en français.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 150000);

  try {
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_STRUCTURE_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: text },
        ],
        format: isSubtask ? SUBTASK_SCHEMA : TASK_SCHEMA,
        think: false,
        stream: false,
        keep_alive: "30m",
        options: { temperature: 0.2, num_predict: 400 },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!ollamaRes.ok) throw new Error(`Ollama HTTP ${ollamaRes.status}`);

    const data = await ollamaRes.json();
    const parsed = JSON.parse(extractJson(data.message?.content || "{}"));

    const subtasks = (Array.isArray(parsed.subtasks) ? parsed.subtasks : [])
      .map((s) => String(s).trim())
      .filter(Boolean)
      .slice(0, 8);
    const title = isSubtask ? "" : String(parsed.title || "").trim() || fallbackTitle(text);

    res.json({ title, subtasks, transcript: text, degraded: false });
  } catch (e) {
    clearTimeout(timeout);
    console.error("structure failed:", e.message);
    // Le modèle a lâché : on rend quand même une tâche exploitable.
    res.json({
      title: isSubtask ? "" : fallbackTitle(text),
      subtasks: isSubtask ? [fallbackTitle(text)] : [],
      transcript: text,
      degraded: true,
    });
  }
});

app.get("/api/voice-status", async (req, res) => {
  res.json({ whisper: await whisperAvailable(), model: OLLAMA_STRUCTURE_MODEL });
});

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use(express.static(DIST_DIR));
app.use("/clairiere", express.static(DIST_DIR));
app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

// Précharge le modèle de mise en forme : sans ça, la première dictée de la
// journée attend ~55 s le seul chargement du modèle depuis le disque.
function warmModel(model) {
  fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "ok" }],
      stream: false, think: false, keep_alive: "30m",
      options: { num_predict: 1 },
    }),
  }).then(
    () => console.log(`modele ${model} precharge`),
    (e) => console.warn(`prechargement ${model} echoue:`, e.message),
  );
}

function warmStructureModel() {
  fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_STRUCTURE_MODEL,
      messages: [{ role: "user", content: "ok" }],
      stream: false, think: false, keep_alive: "30m",
      options: { num_predict: 1 },
    }),
  }).then(
    () => console.log(`modèle ${OLLAMA_STRUCTURE_MODEL} préchargé`),
    (e) => console.warn(`préchargement ${OLLAMA_STRUCTURE_MODEL} échoué:`, e.message),
  );
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Clairière server running on http://0.0.0.0:${PORT} (chat: ${OLLAMA_CHAT_MODEL}, dictée: ${OLLAMA_STRUCTURE_MODEL})`);
  warmStructureModel();
  warmModel(OLLAMA_CHAT_MODEL);
});
