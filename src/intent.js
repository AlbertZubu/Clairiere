// ============================================================
// Analyse d'intention — le chemin rapide du chat
// ------------------------------------------------------------
// Mesuré sur ce Pi 5 : le plus petit modèle capable de comprendre
// « supprime la tâche X » met 4 à 6 s, et gemma3:4b 5 à 9 s. Aucun
// modèle local ne tiendra la barre des 2 s. Mais la quasi-totalité
// de ce qu'on tape dans ce chat suit une poignée de tournures :
// « ajoute … », « supprime … », « coche … », « crée un dossier … ».
// Ces tournures se reconnaissent en JavaScript, en zéro milliseconde
// et sans jamais se tromper.
//
// D'où la règle : le modèle n'est PAS sur le chemin critique. Il ne
// sert que de repêchage quand la phrase ne ressemble à rien de connu.
//
// Ce module est pur (aucun accès réseau, aucun état) : il est testable
// seul et tourne aussi bien côté navigateur que côté serveur.
// ============================================================

// ---------- normalisation ----------
// Deux variantes, et la distinction compte.
//
// `normalizeAligned` rend une chaine de MEME LONGUEUR que l'entree, un
// caractere pour un caractere. C'est ce qui permet de retrouver ensuite,
// dans la chaine d'origine, le fragment reconnu par un motif - accents et
// casse intacts. Compter les mots ne marcherait pas : "qu'il" vaut un mot
// dans l'original et deux une fois l'apostrophe devenue espace, et le titre
// se retrouvait alors ampute de son verbe.
//
// `normalize` y ajoute le repliement des espaces : c'est la forme sur
// laquelle on compare et on applique les motifs.
function normalizeAligned(s) {
  const src = String(s || "");
  let out = "";
  for (let i = 0; i < src.length; i++) {
    const stripped = src[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const c = stripped.length ? stripped[0] : " ";
    out += /[a-z0-9]/.test(c) ? c : " ";
  }
  return out; // longueur identique a src, garanti
}

// "Reserver l'Hotel" et "reserver hotel" doivent se rejoindre.
export function normalize(s) {
  return normalizeAligned(s).replace(/\s+/g, " ").trim();
}

// Mots vides français : ils gonflent le score de similarité sans rien dire.
const STOP = new Set([
  "le", "la", "les", "un", "une", "des", "du", "de", "d", "l", "au", "aux",
  "a", "à", "et", "ou", "en", "pour", "dans", "sur", "que", "qui", "ce",
  "cette", "mon", "ma", "mes", "je", "j", "il", "faut", "the",
]);

function tokens(s) {
  return normalize(s).split(" ").filter((w) => w && !STOP.has(w));
}

// ---------- reconnaissance d'intention ----------
// Chaque motif est ancré en début de phrase et capture ce qui suit :
// c'est ce reste qui devient le titre de la tâche.
const PATTERNS = [
  // — suppression
  { intent: "delete", re: /^(?:supprime[rz]?|efface[rz]?|enleve[rz]?|retire[rz]?|vire[rz]?|annule[rz]?)\s+(?:la\s+|le\s+|les\s+)?(?:tache|taches|mission)?\s*(.+)$/ },
  // — décocher (avant « coche », sinon « decoche » matcherait « coche »)
  { intent: "undone", re: /^(?:decoche[rz]?|rouvre|remets?|remettre)\s+(?:la\s+|le\s+)?(?:tache\s+)?(.+)$/ },
  { intent: "undone", re: /^(.+?)\s+(?:n\s*est\s+pas\s+fait|pas\s+fait|pas\s+termine)e?s?$/ },
  // — cocher
  { intent: "done", re: /^(?:coche[rz]?|valide[rz]?|termine[rz]?|fini[rs]?)\s+(?:la\s+|le\s+)?(?:tache\s+)?(.+)$/ },
  { intent: "done", re: /^(?:j\s*ai\s+(?:fini|termine|fait)|c\s*est\s+(?:fait|bon|termine))\s*(?:de\s+|d\s+|la\s+|le\s+)?(.*)$/ },
  { intent: "done", re: /^(.+?)\s+(?:c\s*est\s+fait|est\s+fait[e]?|est\s+termine[e]?)$/ },
  // — dossier
  { intent: "add_folder", re: /^(?:cree[rz]?|creer|ajoute[rz]?|nouveau|nouvelle|fais)\s+(?:un\s+|une\s+|le\s+)?(?:dossier|projet)\s+(.+)$/ },
  // — ajout (le plus fréquent, donc le plus permissif — testé en dernier)
  // Le groupe de liaison absorbe « que / qu' / de / d' / : » ainsi que le
  // « il faut que je » qui suit souvent « note … » — sans quoi le titre
  // commencerait par « Qu'il faut que je ».
  { intent: "add", re: /^(?:ajoute[rz]?|rajoute[rz]?|note[rz]?|cree[rz]?|creer|met[sz]?|mettre)\s+(?:moi\s+)?(?:une?\s+)?(?:nouvelle\s+)?(?:tache|mission|truc|rappel)?\s*(?::)?\s*(?:qu\s+|que\s+|de\s+|d\s+)?(?:il\s+faut\s+)?(?:que\s+je\s+|que\s+j\s+)?(?:pense[rz]?\s+a\s+)?(.+)$/ },
  { intent: "add", re: /^(?:il\s+)?faut\s+(?:que\s+je\s+|que\s+j\s+)?(?:pense\s+a\s+)?(.+)$/ },
  { intent: "add", re: /^je\s+dois\s+(.+)$/ },
  { intent: "add", re: /^(?:penser?\s+a|pense\s+a|ne\s+pas\s+oublier\s+de?)\s+(.+)$/ },
  { intent: "add", re: /^nouvelle\s+tache\s*:?\s*(.+)$/ },
];

// Questions : aucune action, mais on sait y répondre sans modèle.
const QUERY_RE = /^(?:c\s*est\s+quoi|quelle?s?|combien|montre|liste|affiche|ou\s+en|qu\s*est\s+ce)/;

// Le titre capturé garde la casse et les accents d'origine : on ne
// retrouve la position qu'après normalisation, d'où ce recollage.
function sliceOriginal(original, collapsedTail) {
  const aligned = normalizeAligned(original);
  const words = collapsedTail.split(" ").filter(Boolean);
  if (!words.length) return "";
  // La queue capturee court jusqu'a la fin du motif : on ancre donc la
  // recherche sur la fin, ce qui leve toute ambiguite si un mot se repete.
  const re = new RegExp(words.join("\\s+") + "\\s*$");
  const m = aligned.match(re);
  if (!m) return collapsedTail;
  return original.slice(m.index).replace(/^[:\s]+/, "").trim();
}

function cleanTitle(s) {
  const t = s.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// ---------- rapprochement avec les tâches existantes ----------
// Le modèle, lui, réécrit ou traduit les titres (mesuré : gemma3:1b rend
// « call the plumber » pour « appeler le plombier »). On ne lui confie donc
// jamais l'identification d'une tâche : c'est un score de recouvrement de
// mots, calculé ici, qui décide.
export function findTask(tasks, query) {
  const q = tokens(query);
  if (!q.length) return null;
  let best = null, bestScore = 0;

  for (const task of tasks) {
    const t = tokens(task.title);
    if (!t.length) continue;
    const hits = q.filter((w) => t.some((x) => x === w || x.startsWith(w) || w.startsWith(x))).length;
    // Rapporté à la requête : « courses » doit matcher « Faire les courses ».
    let score = hits / q.length;
    if (normalize(task.title) === normalize(query)) score = 1.5;
    if (score > bestScore) { bestScore = score; best = task; }
  }
  // En dessous de la moitié des mots retrouvés, on préfère avouer le doute
  // plutôt que supprimer la mauvaise tâche.
  return bestScore >= 0.5 ? best : null;
}

// ---------- point d'entrée ----------
// Rend null si la phrase n'est pas reconnue : à l'appelant de basculer
// sur le modèle. Rend sinon une action prête à appliquer.
export function parseIntent(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const norm = normalize(raw);

  if (QUERY_RE.test(norm)) return { intent: "query", target: raw };

  for (const { intent, re } of PATTERNS) {
    const m = norm.match(re);
    if (!m) continue;
    const tail = (m[1] || "").trim();
    // « j'ai fini » sans complément : c'est trop vague pour agir.
    if (!tail) continue;
    const title = cleanTitle(sliceOriginal(raw, tail));
    if (!title) continue;
    return { intent, target: title };
  }
  return null;
}
