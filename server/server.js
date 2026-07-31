import express from "express";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT, "data", "store.json");
const DIST_DIR = path.join(ROOT, "dist");
const PORT = process.env.PORT || 4000;

const app = express();
app.use(express.json({ limit: "5mb" }));

// ---- Petite couche de persistance fichier JSON (remplace window.storage) ----
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

// GET /api/storage/:key
app.get("/api/storage/:key", async (req, res) => {
  const store = await loadStore();
  const key = req.params.key;
  if (!(key in store)) return res.status(404).json({ error: "not_found" });
  res.json({ key, value: store[key], shared: false });
});

// PUT /api/storage/:key  body: { value: string }
app.put("/api/storage/:key", async (req, res) => {
  const store = await loadStore();
  const key = req.params.key;
  const { value } = req.body || {};
  if (typeof value !== "string") return res.status(400).json({ error: "value_must_be_string" });
  store[key] = value;
  await saveStore(store);
  res.json({ key, value, shared: false });
});

// DELETE /api/storage/:key
app.delete("/api/storage/:key", async (req, res) => {
  const store = await loadStore();
  const key = req.params.key;
  const existed = key in store;
  delete store[key];
  await saveStore(store);
  res.json({ key, deleted: existed, shared: false });
});

// GET /api/storage?prefix=xxx
app.get("/api/storage", async (req, res) => {
  const store = await loadStore();
  const prefix = req.query.prefix || "";
  const keys = Object.keys(store).filter((k) => k.startsWith(prefix));
  res.json({ keys, prefix, shared: false });
});

// ---- Healthcheck ----
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// ---- Servir le build React (production) ----
app.use(express.static(DIST_DIR));
app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Clairière server running on http://0.0.0.0:${PORT}`);
});
