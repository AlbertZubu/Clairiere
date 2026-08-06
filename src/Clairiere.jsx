import { useState, useEffect, useRef, useCallback } from "react";
import { useVoiceCapture, transcribeAudio, structureText, micUnavailableReason, MIC_HELP, httpsTarget } from "./voice";
import { parseIntent, findTask } from "./intent";
import {
  Send, ChevronDown, ChevronRight, ChevronLeft, Trash2, Circle,
  CheckCircle2, Loader2, GripVertical, Mic, ListChecks, CalendarDays,
  Zap, Languages, Music, Dumbbell, Mail, RotateCcw, X,
  TrendingUp, BookOpen, Brain, Heart, Gamepad2, Trophy, Phone, Plus, Waves,
  AlertTriangle, Check, Sparkles, Trees, Folder, CalendarRange, Wallet,
  Shirt, Bike, Mountain, ChefHat, Footprints, BedDouble, Sun, Sprout,
  LayoutGrid, Flame, Home, Briefcase, Landmark, Stamp, PiggyBank,
  ChevronsDown, ChevronsUp,
} from "lucide-react";

// ============================================================
// DESIGN SYSTEM — 8 univers visuels, redessinés de zéro
// ------------------------------------------------------------
// Cible : Galaxy Z Fold5 déplié (~690×830 CSS). Tout doit tenir
// sur un écran : bandeaux compacts, hebdo/daily sur UNE ligne,
// missions en GRILLE (jamais une tâche = une ligne entière).
// Chaque thème a sa `family` : c'est elle qui pilote la
// STRUCTURE (position des éléments, effets), pas juste les
// couleurs. Deux thèmes ne doivent jamais se ressembler.
// Tous les fonds sont clairs. Bords arrondis partout.
// ============================================================

const BASE_TOKENS = {
  family: "studio",          // studio | matiere | clairiere | elan | claude | aurore | bento | pop
  // — surfaces
  canvas: "#FFFFFF", canvasDeep: "#F2F2F2", panel: "#FFFFFF",
  appBg: "#FFFFFF", appOverlay: null,
  headerBg: "rgba(255,255,255,0.85)", headerBlur: 12,
  headerBorder: "1px solid rgba(0,0,0,0.07)", headerShadow: "none",
  headerFloat: false,        // true → le header est une carte flottante détachée
  // — encre
  ink: "#111111", inkSoft: "#4A4A4A", inkFaint: "#7A7A7A",
  line: "#E2E2E2", lineSoft: "#EFEFEF", lineStrong: null,
  // — accents (noms hérités : forest = primaire, amber = secondaire)
  forest: "#111111", forestSoft: "#3A3A3A",
  amber: "#C68A3D", amberSoft: "#E0B679",
  clay: "#B5674A", sky: "#4E7789", sage: "#7C9473", berry: "#93516A",
  danger: "#C0392B", success: "#3F7A45",
  onAccent: "#FFFFFF", accentGrad: null,
  glowAccent: "0 6px 16px rgba(0,0,0,0.10)",
  // — typo
  fontDisplay: "'Public Sans', sans-serif", fontBody: "'Public Sans', sans-serif",
  h1Size: 24, h1Weight: 700, h1Case: "none", h1Tracking: -0.2, h1Style: "normal",
  labelCase: "uppercase", labelWeight: 700, labelTracking: 1,
  bodyWeight: 600,
  // — formes
  radiusCard: "16px", radiusCardLg: "20px", radiusChip: "14px", radiusPill: "999px",
  cardBg: null, cardBorderWidth: 1, cardBorderColor: null,
  cardShadow: "0 1px 3px rgba(0,0,0,0.05)", cardBlur: 0,
  hoverLift: "translateY(-2px)", hoverShadow: "0 8px 22px rgba(0,0,0,0.10)",
  // — contrôles
  chipSize: 42,              // boutons rituels de la ligne hebdo/daily
  checkboxShape: "circle",
  navRadius: "999px", navPad: "8px 12px", navWeight: 600, navCase: "none", navTracking: 0,
  ringThickness: null,
  missionMin: 236,           // largeur mini d'une carte mission dans la grille
  tagline: "",
};

const THEMES = {
  // 1 — STUDIO : pro épuré façon Apple. Blanc cassé, aucune bordure,
  //     ombres douces, système, interrupteurs. Le calme.
  studio: {
    family: "studio", label: "Studio", swatch: "#007AFF", swatch2: "#F5F5F7",
    tagline: "L'essentiel, rien d'autre.",
    canvas: "#F5F5F7", canvasDeep: "#EBEBEF", panel: "#FFFFFF",
    appBg: "linear-gradient(180deg,#F7F7F9 0%,#F0F0F3 100%)",
    headerBg: "rgba(247,247,249,0.8)", headerBlur: 20, headerBorder: "1px solid rgba(0,0,0,0.05)",
    ink: "#1D1D1F", inkSoft: "#6E6E73", inkFaint: "#98989D",
    line: "#E5E5EA", lineSoft: "#F0F0F3",
    forest: "#007AFF", forestSoft: "#0A84FF",
    amber: "#FF9F0A", amberSoft: "#FFC062",
    clay: "#FF6B35", sky: "#5AC8FA", sage: "#34C759", berry: "#FF375F",
    danger: "#FF3B30", success: "#34C759",
    glowAccent: "0 6px 18px rgba(0,122,255,0.30)",
    fontDisplay: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif",
    fontBody: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif",
    h1Size: 26, h1Weight: 700, h1Tracking: -0.7,
    labelCase: "none", labelWeight: 600, labelTracking: 0,
    bodyWeight: 500,
    radiusCard: "16px", radiusCardLg: "20px", radiusChip: "14px",
    cardBorderWidth: 0,
    cardShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 22px rgba(0,0,0,0.05)",
    hoverLift: "translateY(-2px)", hoverShadow: "0 2px 4px rgba(0,0,0,0.05), 0 16px 36px rgba(0,0,0,0.09)",
    chipSize: 42, checkboxShape: "circle",
    navRadius: "999px", ringThickness: 4, missionMin: 236,
  },

  // 2 — MATIÈRE : pro épuré façon Google Material 3. Surfaces tonales
  //     bleutées, très grands rayons, formes qui changent quand on coche.
  matiere: {
    family: "matiere", label: "Matière", swatch: "#0B57D0", swatch2: "#D3E3FD",
    tagline: "Simple, net, efficace.",
    canvas: "#F8FAFD", canvasDeep: "#EEF2F9", panel: "#FFFFFF",
    appBg: "linear-gradient(180deg,#F9FBFE 0%,#F2F5FB 100%)",
    headerBg: "rgba(248,250,253,0.88)", headerBlur: 14, headerBorder: "none",
    headerShadow: "0 1px 0 rgba(27,31,38,0.06)",
    ink: "#1A1C1E", inkSoft: "#44474E", inkFaint: "#74777F",
    line: "#DDE2EB", lineSoft: "#EBEFF6",
    forest: "#0B57D0", forestSoft: "#4285F4",
    amber: "#F9AB00", amberSoft: "#FDD663",
    clay: "#E8710A", sky: "#00A2B8", sage: "#1E8E3E", berry: "#D01884",
    danger: "#D93025", success: "#1E8E3E",
    glowAccent: "0 4px 14px rgba(11,87,208,0.28)",
    fontDisplay: "'Roboto Flex', Roboto, 'Inter', system-ui, sans-serif",
    fontBody: "'Roboto Flex', Roboto, 'Inter', system-ui, sans-serif",
    h1Size: 25, h1Weight: 600, h1Tracking: 0,
    labelCase: "none", labelWeight: 600, labelTracking: 0.2,
    bodyWeight: 500,
    radiusCard: "20px", radiusCardLg: "26px", radiusChip: "16px",
    cardBorderWidth: 0, cardShadow: "0 1px 2px rgba(27,31,38,0.08)",
    hoverLift: "translateY(-1px)", hoverShadow: "0 4px 12px rgba(27,31,38,0.14)",
    chipSize: 44, checkboxShape: "circle",
    navRadius: "999px", ringThickness: 5, missionMin: 236,
  },

  // 3 — CLAIRIÈRE : la forêt. Papier crème, serif Fraunces, formes
  //     organiques asymétriques, graines sur une liane pointillée.
  clairiere: {
    family: "clairiere", label: "Clairière", swatch: "#2C4A32", swatch2: "#C68A3D",
    tagline: "Une trouée de lumière dans la forêt.",
    canvas: "#F7F3E9", canvasDeep: "#EDE5D0", panel: "#FFFDF7",
    appBg:
      "radial-gradient(1100px 620px at 8% -12%, #FFFEF6 0%, rgba(255,254,246,0) 62%)," +
      "radial-gradient(900px 520px at 102% 2%, #E8F0E0 0%, rgba(232,240,224,0) 58%)," +
      "#F7F3E9",
    headerBg: "rgba(247,243,233,0.88)", headerBorder: "1px solid #E2D9BF",
    ink: "#1E2A1D", inkSoft: "#556349", inkFaint: "#7A8471",
    line: "#DFD5B8", lineSoft: "#EAE2CC",
    forest: "#2C4A32", forestSoft: "#4B6B44",
    amber: "#C68A3D", amberSoft: "#E0B679",
    clay: "#B5674A", sky: "#4E7789", sage: "#7C9473", berry: "#93516A",
    danger: "#B5453A", success: "#3F7A45",
    glowAccent: "0 8px 20px rgba(44,74,50,0.20)",
    fontDisplay: "'Fraunces', Georgia, serif", fontBody: "'Public Sans', sans-serif",
    h1Size: 24, h1Weight: 600, h1Tracking: -0.2,
    labelCase: "uppercase", labelWeight: 700, labelTracking: 1.1,
    bodyWeight: 500,
    radiusCard: "18px 8px 18px 8px", radiusCardLg: "22px 10px 22px 10px", radiusChip: "14px 6px 14px 6px",
    cardBorderWidth: 1.5, cardShadow: "0 2px 10px rgba(46,60,40,0.05)",
    hoverShadow: "0 10px 26px rgba(46,60,40,0.12)",
    chipSize: 42, checkboxShape: "circle",
    ringThickness: 4, missionMin: 240,
  },

  // 4 — ÉLAN : l'énergie du sport. Néo-brutalisme ARRONDI : bords ronds
  //     mais traits noirs épais, ombres portées dures, italiques hurlées.
  elan: {
    family: "elan", label: "Élan", swatch: "#111111", swatch2: "#E4002B",
    tagline: "PAS DE JOUR SANS.",
    canvas: "#FFFFFF", canvasDeep: "#F1F1F1", panel: "#FFFFFF",
    appBg: "linear-gradient(180deg,#FFFFFF 0%,#FFFFFF 55%,#F4F4F4 100%)",
    appOverlay: "repeating-linear-gradient(135deg, rgba(17,17,17,0.022) 0 1px, rgba(0,0,0,0) 1px 14px)",
    headerBg: "rgba(255,255,255,0.94)", headerBorder: "3px solid #111111",
    ink: "#0B0B0B", inkSoft: "#404040", inkFaint: "#767676",
    line: "#111111", lineSoft: "#DCDCDC", lineStrong: "#111111",
    forest: "#111111", forestSoft: "#3A3A3A",
    amber: "#E4002B", amberSoft: "#FF4E63",
    clay: "#E4002B", sky: "#0B0B0B", sage: "#00713F", berry: "#E4002B",
    danger: "#E4002B", success: "#00713F",
    glowAccent: "3px 3px 0 rgba(17,17,17,0.9)",
    fontDisplay: "'Archivo', 'Helvetica Neue', Arial, sans-serif",
    fontBody: "'Archivo', 'Helvetica Neue', Arial, sans-serif",
    h1Size: 26, h1Weight: 800, h1Case: "uppercase", h1Tracking: -0.8, h1Style: "italic",
    labelCase: "uppercase", labelWeight: 800, labelTracking: 1.6,
    bodyWeight: 700,
    radiusCard: "16px", radiusCardLg: "20px", radiusChip: "12px", radiusPill: "12px",
    cardBorderWidth: 2, cardBorderColor: "#111111",
    cardShadow: "4px 4px 0 rgba(17,17,17,0.16)",
    hoverLift: "translate(-2px,-2px)", hoverShadow: "6px 6px 0 rgba(17,17,17,0.9)",
    chipSize: 44, checkboxShape: "square",
    navRadius: "12px", navCase: "uppercase", navWeight: 800, navTracking: 1,
    ringThickness: 6, missionMin: 300,
  },

  // 5 — CLAUDE : chaleur terracotta, serif Lora, papier ivoire,
  //     états écrits en toutes lettres dans des pilules.
  claude: {
    family: "claude", label: "Claude", swatch: "#CC785C", swatch2: "#F0ECE1",
    tagline: "Prends ton temps, avance quand même.",
    canvas: "#FAF9F5", canvasDeep: "#F1EDE3", panel: "#FFFFFF",
    appBg:
      "radial-gradient(900px 500px at 100% -8%, #F7E6DC 0%, rgba(247,230,220,0) 60%)," +
      "radial-gradient(800px 480px at -10% 10%, #F3F1E6 0%, rgba(243,241,230,0) 58%)," +
      "#FAF9F5",
    headerBg: "rgba(250,249,245,0.9)", headerBorder: "1px solid #E9E1D6",
    ink: "#141413", inkSoft: "#6C6A64", inkFaint: "#918C81",
    line: "#E6DFD8", lineSoft: "#F1EBE3",
    forest: "#CC785C", forestSoft: "#B5674A",
    amber: "#D99A5B", amberSoft: "#EDC49A",
    clay: "#B5674A", sky: "#7C8B9E", sage: "#6FA97E", berry: "#B0607E",
    danger: "#C0392B", success: "#5DA971",
    glowAccent: "0 8px 22px rgba(204,120,92,0.30)",
    fontDisplay: "'Lora', Georgia, serif", fontBody: "'Inter', sans-serif",
    h1Size: 25, h1Weight: 600, h1Tracking: -0.3,
    labelCase: "uppercase", labelWeight: 600, labelTracking: 0.9,
    bodyWeight: 500,
    radiusCard: "18px", radiusCardLg: "22px", radiusChip: "999px",
    cardBorderWidth: 1, cardShadow: "0 2px 8px rgba(80,60,45,0.05)",
    hoverShadow: "0 10px 28px rgba(120,80,60,0.14)",
    chipSize: 42, checkboxShape: "circle",
    ringThickness: 3, missionMin: 252,
  },

  // 6 — AURORE : verre dépoli sur ciel pastel vif, cadrans lumineux,
  //     dégradés violets, halos.
  aurore: {
    family: "aurore", label: "Aurore", swatch: "#7B6CF6", swatch2: "#F79BC4",
    tagline: "Une belle journée à faire éclore.",
    canvas: "#FBFAFF", canvasDeep: "#F0EDFB", panel: "rgba(255,255,255,0.72)",
    appBg:
      "radial-gradient(760px 620px at 4% -8%, #FFD9C5 0%, rgba(255,217,197,0) 62%)," +
      "radial-gradient(720px 560px at 98% 4%, #D9D0FF 0%, rgba(217,208,255,0) 60%)," +
      "radial-gradient(820px 640px at 46% 108%, #C9F0E2 0%, rgba(201,240,226,0) 62%)," +
      "radial-gradient(600px 500px at 88% 82%, #FFDFEE 0%, rgba(255,223,238,0) 60%)," +
      "#FBFAFF",
    headerFloat: true,
    headerBg: "rgba(255,255,255,0.6)", headerBlur: 18, headerBorder: "1px solid rgba(255,255,255,0.9)",
    headerShadow: "0 8px 28px rgba(110,95,180,0.12)",
    ink: "#241F45", inkSoft: "#5D5680", inkFaint: "#8A83A8",
    line: "rgba(255,255,255,0.92)", lineSoft: "rgba(210,205,240,0.55)",
    lineStrong: "rgba(140,128,196,0.42)",
    forest: "#7B6CF6", forestSoft: "#9A8DFF",
    amber: "#F5A65B", amberSoft: "#FFCB9A",
    clay: "#F2836E", sky: "#57BDEA", sage: "#4CC4A0", berry: "#EB7BB5",
    danger: "#E8607D", success: "#4CC4A0",
    accentGrad: "linear-gradient(135deg,#7B6CF6 0%,#B57BF0 55%,#F79BC4 100%)",
    glowAccent: "0 10px 26px rgba(123,108,246,0.34)",
    fontDisplay: "'Outfit', sans-serif", fontBody: "'Outfit', sans-serif",
    h1Size: 25, h1Weight: 600, h1Tracking: -0.6,
    labelCase: "uppercase", labelWeight: 600, labelTracking: 1.4,
    bodyWeight: 500,
    radiusCard: "22px", radiusCardLg: "26px", radiusChip: "18px",
    cardBg: "rgba(255,255,255,0.66)", cardBorderWidth: 1, cardBorderColor: "rgba(255,255,255,0.95)",
    cardShadow: "0 8px 30px rgba(96,84,168,0.12)", cardBlur: 16,
    hoverLift: "translateY(-3px)", hoverShadow: "0 16px 42px rgba(96,84,168,0.18)",
    chipSize: 44, checkboxShape: "circle",
    ringThickness: 4, missionMin: 200,
  },

  // 7 — BENTO : tout est tuile. Mosaïque dense à gros arrondis,
  //     bordures fines, une couleur vive par compartiment, encre noire.
  bento: {
    family: "bento", label: "Bento", swatch: "#17181C", swatch2: "#FFB020",
    tagline: "Tout sur un plateau.",
    canvas: "#FAFAF7", canvasDeep: "#F1F1EC", panel: "#FFFFFF",
    appBg: "#FAFAF7",
    headerFloat: true,
    headerBg: "#FFFFFF", headerBorder: "1.5px solid #E8E8E2",
    headerShadow: "0 2px 10px rgba(23,24,28,0.05)",
    ink: "#17181C", inkSoft: "#4E4F55", inkFaint: "#8C8D93",
    line: "#E8E8E2", lineSoft: "#F1F1EC",
    forest: "#17181C", forestSoft: "#3A3B41",
    amber: "#FFB020", amberSoft: "#FFD066",
    clay: "#FF6B4A", sky: "#2AA8E0", sage: "#34B27A", berry: "#E45DBF",
    danger: "#E5484D", success: "#34B27A",
    glowAccent: "0 6px 16px rgba(23,24,28,0.22)",
    fontDisplay: "'Plus Jakarta Sans', sans-serif", fontBody: "'Plus Jakarta Sans', sans-serif",
    h1Size: 24, h1Weight: 800, h1Tracking: -0.6,
    labelCase: "uppercase", labelWeight: 800, labelTracking: 1.2,
    bodyWeight: 600,
    radiusCard: "20px", radiusCardLg: "24px", radiusChip: "14px",
    cardBorderWidth: 1.5, cardBorderColor: "#E8E8E2", cardShadow: "0 1px 2px rgba(23,24,28,0.04)",
    hoverLift: "translateY(-2px)", hoverShadow: "0 10px 24px rgba(23,24,28,0.10)",
    chipSize: 42, checkboxShape: "square",
    navRadius: "14px", ringThickness: 4, missionMin: 200,
  },

  // 8 — POP : conservé tel quel (il plaît). Couleurs électriques,
  //     cartes épaisses, ombres décalées colorées.
  pop: {
    family: "pop", label: "Pop", swatch: "#6E3AFF", swatch2: "#FF4D8D",
    tagline: "Allez, on attaque !",
    canvas: "#FFFFFF", canvasDeep: "#F3F0FF", panel: "#FFFFFF",
    appBg:
      "radial-gradient(680px 520px at 0% 0%, rgba(110,58,255,0.10) 0%, rgba(110,58,255,0) 60%)," +
      "radial-gradient(620px 520px at 100% 6%, rgba(0,194,209,0.12) 0%, rgba(0,194,209,0) 58%)," +
      "radial-gradient(700px 560px at 60% 110%, rgba(255,77,141,0.10) 0%, rgba(255,77,141,0) 60%)," +
      "#FFFFFF",
    headerBg: "rgba(255,255,255,0.9)", headerBorder: "2px solid #EDE7FF",
    ink: "#15122B", inkSoft: "#4B4570", inkFaint: "#8781A8",
    line: "#E4DEFF", lineSoft: "#F1EDFF",
    forest: "#6E3AFF", forestSoft: "#8B5CFF",
    amber: "#FF8A00", amberSoft: "#FFB65C",
    clay: "#FF4D8D", sky: "#00B8CC", sage: "#3BC46B", berry: "#C93AFF",
    danger: "#FF3D5E", success: "#3BC46B",
    accentGrad: "linear-gradient(135deg,#6E3AFF 0%,#C93AFF 100%)",
    glowAccent: "0 6px 0 rgba(78,32,190,0.35)",
    fontDisplay: "'Space Grotesk', sans-serif", fontBody: "'Space Grotesk', sans-serif",
    h1Size: 25, h1Weight: 700, h1Tracking: -1,
    labelCase: "uppercase", labelWeight: 700, labelTracking: 1.3,
    bodyWeight: 600,
    radiusCard: "20px", radiusCardLg: "24px", radiusChip: "16px",
    cardBorderWidth: 2, cardBorderColor: "#E4DEFF",
    cardShadow: "0 4px 0 rgba(110,58,255,0.13)",
    hoverLift: "translateY(-3px)", hoverShadow: "0 8px 0 rgba(110,58,255,0.22)",
    chipSize: 38, checkboxShape: "circle",
    navRadius: "14px", navWeight: 700,
    ringThickness: 5, missionMin: 0,
  },
};

// Anciens identifiants de thème encore stockés côté serveur → équivalents actuels
const LEGACY_THEME_IDS = { nike: "elan", apple: "studio", encre: "claude", sumi: "bento" };

// PALETTE = thème courant, muté en place (les composants la lisent au render).
const PALETTE = { ...BASE_TOKENS, ...THEMES.clairiere };

function applyTheme(id) {
  const t = THEMES[id];
  if (!t) return;
  Object.assign(PALETTE, BASE_TOKENS, t);
}

// ---------- Helpers de style dérivés du thème ----------
function ctrlLine() {
  return PALETTE.lineStrong || PALETTE.line;
}

function cardBorder(colorOverride) {
  const w = PALETTE.cardBorderWidth;
  if (!w) return "none";
  return `${w}px solid ${colorOverride || PALETTE.cardBorderColor || PALETTE.line}`;
}

// Style de carte unique — tous les panneaux de l'app passent par là.
function cardStyle(extra = {}) {
  return {
    background: PALETTE.cardBg || PALETTE.panel,
    border: cardBorder(extra.borderColor),
    borderRadius: PALETTE.radiusCard,
    boxShadow: PALETTE.cardShadow,
    backdropFilter: PALETTE.cardBlur ? `blur(${PALETTE.cardBlur}px)` : undefined,
    WebkitBackdropFilter: PALETTE.cardBlur ? `blur(${PALETTE.cardBlur}px)` : undefined,
    ...extra,
    borderColor: undefined,
  };
}

function accentFill() {
  return PALETTE.accentGrad || PALETTE.forest;
}

function titleStyle(extra = {}) {
  return {
    fontFamily: PALETTE.fontDisplay, fontSize: PALETTE.h1Size, fontWeight: PALETTE.h1Weight,
    fontStyle: PALETTE.h1Style, textTransform: PALETTE.h1Case, letterSpacing: PALETTE.h1Tracking,
    color: PALETTE.ink, margin: 0, lineHeight: 1.12, ...extra,
  };
}

// Palette d'accents cyclique — recalculée à chaque appel pour suivre le thème actif.
function accentCycle() {
  return [PALETTE.amber, PALETTE.sky, PALETTE.berry, PALETTE.sage, PALETTE.clay, PALETTE.forestSoft];
}
function colorForIndex(i) {
  const c = accentCycle();
  return c[i % c.length];
}
function uid() {
  return Math.random().toString(36).slice(2, 10);
}
// ---------- Deux niveaux, jamais trois ----------
// Une mission a des sous-missions, et c'est tout : une sous-mission ne peut
// pas en contenir à son tour. La règle est appliquée à la lecture du store
// (et non seulement dans l'interface) pour qu'aucune donnée héritée d'une
// version précédente, d'un import ou d'une dictée mal découpée ne recrée un
// troisième niveau. Ce qui était imbriqué plus profond est remonté d'un cran.
function flattenSubs(subs) {
  if (!Array.isArray(subs)) return [];
  const out = [];
  subs.forEach((s) => {
    if (!s) return;
    const { subtasks, ...leaf } = s;
    out.push({ ...leaf, id: leaf.id || uid() });
    flattenSubs(subtasks).forEach((deep) => out.push(deep));
  });
  return out;
}

function normalizeTask(t) {
  return { ...t, subtasks: flattenSubs(t.subtasks) };
}

function normalizeTasks(tasks) {
  return Array.isArray(tasks) ? tasks.map(normalizeTask) : [];
}

function normalizeDossiers(dossiers) {
  return Array.isArray(dossiers)
    ? dossiers.map((d) => ({ ...d, tasks: normalizeTasks(d.tasks) }))
    : [];
}

// ---------- Data models ----------
function defaultState() {
  return {
    tasks: [
      { id: uid(), title: "Répondre à l'email de grand-mère", done: false },
      { id: uid(), title: "Faire les courses", done: false },
    ],
    dossiers: [
      {
        id: uid(),
        name: "Travaux appartement",
        tasks: [
          { id: uid(), title: "Trouver un artisan", done: false, subtasks: [] },
          {
            id: uid(), title: "Demander des devis", done: false,
            subtasks: [
              { id: uid(), title: "Devis plombier", done: false },
              { id: uid(), title: "Devis électricien", done: false },
            ],
          },
          { id: uid(), title: "Payer l'acompte", done: false, subtasks: [] },
        ],
      },
    ],
  };
}

function getMondayISO(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function defaultWeekly() {
  return {
    weekStart: getMondayISO(),
    groups: [
      { id: uid(), name: "Famille", icon: "Phone", tasks: [{ id: uid(), title: "Appeler Mum", icon: "Phone", done: false }] },
      { id: uid(), name: "Maison", icon: "Shirt", tasks: [
        { id: uid(), title: "Lessive", icon: "Shirt", done: false },
        { id: uid(), title: "Draps", icon: "BedDouble", done: false },
        { id: uid(), title: "AspiToile", icon: "Sparkles", done: false },
      ]},
      { id: uid(), name: "Sport", icon: "Footprints", tasks: [
        { id: uid(), title: "Jog", icon: "Footprints", done: false },
        { id: uid(), title: "Piscine", icon: "Waves", done: false },
        { id: uid(), title: "Vélo", icon: "Bike", done: false },
        { id: uid(), title: "Rando", icon: "Mountain", done: false },
      ]},
      { id: uid(), name: "Cuisine", icon: "ChefHat", tasks: [{ id: uid(), title: "Cook", icon: "ChefHat", done: false }] },
    ],
  };
}

function defaultDaily() {
  return {
    groups: [
      { id: uid(), name: "Ruisseau", icon: "Music", color: PALETTE.sky, tasks: [
        { id: uid(), title: "Solfège", icon: "Music", done: false },
        { id: uid(), title: "Oreille", icon: "Brain", done: false },
      ]},
      { id: uid(), name: "Langue", icon: "Languages", color: PALETTE.berry, tasks: [
        { id: uid(), title: "Arabe", icon: "BookOpen", done: false },
        { id: uid(), title: "Russe", icon: "Languages", done: false },
      ]},
      { id: uid(), name: "Hobbies", icon: "Gamepad2", color: PALETTE.clay, tasks: [
        { id: uid(), title: "Clarinette", icon: "Music", done: false },
        { id: uid(), title: "Échecs", icon: "Gamepad2", done: false },
      ]},
      { id: uid(), name: "Santé", icon: "Heart", color: PALETTE.sage, tasks: [
        { id: uid(), title: "Étirements", icon: "Dumbbell", done: false },
        { id: uid(), title: "Yoga", icon: "Heart", done: false },
      ]},
      { id: uid(), name: "Sport", icon: "Dumbbell", color: PALETTE.amber, tasks: [
        { id: uid(), title: "Jog", icon: "Dumbbell", done: false },
        { id: uid(), title: "Marathon", icon: "Trophy", done: false },
        { id: uid(), title: "Fractionné", icon: "Zap", done: false },
        { id: uid(), title: "Altitude", icon: "TrendingUp", done: false },
        { id: uid(), title: "Piscine", icon: "Waves", done: false },
        { id: uid(), title: "Repos", icon: "Heart", done: false },
      ]},
    ],
  };
}

function defaultSport() {
  return {
    dossiers: [
      { id: uid(), name: "Jogging", tasks: [
        { id: uid(), title: "5km facile", done: false, subtasks: [] },
        { id: uid(), title: "Repos musculaire", done: false, subtasks: [] },
      ]},
      { id: uid(), name: "Piscine", tasks: [{ id: uid(), title: "Nager 1km", done: false, subtasks: [] }] },
      { id: uid(), name: "Rando", tasks: [
        { id: uid(), title: "Préparer l'itinéraire", done: false, subtasks: [] },
        { id: uid(), title: "Vérifier la météo", done: false, subtasks: [] },
      ]},
      { id: uid(), name: "Voyage", tasks: [
        { id: uid(), title: "Réserver transports", done: false, subtasks: [] },
        { id: uid(), title: "Réserver hébergement", done: false, subtasks: [] },
        { id: uid(), title: "Faire la valise", done: false, subtasks: [] },
      ]},
    ],
  };
}

function defaultMonthly() {
  return {
    groups: [
      { id: uid(), name: "Admin", icon: "Trophy", color: PALETTE.clay, tasks: [
        { id: uid(), title: "Payer le loyer", icon: "Trophy", done: false },
        { id: uid(), title: "Vérifier les comptes", icon: "ListChecks", done: false },
      ]},
      { id: uid(), name: "Maison", icon: "Sparkles", color: PALETTE.sky, tasks: [
        { id: uid(), title: "Changer les filtres", icon: "Sparkles", done: false },
        { id: uid(), title: "Nettoyage profond", icon: "Sparkles", done: false },
      ]},
      { id: uid(), name: "Véhicule", icon: "Dumbbell", color: PALETTE.sage, tasks: [
        { id: uid(), title: "Vérifier les niveaux", icon: "Dumbbell", done: false },
        { id: uid(), title: "Laver la voiture", icon: "Waves", done: false },
      ]},
    ],
  };
}


// ---------- Fonts ----------
function useFonts() {
  useEffect(() => {
    const id = "clairiere-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2" +
      "?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700" +
      "&family=Public+Sans:wght@400;500;600;700;800" +
      "&family=Archivo:ital,wght@0,500;0,600;0,700;0,800;1,700;1,800" +
      "&family=Lora:ital,wght@0,400;0,500;0,600;1,400" +
      "&family=Inter:wght@400;500;600;700" +
      "&family=Outfit:wght@300;400;500;600;700" +
      "&family=Space+Grotesk:wght@400;500;600;700" +
      "&family=Plus+Jakarta+Sans:wght@400;500;600;700;800" +
      "&family=Roboto+Flex:opsz,wght@8..144,400;8..144,500;8..144,600;8..144,700" +
      "&display=swap";
    document.head.appendChild(link);
  }, []);
}
// ---------- Progress ring (cerne d'arbre) ----------
function ProgressRing({ pct, color, size = 34, thickness }) {
  const stroke = thickness || PALETTE.ringThickness || Math.max(3, size * 0.13);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke={PALETTE.lineSoft} strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" opacity={pct > 0 ? 1 : 0}
        style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

function dossierPct(dossier) {
  const leaves = [];
  dossier.tasks.forEach((t) => {
    if (t.subtasks && t.subtasks.length) t.subtasks.forEach((s) => leaves.push(s.done));
    else leaves.push(t.done);
  });
  if (!leaves.length) return 0;
  return Math.round((leaves.filter(Boolean).length / leaves.length) * 100);
}

// ---------- AI ----------
// Repechage par le modele local. N'est appele QUE si `parseIntent` a rendu
// null : les tournures courantes ne passent jamais par ici.
async function classifyIntent(text) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error(`chat_${response.status}`);
    return await response.json();
  } catch (e) {
    console.error("chat call failed", e);
    return { intent: "none", target: "", degraded: true };
  }
}

async function scanGmailForActions() {
  const systemPrompt = `Analyse les emails des 30 derniers jours en INBOX. Remonte UNIQUEMENT ceux qui demandent une action.
Groupe-les par catégorie/thème (ex: Finance, Travail, Personnel, Commandes, Administratif, etc).
Réponds UNIQUEMENT avec un JSON array de groupes, pas de texte :
[{"group":"Catégorie","color":"#HEX","items":[{"sender":"...","title":"...","summary":"..."}]}]`;
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: "Analyse mes emails des 30 derniers jours." }],
        mcp_servers: [{ type: "url", url: "https://gmailmcp.googleapis.com/mcp/v1", name: "gmail-mcp" }],
      }),
    });
    const data = await response.json();
    const textContent = data.content?.find((b) => b.type === "text")?.text || "[]";
    const parsed = JSON.parse(textContent.replace(/```json|```/g, "").trim());
    return Array.isArray(parsed)
      ? parsed.map((g) => ({
          id: uid(), group: g.group || "Divers", color: g.color || PALETTE.amber,
          items: (g.items || []).map((it) => ({ id: uid(), sender: it.sender || "?", title: it.title || "Action", summary: it.summary || "" })),
        }))
      : [];
  } catch (e) {
    console.error("gmail scan failed", e);
    return [];
  }
}

// ---------- Persistence (robuste) ----------
const STORAGE_KEYS = {
  state: "clairiere:v4", chat: "clairiere:chat", weekly: "clairiere:weekly",
  daily: "clairiere:daily", sport: "clairiere:sport", emails: "clairiere:emails",
  theme: "clairiere:theme", monthly: "clairiere:monthly", domaines: "clairiere:domaines",
};

// Rend { ok, value }. `ok:false` = le serveur n'a pas répondu (réseau coupé,
// 500, service en train de redémarrer). Confondre ce cas avec « clé absente »
// coûtait toutes les données : l'app se croyait vide, puis le premier
// enregistrement écrasait le store avec ses valeurs par défaut.
async function storageGet(key) {
  let res;
  try {
    res = await fetch(`/api/storage/${encodeURIComponent(key)}`);
  } catch {
    return { ok: false, value: null };
  }
  if (res.status === 404) return { ok: true, value: null };
  if (!res.ok) return { ok: false, value: null };
  try {
    const data = await res.json();
    return { ok: true, value: data ? JSON.parse(data.value) : null };
  } catch {
    // Valeur illisible : elle est de toute façon inexploitable, on repart des
    // défauts pour cette clé plutôt que de bloquer les écritures à jamais.
    return { ok: true, value: null };
  }
}
async function storageSet(key, value) {
  try {
    const res = await fetch(`/api/storage/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(value) }),
    });
    return res.ok;
  } catch (e) {
    console.error("save failed", key, e);
    return false;
  }
}


// ---------- Icon helper ----------
// Les vraies icônes cette fois (Shirt, Bike, Mountain… étaient aliasées
// faute d'import) : la variété d'icônes fait partie du langage visuel.
const ICON_MAP = {
  Music, Brain, BookOpen, Dumbbell, Heart, Gamepad2, Languages, Phone,
  Zap, Shirt, Waves, Bike, Mountain, ChefHat, Trophy, TrendingUp, Plus,
  Footprints, Sparkles, BedDouble, ListChecks, Flame, Sun, Sprout,
};
function getIcon(name) {
  return ICON_MAP[name] || Circle;
}

// ============================================================
// PRIMITIVES
// ============================================================
function PillButton({ children, onClick, variant = "ghost", icon: Icon, disabled, style }) {
  const variants = {
    primary: { background: accentFill(), color: PALETTE.onAccent, boxShadow: PALETTE.glowAccent },
    amber: { background: PALETTE.amber, color: PALETTE.onAccent, boxShadow: PALETTE.glowAccent },
    ghost: { background: PALETTE.canvasDeep, color: PALETTE.inkSoft, border: PALETTE.cardBorderWidth >= 2 ? cardBorder() : "none" },
    danger: { background: PALETTE.danger, color: "#fff" },
    dangerGhost: { background: `${PALETTE.danger}14`, color: PALETTE.danger },
  };
  return (
    <button
      className="cl-press"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant], padding: PALETTE.navPad, fontSize: 12,
        fontWeight: variant === "ghost" ? 600 : PALETTE.navWeight,
        textTransform: PALETTE.navCase, letterSpacing: PALETTE.navTracking,
        borderRadius: PALETTE.radiusPill, display: "inline-flex", alignItems: "center", gap: 6,
        cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1,
        fontFamily: PALETTE.fontBody, whiteSpace: "nowrap", minHeight: 34,
        transition: "all 0.18s cubic-bezier(.34,1.4,.64,1)", ...style,
      }}
    >
      {Icon && <Icon size={13} />}
      {children}
    </button>
  );
}

function IconButton({ icon: Icon, onClick, variant = "ghost", size = 34, iconSize = 15, title, color, style, disabled }) {
  const variants = {
    ghost: { background: PALETTE.canvasDeep, color: PALETTE.inkSoft },
    primary: { background: accentFill(), color: PALETTE.onAccent, boxShadow: PALETTE.glowAccent },
    amber: { background: PALETTE.amber, color: PALETTE.onAccent },
    subtle: { background: "transparent", color: PALETTE.inkFaint },
  };
  const round = PALETTE.radiusPill === "999px";
  const iconColor = color || variants[variant].color;
  return (
    <button
      className="cl-press"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        ...variants[variant], width: size, height: size,
        borderRadius: round ? "50%" : PALETTE.radiusChip,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "all 0.18s cubic-bezier(.34,1.4,.64,1)", ...style,
      }}
    >
      <Icon size={iconSize} color={iconColor} />
    </button>
  );
}

// En-tête de section : icône + libellé + info à droite, une seule ligne.
function SectionHead({ icon: Icon, label, color, right, style }) {
  const accent = color || PALETTE.forest;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8, minHeight: 24, ...style }}>
      {Icon && (
        <span style={{
          width: 22, height: 22, borderRadius: PALETTE.radiusPill === "999px" ? "50%" : 7,
          background: `${accent}1c`, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={13} color={accent} strokeWidth={2.4} />
        </span>
      )}
      <span style={{
        fontSize: 11.5, fontWeight: PALETTE.labelWeight, letterSpacing: PALETTE.labelTracking,
        textTransform: PALETTE.labelCase, color: PALETTE.inkSoft, flex: 1, minWidth: 0,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{label}</span>
      {right}
    </div>
  );
}

// Badge icône coloré — forme pilotée par le thème
function IconBadge({ icon: Icon, color, size = 36 }) {
  const round = PALETTE.radiusPill === "999px";
  return (
    <span style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: round ? size * 0.34 : PALETTE.radiusChip,
      background: `${color}1c`,
      border: PALETTE.cardBorderWidth >= 2 ? `2px solid ${color}` : "none",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={size * 0.5} color={color} strokeWidth={2.2} />
    </span>
  );
}

function ProgressBar({ pct, color, height = 6 }) {
  const r = PALETTE.radiusPill === "999px" ? 99 : 4;
  return (
    <div style={{ height, background: PALETTE.canvasDeep, borderRadius: r, overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: r, transition: "width 0.5s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function Checkbox({ done, size = 18 }) {
  const isSquare = PALETTE.checkboxShape === "square";
  return (
    <span
      className={done ? "cl-checked" : undefined}
      style={{
        width: size, height: size, borderRadius: isSquare ? Math.max(4, size * 0.24) : "50%", flexShrink: 0,
        border: `2px solid ${done ? PALETTE.forest : ctrlLine()}`,
        background: done ? accentFill() : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s cubic-bezier(.34,1.5,.64,1)",
      }}
    >
      {done && <Check size={size * 0.62} color={PALETTE.onAccent} strokeWidth={3} />}
    </span>
  );
}

function EmptyState({ icon: Icon = Trees, title, subtitle }) {
  return (
    <div style={{ textAlign: "center", padding: "28px 20px", color: PALETTE.inkFaint }}>
      <span style={{
        width: 50, height: 50, display: "inline-flex", alignItems: "center", justifyContent: "center",
        borderRadius: PALETTE.radiusPill === "999px" ? "50%" : PALETTE.radiusChip,
        background: `${PALETTE.forest}0E`, marginBottom: 10,
      }}>
        <Icon size={23} color={PALETTE.forest} strokeWidth={1.8} />
      </span>
      <div style={{ fontFamily: PALETTE.fontDisplay, fontSize: 15, fontWeight: 600, color: PALETTE.ink }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, marginTop: 5, color: PALETTE.inkFaint }}>{subtitle}</div>}
    </div>
  );
}

function DragHandle({ onPointerDown }) {
  return (
    <span onPointerDown={onPointerDown} style={{ touchAction: "none", cursor: "grab", padding: 4, display: "flex", alignItems: "center", flexShrink: 0 }}>
      <GripVertical size={13} color={PALETTE.inkFaint} opacity={0.45} />
    </span>
  );
}

function StatusDot({ status }) {
  const color = status === "error" ? PALETTE.danger : status === "question" ? PALETTE.amber : PALETTE.success;
  return <span style={{ width: 8, height: 8, borderRadius: 999, background: color, boxShadow: `0 0 0 3px ${color}22`, flexShrink: 0, display: "inline-block" }} />;
}

function TrashLink({ onClick, size = 13 }) {
  return (
    <button
      className="cl-press"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title="Supprimer"
      style={{ background: "transparent", padding: 5, display: "flex", alignItems: "center", flexShrink: 0, opacity: 0.5 }}
    >
      <Trash2 size={size} color={PALETTE.inkFaint} />
    </button>
  );
}

function strike(done) {
  return {
    color: done ? PALETTE.inkFaint : PALETTE.ink,
    textDecoration: done ? "line-through" : "none",
    wordBreak: "break-word",
  };
}

// ---------- Confirm inline ----------
function ConfirmBar({ label, confirmLabel = "Confirmer", onConfirm, onCancel }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, background: `${PALETTE.danger}10`,
      border: `1.5px solid ${PALETTE.danger}33`, borderRadius: PALETTE.radiusCard, padding: "10px 12px", marginBottom: 12,
    }}>
      <AlertTriangle size={14} color={PALETTE.danger} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: PALETTE.ink, flex: 1, fontWeight: 500 }}>{label}</span>
      <PillButton variant="danger" onClick={onConfirm}>{confirmLabel}</PillButton>
      <PillButton variant="ghost" onClick={onCancel}>Annuler</PillButton>
    </div>
  );
}

// ---------- Sortable list (drag 2D) ----------
function SortableList({ items, keyId, onReorder, renderItem, gridStyle }) {
  const containerRef = useRef(null);
  const [dragState, setDragState] = useState(null);

  const startDrag = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const rows = Array.from(container.children);
    const rects = rows.map((el) => el.getBoundingClientRect());
    const startX = e.clientX, startY = e.clientY;
    setDragState({ index, offsetX: 0, offsetY: 0, hoverIndex: index, startX, startY, rects });

    const move = (ev) => {
      const clientX = ev.clientX, clientY = ev.clientY;
      if (clientX == null || clientY == null) return;
      setDragState((prev) => {
        if (!prev) return prev;
        const offsetX = clientX - prev.startX, offsetY = clientY - prev.startY;
        let bestIdx = prev.index, bestDist = Infinity;
        prev.rects.forEach((r, i) => {
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          const d = (clientX - cx) ** 2 + (clientY - cy) ** 2;
          if (d < bestDist) { bestDist = d; bestIdx = i; }
        });
        return { ...prev, offsetX, offsetY, hoverIndex: bestIdx };
      });
    };
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      setDragState((prev) => {
        if (prev && prev.hoverIndex !== prev.index) {
          const next = items.slice();
          const [moved] = next.splice(prev.index, 1);
          next.splice(prev.hoverIndex, 0, moved);
          onReorder(next);
        }
        return null;
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
  };

  return (
    <div ref={containerRef} style={gridStyle}>
      {items.map((item, i) => {
        const dragging = dragState && dragState.index === i;
        const isHoverTarget = dragState && dragState.hoverIndex === i && dragState.index !== i;
        return (
          <div key={item[keyId]} style={{ outline: isHoverTarget ? `2px dashed ${PALETTE.amber}` : "none", outlineOffset: 2, borderRadius: 16 }}>
            <div style={dragging ? { transform: `translate(${dragState.offsetX}px, ${dragState.offsetY}px)`, position: "relative", zIndex: 40, boxShadow: "0 14px 30px rgba(31,42,30,0.18)" } : undefined}>
              {renderItem(item, i, (e) => startDrag(e, i))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// AJOUT DE TÂCHES — appui court / appui long
// ------------------------------------------------------------
// Un même bouton porte les deux gestes :
//   appui court -> ouvre un bandeau de saisie clavier
//   appui long  -> enregistre la voix tant que le doigt reste posé
// Relâcher hors du bouton annule : c'est le geste habituel des
// messageries vocales, on garde le même réflexe.
// ============================================================
function HoldButton({
  onTap, onHoldStart, onHoldEnd, onHoldCancel, onClick,
  holdMs = 350, disabled, title, style, children,
}) {
  const holdingRef = useRef(false);
  const timerRef = useRef(null);
  const [held, setHeld] = useState(false);

  const clearTimer = () => { clearTimeout(timerRef.current); timerRef.current = null; };
  const endHold = (cancelled) => {
    holdingRef.current = false;
    setHeld(false);
    (cancelled ? onHoldCancel : onHoldEnd)?.();
  };

  const handleDown = (e) => {
    if (disabled) return;
    e.preventDefault();
    // La capture garantit de recevoir le pointerup même si le doigt glisse
    // hors du bouton — sans elle, un enregistrement pourrait rester ouvert.
    // Elle échoue si le pointeur n'est plus actif ; ce n'est pas bloquant, mais
    // sans ce garde-fou l'exception empêcherait d'armer l'appui long.
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}
    timerRef.current = setTimeout(() => {
      holdingRef.current = true;
      setHeld(true);
      navigator.vibrate?.(25);
      onHoldStart?.();
    }, holdMs);
  };

  const handleUp = (e) => {
    if (disabled) return;
    e.preventDefault();
    clearTimer();
    if (!holdingRef.current) { onTap?.(); return; }
    // Relâché loin du bouton = geste d'annulation.
    const r = e.currentTarget.getBoundingClientRect();
    const outside = e.clientX < r.left - 30 || e.clientX > r.right + 30
      || e.clientY < r.top - 30 || e.clientY > r.bottom + 30;
    endHold(outside);
  };

  const handleCancel = () => { clearTimer(); if (holdingRef.current) endHold(true); };
  useEffect(() => clearTimer, []);

  return (
    <button
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleCancel}
      onClick={onClick}
      onContextMenu={(e) => e.preventDefault()}
      disabled={disabled}
      title={title}
      style={{
        touchAction: "none", WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none",
        transform: held ? "scale(1.06)" : "none",
        transition: "transform .18s cubic-bezier(.34,1.4,.64,1)",
        cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.45 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// Le textarea grandit avec le texte : dicter trois phrases ne doit pas
// donner un champ d'une ligne où l'on ne relit rien.
function useAutoGrow(ref, value, max) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  }, [ref, value, max]);
}

// ============================================================
// SAISIE — le champ est TOUJOURS visible, une peau par famille.
// Un seul bouton porte les deux gestes : appui court = envoyer,
// appui long = dicter tant que le doigt reste posé.
// ============================================================
function composerSkin(sub) {
  const f = PALETTE.family;
  const btn = sub ? 34 : 44;
  const base = { placeholder: PALETTE.inkFaint, icon: PALETTE.onAccent, btn };

  if (f === "studio") {
    return {
      ...base,
      wrap: {
        background: PALETTE.panel, border: "none",
        borderRadius: sub ? 12 : 16, padding: sub ? "4px 4px 4px 11px" : "6px 6px 6px 14px",
        gap: 8, alignItems: "flex-end", boxShadow: sub ? "none" : PALETTE.cardShadow,
      },
      field: { color: PALETTE.ink, fontSize: sub ? 13.5 : 15, fontWeight: 400, letterSpacing: -0.2 },
      button: { width: btn, height: btn, borderRadius: "50%", background: accentFill(), boxShadow: "none" },
    };
  }
  if (f === "matiere") {
    // Barre de recherche M3 : pilule tonale pleine, bouton rond posé dedans.
    return {
      ...base,
      wrap: {
        background: PALETTE.canvasDeep, border: "none",
        borderRadius: 999, padding: sub ? "4px 4px 4px 13px" : "6px 6px 6px 16px",
        gap: 8, alignItems: "flex-end",
      },
      field: { color: PALETTE.ink, fontSize: sub ? 13.5 : 15, fontWeight: 400 },
      button: { width: btn, height: btn, borderRadius: "50%", background: accentFill(), boxShadow: "none" },
    };
  }
  if (f === "clairiere") {
    return {
      ...base,
      wrap: {
        background: PALETTE.panel, border: `1.5px solid ${PALETTE.line}`,
        borderRadius: sub ? "12px 5px 12px 5px" : "18px 8px 18px 8px",
        padding: sub ? "4px 4px 4px 11px" : "6px 6px 6px 14px",
        gap: 8, alignItems: "flex-end", boxShadow: PALETTE.cardShadow,
      },
      field: { color: PALETTE.ink, fontSize: sub ? 13.5 : 15, fontWeight: 500 },
      button: { width: btn, height: btn, borderRadius: "50%", background: accentFill(), boxShadow: PALETTE.glowAccent },
    };
  }
  if (f === "elan") {
    return {
      ...base,
      wrap: {
        background: PALETTE.panel, border: `2px solid ${PALETTE.ink}`,
        borderRadius: sub ? 12 : 16, padding: sub ? "4px 4px 4px 10px" : "6px 6px 6px 13px",
        gap: 8, alignItems: "flex-end", boxShadow: sub ? "none" : "4px 4px 0 rgba(17,17,17,0.9)",
      },
      field: { color: PALETTE.ink, fontSize: sub ? 13 : 14.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 },
      button: { width: btn, height: btn, borderRadius: 10, background: PALETTE.amber, boxShadow: "none" },
    };
  }
  if (f === "claude") {
    return {
      ...base,
      wrap: {
        background: PALETTE.panel, border: `1px solid ${PALETTE.line}`,
        borderRadius: sub ? 16 : 22, padding: sub ? "5px 5px 5px 13px" : "7px 7px 7px 16px",
        gap: 9, alignItems: "flex-end", boxShadow: PALETTE.cardShadow,
      },
      field: { color: PALETTE.ink, fontSize: sub ? 13.5 : 15, fontWeight: 400, lineHeight: 1.5 },
      button: { width: btn, height: btn, borderRadius: "50%", background: accentFill(), boxShadow: PALETTE.glowAccent },
    };
  }
  if (f === "aurore") {
    return {
      ...base,
      wrap: {
        background: "rgba(255,255,255,0.72)", border: "1px solid rgba(255,255,255,0.95)",
        borderRadius: sub ? 16 : 24, padding: sub ? "4px 4px 4px 12px" : "6px 6px 6px 15px",
        gap: 9, alignItems: "flex-end",
        boxShadow: "0 10px 30px rgba(96,84,168,0.14)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      },
      field: { color: PALETTE.ink, fontSize: sub ? 13.5 : 15, fontWeight: 400 },
      button: { width: btn, height: btn, borderRadius: "50%", background: PALETTE.accentGrad, boxShadow: PALETTE.glowAccent },
    };
  }
  if (f === "bento") {
    return {
      ...base,
      wrap: {
        background: PALETTE.panel, border: `1.5px solid ${PALETTE.line}`,
        borderRadius: sub ? 14 : 18, padding: sub ? "4px 4px 4px 11px" : "6px 6px 6px 14px",
        gap: 8, alignItems: "flex-end", boxShadow: PALETTE.cardShadow,
      },
      field: { color: PALETTE.ink, fontSize: sub ? 13.5 : 14.5, fontWeight: 500 },
      button: { width: btn, height: btn, borderRadius: 13, background: PALETTE.ink, boxShadow: "none" },
    };
  }
  // pop : la carte épaisse d'origine
  return {
    ...base,
    wrap: {
      background: PALETTE.cardBg || PALETTE.panel, border: cardBorder(),
      borderRadius: sub ? PALETTE.radiusChip : PALETTE.radiusCard,
      padding: sub ? "5px 5px 5px 11px" : "6px 6px 6px 14px",
      gap: 8, alignItems: "flex-end", boxShadow: PALETTE.cardShadow,
    },
    field: { color: PALETTE.ink, fontSize: sub ? 13.5 : 15, fontWeight: PALETTE.bodyWeight },
    button: { width: btn, height: btn, borderRadius: PALETTE.radiusChip, background: accentFill(), boxShadow: PALETTE.glowAccent },
  };
}

// Champ + bouton. Le bouton est un HoldButton : tap = envoyer, maintien = dicter.
function Composer({ placeholder, onSubmit, voice, voiceArg, sub = false, autoFocus = false }) {
  const [value, setValue] = useState("");
  const ref = useRef(null);
  const skin = composerSkin(sub);
  useAutoGrow(ref, value, sub ? 96 : 140);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);

  const submit = () => {
    const v = value.trim();
    if (!v) return;
    setValue("");
    onSubmit(v);
  };

  const armed = !!value.trim();
  const Icon = armed ? Check : Mic;

  return (
    <div
      className="cl-composer"
      onClick={(e) => e.stopPropagation()}
      style={{ "--cl-ph": skin.placeholder, display: "flex", ...skin.wrap }}
    >
      <textarea
        ref={ref}
        className="cl-field"
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
        }}
        placeholder={placeholder}
        style={{
          flex: 1, minWidth: 0, border: "none", background: "transparent", resize: "none",
          outline: "none", fontFamily: PALETTE.fontBody, lineHeight: 1.4,
          padding: sub ? "6px 0" : "8px 0", maxHeight: sub ? 96 : 140, ...skin.field,
        }}
      />
      <HoldButton
        title={armed ? "Envoyer — maintenir pour dicter" : "Maintenir pour dicter"}
        onTap={submit}
        onHoldStart={() => voice?.start(voiceArg)}
        onHoldEnd={() => voice?.end()}
        onHoldCancel={() => voice?.cancel()}
        style={{
          flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          gap: 5, ...skin.button,
        }}
      >
        <Icon size={sub ? 15 : 18} color={skin.icon} strokeWidth={2.4} />
      </HoldButton>
    </div>
  );
}

// Bandeau plein écran pendant l'enregistrement.
function RecordingOverlay({ live }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!live) return undefined;
    const i = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [live]);
  return (
    <div style={{
      position: "fixed", bottom: 64, left: 12, right: 12, maxWidth: 730, margin: "0 auto",
      background: PALETTE.ink, color: PALETTE.canvas, borderRadius: PALETTE.radiusCardLg,
      padding: "13px 16px", display: "flex", alignItems: "center", gap: 11, zIndex: 300,
      boxShadow: "0 18px 44px rgba(0,0,0,0.3)",
    }}>
      <span className="cl-rec-dot" style={{
        width: 11, height: 11, borderRadius: "50%", background: PALETTE.danger, flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>
          {live ? `J'écoute… ${secs}s` : "Ouverture du micro…"}
        </div>
        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
          {live
            ? "Relâche pour valider · glisse le doigt à côté pour annuler"
            : "Garde le doigt posé"}
        </div>
      </div>
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="cl-rise" style={{
      position: "fixed", bottom: 64, left: 12, right: 12, maxWidth: 730, margin: "0 auto",
      background: PALETTE.ink, color: PALETTE.canvas, borderRadius: PALETTE.radiusChip,
      padding: "10px 14px", fontSize: 12.5, lineHeight: 1.4, zIndex: 300, textAlign: "center",
      boxShadow: "0 14px 34px rgba(0,0,0,0.26)",
    }}>
      {message}
    </div>
  );
}

// Ligne d'attente pendant transcription/découpage d'une dictée.
function PendingRow({ phase, indent = false }) {
  const label = phase === "thinking" ? "Découpage en sous-missions…" : "Transcription…";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 9, minHeight: indent ? 38 : 48,
      background: PALETTE.canvasDeep, border: `1px dashed ${ctrlLine()}`,
      borderRadius: indent ? PALETTE.radiusChip : PALETTE.radiusCard,
      padding: indent ? "7px 10px" : "8px 12px",
      marginTop: indent ? 6 : 0,
    }}>
      <Loader2 size={indent ? 13 : 15} color={PALETTE.inkFaint} className="cl-spin" />
      <span style={{ fontSize: indent ? 12.5 : 13.5, color: PALETTE.inkFaint, fontStyle: "italic" }}>{label}</span>
    </div>
  );
}

// ============================================================
// BANDEAU DU JOUR — compact (≤ 76px), une architecture par famille
// ============================================================
function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "Belle nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bel après-midi";
  return "Bonne soirée";
}

function todayLabel() {
  return new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function pepTalk(pct, total) {
  if (!total) return "Rien de prévu : le terrain est libre.";
  if (pct === 100) return "Tout est fait. Journée pleine.";
  if (pct >= 75) return "Dernière ligne droite.";
  if (pct >= 40) return "Bien lancé, ça avance.";
  if (pct > 0) return "Le plus dur est derrière : c'est commencé.";
  return "Une seule case à cocher pour démarrer.";
}

function HeroRing({ pct, size = 52, color, textColor }) {
  return (
    <div style={{ position: "relative", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <ProgressRing pct={pct} color={color || PALETTE.forest} size={size} />
      <span style={{
        position: "absolute", fontSize: size * 0.23, fontWeight: 700, fontFamily: PALETTE.fontBody,
        color: textColor || PALETTE.ink,
      }}>{pct}%</span>
    </div>
  );
}

function HeroStrip({ done, total }) {
  const f = PALETTE.family;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const pep = pepTalk(pct, total);

  // — Studio : que de la typo, aucune boîte. Le calme Apple.
  if (f === "studio") {
    return (
      <div className="cl-rise" style={{ display: "flex", alignItems: "center", gap: 14, margin: "2px 0 14px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: PALETTE.inkFaint }}>{greeting()} · {todayLabel()}</div>
          <div style={titleStyle({ marginTop: 2 })}>Aujourd'hui</div>
          <div style={{ fontSize: 12.5, color: PALETTE.inkSoft, marginTop: 3 }}>{pep}</div>
        </div>
        <HeroRing pct={pct} />
      </div>
    );
  }

  // — Matière : carte tonale M3 avec barre de progression linéaire.
  if (f === "matiere") {
    return (
      <div className="cl-rise" style={{
        background: `${PALETTE.forest}14`, borderRadius: PALETTE.radiusCardLg,
        padding: "12px 16px 14px", margin: "0 0 14px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 36, height: 36, borderRadius: "50%", background: PALETTE.panel, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Sun size={18} color={PALETTE.amber} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: PALETTE.inkSoft }}>{greeting()} · {todayLabel()}</div>
            <div style={{ ...titleStyle({ fontSize: 19 }), marginTop: 1 }}>Aujourd'hui</div>
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: PALETTE.forest, flexShrink: 0 }}>
            {done}<span style={{ fontSize: 12, fontWeight: 500, color: PALETTE.inkSoft }}>/{total}</span>
          </span>
        </div>
        <div style={{ marginTop: 10 }}><ProgressBar pct={pct} color={PALETTE.forest} height={8} /></div>
      </div>
    );
  }

  // — Clairière : bande organique teintée aquarelle, serif, pousse.
  if (f === "clairiere") {
    return (
      <div className="cl-rise" style={{
        background: `linear-gradient(120deg, ${PALETTE.forest}12 0%, ${PALETTE.amber}10 100%), ${PALETTE.panel}`,
        border: cardBorder(), borderRadius: PALETTE.radiusCardLg, boxShadow: PALETTE.cardShadow,
        margin: "0 0 14px", padding: "11px 15px", display: "flex", alignItems: "center", gap: 13,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase", color: PALETTE.inkFaint, display: "flex", alignItems: "center", gap: 5 }}>
            <Sprout size={12} color={PALETTE.forest} /> {greeting()} · {todayLabel()}
          </div>
          <div style={titleStyle({ fontSize: 21, marginTop: 3 })}>La clairière du jour</div>
          <div style={{ fontSize: 12, color: PALETTE.inkSoft, marginTop: 3 }}>{pep}</div>
        </div>
        <HeroRing pct={pct} />
      </div>
    );
  }

  // — Élan : dalle noire arrondie, énorme pourcentage italique rouge.
  if (f === "elan") {
    return (
      <div className="cl-rise" style={{
        background: PALETTE.ink, borderRadius: PALETTE.radiusCardLg, margin: "0 0 14px",
        padding: "13px 18px", display: "flex", alignItems: "center", gap: 14,
        boxShadow: "5px 5px 0 rgba(17,17,17,0.16)",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.8, color: PALETTE.amber, textTransform: "uppercase" }}>{todayLabel()}</div>
          <div style={{ ...titleStyle({ fontSize: 23 }), color: "#FFFFFF", marginTop: 3 }}>Aujourd'hui</div>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "#FFFFFF", opacity: 0.7, marginTop: 4 }}>{pep}</div>
        </div>
        <span style={{
          fontFamily: PALETTE.fontDisplay, fontStyle: "italic", fontWeight: 800, fontSize: 38,
          letterSpacing: -2, color: PALETTE.amber, flexShrink: 0, lineHeight: 1,
        }}>{pct}<span style={{ fontSize: 18 }}>%</span></span>
      </div>
    );
  }

  // — Claude : pas de boîte, une ligne serif et un fil de progression.
  if (f === "claude") {
    return (
      <div className="cl-rise" style={{ margin: "2px 0 14px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: PALETTE.inkFaint, fontStyle: "italic" }}>{greeting()} · {todayLabel()}</div>
            <div style={titleStyle({ marginTop: 2 })}>Aujourd'hui</div>
          </div>
          <span style={{ fontFamily: PALETTE.fontDisplay, fontSize: 17, color: PALETTE.forest, flexShrink: 0 }}>
            {done} <span style={{ fontSize: 12, color: PALETTE.inkFaint }}>sur {total}</span>
          </span>
        </div>
        <div style={{ marginTop: 8 }}><ProgressBar pct={pct} color={PALETTE.forest} height={4} /></div>
        <div style={{ fontSize: 12, color: PALETTE.inkSoft, marginTop: 5, fontStyle: "italic" }}>{pep}</div>
      </div>
    );
  }

  // — Aurore : carte de verre sur dégradé, anneau blanc.
  if (f === "aurore") {
    return (
      <div className="cl-rise" style={{
        background: PALETTE.accentGrad, borderRadius: PALETTE.radiusCardLg,
        margin: "0 0 14px", padding: "12px 16px", color: "#FFFFFF",
        boxShadow: PALETTE.glowAccent, display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.1, textTransform: "uppercase", opacity: 0.85 }}>{greeting()} · {todayLabel()}</div>
          <div style={{ ...titleStyle({ fontSize: 21 }), color: "#FFFFFF", marginTop: 3 }}>Ta journée</div>
          <div style={{ fontSize: 12, marginTop: 3, opacity: 0.92 }}>{pep}</div>
        </div>
        <HeroRing pct={pct} color="#FFFFFF" textColor="#FFFFFF" />
      </div>
    );
  }

  // — Bento : le bandeau est une tuile du plateau, icône compartiment.
  if (f === "bento") {
    return (
      <div className="cl-rise" style={cardStyle({
        margin: "0 0 12px", padding: "11px 14px", display: "flex", alignItems: "center", gap: 12,
      })}>
        <span style={{ width: 38, height: 38, borderRadius: 12, background: PALETTE.ink, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <LayoutGrid size={18} color="#FFFFFF" />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: PALETTE.inkFaint }}>{todayLabel()}</div>
          <div style={titleStyle({ fontSize: 19, marginTop: 1 })}>Le plateau du jour</div>
          <div style={{ fontSize: 11.5, color: PALETTE.inkSoft, marginTop: 1 }}>{pep}</div>
        </div>
        <HeroRing pct={pct} size={48} color={PALETTE.amber} />
      </div>
    );
  }

  // — Pop : le sticker d'origine, resserré.
  return (
    <div className="cl-rise" style={{
      background: PALETTE.canvasDeep, border: `2px solid ${PALETTE.forest}`,
      borderRadius: PALETTE.radiusCardLg, boxShadow: `0 5px 0 ${PALETTE.forest}`,
      margin: "0 0 14px", padding: "12px 15px", display: "flex", alignItems: "center", gap: 13,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: PALETTE.berry }}>{todayLabel()}</div>
        <div style={titleStyle({ fontSize: 21, marginTop: 2 })}>On y va !</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: PALETTE.inkSoft, marginTop: 3 }}>{pep}</div>
      </div>
      <HeroRing pct={pct} />
    </div>
  );
}

// ============================================================
// RITUELS EN LIGNE — hebdo et daily tiennent chacun sur UNE ligne.
// Un bouton icône (≥ 38px) par rituel, défilement horizontal si
// besoin, compteur à droite. La forme du bouton dépend de la famille.
// ============================================================
function RitualChip({ task, color, onClick, title }) {
  const f = PALETTE.family;
  const done = task.done;
  const s = PALETTE.chipSize;
  const Icon = getIcon(task.icon);
  const common = {
    width: s, height: s, flexShrink: 0, padding: 0, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.18s cubic-bezier(.34,1.4,.64,1)",
  };

  if (f === "studio") {
    return (
      <button className="cl-tap" onClick={onClick} title={title} style={{
        ...common, borderRadius: "50%", border: "none",
        background: done ? color : PALETTE.panel,
        boxShadow: done ? `0 4px 12px ${color}55` : "0 1px 3px rgba(0,0,0,0.08), 0 5px 12px rgba(0,0,0,0.05)",
      }}>
        {done ? <Check size={19} color="#FFF" strokeWidth={3} /> : <Icon size={18} color={PALETTE.inkSoft} />}
      </button>
    );
  }
  if (f === "matiere") {
    // Morphing M3 : carré arrondi → cercle tonal plein quand c'est coché.
    return (
      <button className="cl-tap" onClick={onClick} title={title} style={{
        ...common, borderRadius: done ? "50%" : 14, border: "none",
        background: done ? color : PALETTE.canvasDeep,
      }}>
        {done ? <Check size={19} color="#FFF" strokeWidth={2.8} /> : <Icon size={18} color={PALETTE.inkSoft} />}
      </button>
    );
  }
  if (f === "clairiere") {
    return (
      <button className="cl-tap" onClick={onClick} title={title} style={{
        ...common, borderRadius: "14px 6px 14px 6px",
        border: `1.5px solid ${done ? color : PALETTE.line}`,
        background: done ? `${color}22` : PALETTE.panel,
        boxShadow: done ? "none" : "0 2px 6px rgba(31,42,30,0.08)",
      }}>
        {done ? <CheckCircle2 size={18} color={color} /> : <Icon size={17} color={PALETTE.inkFaint} />}
      </button>
    );
  }
  if (f === "elan") {
    return (
      <button className="cl-tap" onClick={onClick} title={title} style={{
        ...common, borderRadius: 12, border: `2px solid ${PALETTE.ink}`,
        background: done ? color : PALETTE.panel,
        boxShadow: done ? "none" : "3px 3px 0 rgba(17,17,17,0.85)",
        transform: done ? "translate(2px,2px)" : "none",
      }}>
        {done ? <Check size={20} color="#FFF" strokeWidth={4} /> : <Icon size={18} color={PALETTE.ink} />}
      </button>
    );
  }
  if (f === "claude") {
    return (
      <button className="cl-tap" onClick={onClick} title={title} style={{
        ...common, borderRadius: "50%",
        border: `1.5px solid ${done ? color : PALETTE.line}`,
        background: done ? `${color}1A` : PALETTE.panel,
        boxShadow: done ? "none" : PALETTE.cardShadow,
      }}>
        {done ? <Check size={17} color={color} strokeWidth={2.6} /> : <Icon size={17} color={PALETTE.inkFaint} />}
      </button>
    );
  }
  if (f === "aurore") {
    // Cadran : l'anneau se remplit, l'icône reste visible au centre.
    return (
      <button className="cl-tap" onClick={onClick} title={title} style={{
        ...common, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        boxShadow: done ? `0 4px 14px ${color}44` : "0 4px 14px rgba(96,84,168,0.10)",
        position: "relative",
      }}>
        <ProgressRing pct={done ? 100 : 0} color={color} size={s} thickness={3.5} />
        <span style={{ position: "absolute" }}>
          {done ? <Check size={16} color={color} strokeWidth={3} /> : <Icon size={16} color={PALETTE.inkSoft} />}
        </span>
      </button>
    );
  }
  if (f === "bento") {
    return (
      <button className="cl-tap" onClick={onClick} title={title} style={{
        ...common, borderRadius: 13,
        border: `1.5px solid ${done ? color : PALETTE.line}`,
        background: done ? color : PALETTE.panel,
      }}>
        {done ? <Check size={19} color="#FFF" strokeWidth={3} /> : <Icon size={17} color={PALETTE.inkSoft} />}
      </button>
    );
  }
  // pop : chip épaisse d'origine
  return (
    <button className="cl-tap" onClick={onClick} title={title} style={{
      ...common, borderRadius: PALETTE.radiusChip,
      border: `2px solid ${done ? color : PALETTE.line}`,
      background: done ? `${color}1c` : PALETTE.panel,
      boxShadow: done ? "none" : "0 3px 0 rgba(110,58,255,0.14)",
    }}>
      {done ? <CheckCircle2 size={16} color={color} /> : <Icon size={15} color={PALETTE.inkFaint} />}
    </button>
  );
}

// La ligne complète : [icône+libellé] [boutons…] [fait/total]
function RitualLine({ label, icon: LineIcon, color, groups, colorFor, onToggle }) {
  const f = PALETTE.family;
  const all = groups.flatMap((g, gi) => g.tasks.map((t) => ({ g, gi, t })));
  const done = all.filter((x) => x.t.done).length;
  const isVine = f === "clairiere";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8, minWidth: 0 }}>
      <div style={{ width: 46, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <LineIcon size={15} color={color} />
        <span style={{
          fontSize: 9, fontWeight: PALETTE.labelWeight, letterSpacing: 0.6,
          textTransform: "uppercase", color: PALETTE.inkSoft, whiteSpace: "nowrap",
        }}>{label}</span>
      </div>
      <div className="cl-hscroll" style={{
        display: "flex", alignItems: "center", gap: 6, overflowX: "auto", flex: 1, minWidth: 0,
        padding: "3px 2px", position: "relative",
      }}>
        {/* Clairière : la liane pointillée qui relie les graines */}
        {isVine && (
          <span aria-hidden style={{
            position: "absolute", left: 0, right: 0, top: "50%", height: 0,
            borderTop: `2px dotted ${PALETTE.line}`, zIndex: 0,
          }} />
        )}
        {all.map(({ g, gi, t }, i) => (
          <span key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, zIndex: 1 }}>
            {i > 0 && all[i - 1].g.id !== g.id && !isVine && (
              <span style={{ width: 1.5, height: 18, background: PALETTE.lineSoft, flexShrink: 0 }} />
            )}
            <RitualChip task={t} color={colorFor(g, gi)} title={`${g.name} · ${t.title}`}
              onClick={() => onToggle(g.id, t.id)} />
          </span>
        ))}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: done === all.length && all.length ? color : PALETTE.inkFaint, flexShrink: 0 }}>
        {done}/{all.length}
      </span>
    </div>
  );
}

// ============================================================
// PLANCHES DE RITUELS — vues pleines Daily / Hebdo / Mensuelle.
// Grille de tuiles icône+libellé, sections par groupe.
// ============================================================
function RitualTileBtn({ task, color, onClick }) {
  const f = PALETTE.family;
  const done = task.done;
  const Icon = getIcon(task.icon);
  const base = {
    minHeight: 64, padding: "9px 6px", cursor: "pointer", textAlign: "center",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
    transition: "all 0.18s cubic-bezier(.34,1.4,.64,1)",
  };
  let skin;
  if (f === "studio") skin = { borderRadius: 14, border: "none", background: done ? color : PALETTE.panel, boxShadow: done ? `0 4px 12px ${color}50` : PALETTE.cardShadow };
  else if (f === "matiere") skin = { borderRadius: done ? 24 : 16, border: "none", background: done ? color : PALETTE.canvasDeep };
  else if (f === "clairiere") skin = { borderRadius: "14px 6px 14px 6px", border: `1.5px solid ${done ? color : PALETTE.line}`, background: done ? `${color}20` : PALETTE.panel, boxShadow: done ? "none" : PALETTE.cardShadow };
  else if (f === "elan") skin = { borderRadius: 12, border: `2px solid ${PALETTE.ink}`, background: done ? color : PALETTE.panel, boxShadow: done ? "none" : "3px 3px 0 rgba(17,17,17,0.85)", transform: done ? "translate(2px,2px)" : "none" };
  else if (f === "claude") skin = { borderRadius: 16, border: `1px solid ${done ? color : PALETTE.line}`, background: done ? `${color}16` : PALETTE.panel, boxShadow: done ? "none" : PALETTE.cardShadow };
  else if (f === "aurore") skin = { borderRadius: 18, border: `1px solid ${done ? color : "rgba(255,255,255,0.95)"}`, background: done ? `${color}22` : PALETTE.cardBg, boxShadow: PALETTE.cardShadow, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" };
  else if (f === "bento") skin = { borderRadius: 14, border: `1.5px solid ${done ? color : PALETTE.line}`, background: done ? color : PALETTE.panel };
  else skin = { borderRadius: PALETTE.radiusChip, border: `2px solid ${done ? color : PALETTE.line}`, background: done ? `${color}1c` : PALETTE.panel, boxShadow: done ? "none" : PALETTE.cardShadow };

  const filled = skin.background === color; // texte blanc sur fond plein
  return (
    <button className="cl-tap" onClick={onClick} title={task.title} style={{ ...base, ...skin }}>
      {done
        ? (filled ? <Check size={19} color="#FFF" strokeWidth={3} /> : <CheckCircle2 size={19} color={color} />)
        : <Icon size={19} color={filled ? "#FFF" : PALETTE.inkFaint} />}
      <span style={{
        fontSize: 11, fontWeight: PALETTE.bodyWeight, lineHeight: 1.2, wordBreak: "break-word",
        color: filled ? "#FFFFFF" : (done ? color : PALETTE.ink),
        textDecoration: done && !filled ? "line-through" : "none",
      }}>{task.title}</span>
    </button>
  );
}

function RitualBoard({ groups, onToggleTask, colorFor, iconFor }) {
  return (
    <>
      {groups.map((g, gi) => {
        const color = colorFor(g, gi);
        const Icon = iconFor ? iconFor(g) : getIcon(g.icon);
        const gDone = g.tasks.filter((t) => t.done).length;
        return (
          <div key={g.id} style={{ marginBottom: 14 }}>
            <SectionHead icon={Icon} label={g.name} color={color}
              right={<span style={{ fontSize: 11, fontWeight: 700, color: gDone === g.tasks.length ? color : PALETTE.inkFaint }}>{gDone}/{g.tasks.length}</span>} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
              {g.tasks.map((t) => (
                <RitualTileBtn key={t.id} task={t} color={color} onClick={() => onToggleTask(g.id, t.id)} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

// ============================================================
// MISSIONS EN GRILLE — une carte par tâche, 2-3 colonnes selon le
// thème. Repliées par défaut (densité) ; le chevron déplie les
// sous-tâches + le champ d'ajout. Une architecture par famille.
// ============================================================
function subStats(task) {
  const subs = (task.subtasks || []).filter((s) => !s.pending);
  return { subs, done: subs.filter((s) => s.done).length, total: subs.length };
}

// Repli par défaut, mais une dictée en cours force l'ouverture :
// il faut voir la transcription arriver.
// `expandSignal` porte un « ordre » venu du bouton général déplier/replier
// tout : { open, key }. `key` change à chaque clic (même si `open` revient à
// une valeur déjà vue), donc l'effet se redéclenche systématiquement — sans
// lui, rouvrir puis refermer produirait deux fois le même `open` et le
// second clic resterait sans effet. Une fois appliqué, chaque carte reste
// pliable/dépliable individuellement comme avant.
function useTaskItem(task, expandSignal) {
  const [open, setOpen] = useState(false);
  const subtasks = task.subtasks || [];
  const hasPending = subtasks.some((s) => s.pending);
  const { done, total } = subStats(task);
  useEffect(() => {
    if (expandSignal) setOpen(expandSignal.open);
  }, [expandSignal]);
  return { open: open || hasPending, setOpen, doneSubs: done, totalSubs: total, subtasks };
}

// Zone dépliée commune : sous-tâches + champ d'ajout + suppression.
function MissionSubs({ task, color, onToggleSub, onDeleteSub, onAddSub, onDelete, subVoice, onDragStart, onChangeSubEta, onChangeSubTitle }) {
  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
      {(task.subtasks || []).map((s) => s.pending
        ? <PendingRow key={s.id} phase={s.pending} indent />
        : (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 2px", minHeight: 30 }}>
            <span onClick={() => onToggleSub(task.id, s.id)} className="cl-tap" style={{ cursor: "pointer", display: "flex" }}>
              <Checkbox done={s.done} size={16} />
            </span>
            <EditableTitle value={s.title} done={s.done} onToggle={() => onToggleSub(task.id, s.id)}
              onRename={onChangeSubTitle ? (v) => onChangeSubTitle(task.id, s.id, v) : undefined}
              style={{ flex: 1, fontSize: 12.5, lineHeight: 1.35 }} />
            {onChangeSubEta && <EtaChip value={s.eta} onChange={(v) => onChangeSubEta(task.id, s.id, v)} />}
            <TrashLink onClick={() => onDeleteSub(task.id, s.id)} size={11} />
          </div>
        ))}
      <Composer sub placeholder="Ajouter une sous-mission…" voice={subVoice} voiceArg={task.id}
        onSubmit={(v) => onAddSub(task.id, v)} />
      <div style={{ display: "flex", alignItems: "center", marginTop: 2 }}>
        {onDragStart && <DragHandle onPointerDown={onDragStart} />}
        <div style={{ flex: 1 }} />
        <button className="cl-press" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} style={{
          display: "flex", alignItems: "center", gap: 5, background: "transparent", padding: "4px 6px",
          fontSize: 11, fontWeight: 600, color: PALETTE.danger, opacity: 0.75,
        }}>
          <Trash2 size={12} /> Supprimer
        </button>
      </div>
    </div>
  );
}

function ExpandBtn({ open, onClick, count }) {
  return (
    <button className="cl-press" onClick={(e) => { e.stopPropagation(); onClick(); }} title="Sous-missions" style={{
      display: "flex", alignItems: "center", gap: 3, background: "transparent",
      padding: "6px 4px", flexShrink: 0, color: PALETTE.inkFaint, minWidth: 30, justifyContent: "center",
    }}>
      {count && <span style={{ fontSize: 10.5, fontWeight: 700 }}>{count}</span>}
      {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
    </button>
  );
}

// ---------- Échéance (ETA) & catégorie ----------
// Champ optionnel, édité en place : un clic ouvre un <input type="date">
// natif (clavier/date-picker du système), sans dépendance ni bibliothèque.
// L'heure est un deuxième champ facultatif qui n'apparaît qu'une fois une
// date choisie — stockée accolée à la date avec un « T », format datetime-
// local standard, jamais imposée.
function splitEta(iso) {
  if (!iso) return { date: "", time: "" };
  const [date, time] = iso.split("T");
  return { date: date || "", time: time || "" };
}
function combineEta(date, time) {
  if (!date) return null;
  return time ? `${date}T${time}` : date;
}
function formatEtaShort(iso) {
  if (!iso) return "";
  const { date, time } = splitEta(iso);
  const [y, m, d] = date.split("-");
  if (!y || !m || !d) return "";
  return time ? `${d}/${m} ${time}` : `${d}/${m}`;
}

function EtaChip({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const { date, time } = splitEta(value);
  if (editing) {
    return (
      <span onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
        <input
          type="date"
          autoFocus
          defaultValue={date}
          onChange={(e) => onChange(combineEta(e.target.value, time))}
          style={{
            fontSize: 11, fontFamily: PALETTE.fontBody, color: PALETTE.ink,
            background: PALETTE.canvasDeep, border: `1px solid ${PALETTE.lineSoft}`,
            borderRadius: 6, padding: "2px 4px", maxWidth: 118,
          }}
        />
        {date && (
          <input
            type="time"
            defaultValue={time}
            onChange={(e) => onChange(combineEta(date, e.target.value))}
            title="Heure (facultative)"
            style={{
              fontSize: 11, fontFamily: PALETTE.fontBody, color: PALETTE.ink,
              background: PALETTE.canvasDeep, border: `1px solid ${PALETTE.lineSoft}`,
              borderRadius: 6, padding: "2px 4px", maxWidth: 78,
            }}
          />
        )}
        <button className="cl-press" onClick={() => setEditing(false)} title="Fermer" style={{
          display: "flex", alignItems: "center", background: "transparent", padding: 2, color: PALETTE.inkFaint, flexShrink: 0,
        }}>
          <Check size={12} />
        </button>
      </span>
    );
  }
  return (
    <button
      className="cl-press"
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      title="Échéance (date, heure facultative)"
      style={{
        display: "inline-flex", alignItems: "center", gap: 3, background: "transparent",
        padding: "2px 3px", fontSize: 10.5, fontWeight: 600,
        color: value ? PALETTE.inkSoft : PALETTE.inkFaint, opacity: value ? 1 : 0.55,
      }}
    >
      <CalendarDays size={11} />
      {value && formatEtaShort(value)}
    </button>
  );
}

// Changer la catégorie d'une mission : un simple <select>, pas de menu dédié.
function CategorieSelect({ value, onChange }) {
  return (
    <select
      value={value || ""}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value || null)}
      style={{
        fontSize: 10.5, fontWeight: 600, fontFamily: PALETTE.fontBody,
        color: value ? PALETTE.inkSoft : PALETTE.inkFaint,
        background: "transparent", border: `1px solid ${PALETTE.lineSoft}`,
        borderRadius: 6, padding: "1px 3px", maxWidth: 96, cursor: "pointer",
      }}
    >
      <option value="">Sans catégorie</option>
      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

// Ligne commune injectée dans chaque style de MissionCard : n'apparaît que
// si l'appelant fournit les handlers (absente pour les tâches de dossier,
// qui n'ont ni catégorie ni échéance).
function TaskMeta({ task, onChangeCategorie, onChangeEta }) {
  if (!onChangeCategorie && !onChangeEta) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
      {onChangeCategorie && <CategorieSelect value={task.categorie} onChange={(v) => onChangeCategorie(task.id, v)} />}
      {onChangeEta && <EtaChip value={task.eta} onChange={(v) => onChangeEta(task.id, v)} />}
    </div>
  );
}

// ---------- Titre éditable (appui court = action existante, appui long = renommer) ----------
// Le geste est capté ICI, jamais via un onClick séparé posé par l'appelant :
// un appui long produit quand même un `click` natif au relâchement (pointerup
// suivi de click, quelle que soit la durée), donc `handleClick` doit à la
// fois avaler ce clic post-appui-long ET empêcher sa remontée vers un
// conteneur parent qui coche au clic (cas du thème Élan, où le titre est
// imbriqué dans une zone plus large qui coche au tap).
function EditableTitle({ value, done, onToggle, onRename, tag = "span", style, holdMs = 480 }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const firedRef = useRef(false);
  const timerRef = useRef(null);

  const startPress = () => {
    firedRef.current = false;
    clearTimeout(timerRef.current);
    if (!onRename) return;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      navigator.vibrate?.(20);
      setDraft(value);
      setEditing(true);
    }, holdMs);
  };
  const clearPress = () => clearTimeout(timerRef.current);
  const handleClick = (e) => {
    e.stopPropagation();
    if (firedRef.current) { firedRef.current = false; return; }
    onToggle?.();
  };

  const commit = () => {
    const v = draft.trim();
    setEditing(false);
    if (v && v !== value) onRename(v);
  };
  const cancel = () => { setEditing(false); setDraft(value); };

  if (editing) {
    return (
      // Cliquer n'importe où en dehors annule — via la perte de focus de
      // l'input, captée par `onBlur`. Valider est un choix explicite
      // (Entrée ou le bouton ✓), jamais une conséquence du focus perdu.
      // `stopPropagation` ici évite qu'un clic sur l'input ou le bouton ne
      // remonte vers un conteneur parent qui coche au clic.
      <span onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 4, width: "100%" }}>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={cancel}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commit(); }
            if (e.key === "Escape") { e.preventDefault(); cancel(); }
          }}
          style={{
            minWidth: 0, border: "none", borderBottom: `1.5px solid ${PALETTE.forest}`, background: "transparent",
            outline: "none", padding: 0, fontFamily: "inherit",
            ...style, flex: 1, color: PALETTE.ink, textDecoration: "none",
          }}
        />
        <button
          className="cl-press"
          // Empêche le focus (donc le blur/annulation de l'input) de se
          // déplacer vers ce bouton avant que son clic n'ait pu valider.
          onPointerDown={(e) => e.preventDefault()}
          onClick={commit}
          title="Valider le nouveau titre"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            width: 20, height: 20, borderRadius: "50%", background: PALETTE.forest, color: "#FFF",
          }}
        >
          <Check size={11} />
        </button>
      </span>
    );
  }

  const Tag = tag;
  return (
    <Tag
      onPointerDown={startPress}
      onPointerUp={clearPress}
      onPointerLeave={clearPress}
      onPointerCancel={clearPress}
      onContextMenu={(e) => onRename && e.preventDefault()}
      onClick={handleClick}
      style={{
        cursor: "pointer", touchAction: "manipulation", WebkitUserSelect: "none", userSelect: "none",
        ...style, ...strike(done),
      }}
    >
      {value}
    </Tag>
  );
}

function MissionCard(props) {
  const { task, index, onToggle, onDelete, onAddSub, onToggleSub, onDeleteSub, subVoice, onDragStart, onChangeCategorie, onChangeEta, onChangeSubEta, onChangeTitle, onChangeSubTitle, expandSignal } = props;
  const f = PALETTE.family;
  const { open, setOpen, doneSubs, totalSubs } = useTaskItem(task, expandSignal);
  const color = colorForIndex(index);
  const count = totalSubs > 0 ? `${doneSubs}/${totalSubs}` : null;
  const metaRow = <TaskMeta task={task} onChangeCategorie={onChangeCategorie} onChangeEta={onChangeEta} />;
  const onRenameTask = onChangeTitle ? (v) => onChangeTitle(task.id, v) : undefined;
  const subsArea = open && (
    <MissionSubs task={task} color={color} onToggleSub={onToggleSub} onDeleteSub={onDeleteSub}
      onAddSub={onAddSub} onDelete={onDelete} subVoice={subVoice} onDragStart={onDragStart}
      onChangeSubEta={onChangeSubEta} onChangeSubTitle={onChangeSubTitle} />
  );

  // — Studio : carte blanche nue, coche circulaire à gauche, tout en retenue.
  if (f === "studio") {
    return (
      <div className="cl-card" style={cardStyle({ padding: "9px 8px 9px 11px" })}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, minHeight: 34 }}>
          <span onClick={() => onToggle()} className="cl-tap" style={{ cursor: "pointer", display: "flex" }}>
            <Checkbox done={task.done} size={23} />
          </span>
          <EditableTitle value={task.title} done={task.done} onToggle={onToggle} onRename={onRenameTask}
            style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500, letterSpacing: -0.2, lineHeight: 1.3 }} />
          <ExpandBtn open={open} onClick={() => setOpen(!open)} count={count} />
        </div>
        {metaRow}
        {subsArea}
      </div>
    );
  }

  // — Matière : carte tonale, avatar lettre coloré, la forme change quand c'est fait.
  if (f === "matiere") {
    return (
      <div className="cl-card" style={{
        background: task.done ? `${PALETTE.forest}14` : PALETTE.panel,
        borderRadius: task.done ? 28 : PALETTE.radiusCard, boxShadow: PALETTE.cardShadow,
        padding: "9px 8px 9px 9px", transition: "border-radius .25s ease, background .25s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 36 }}>
          <span onClick={() => onToggle()} className="cl-tap" style={{
            width: 34, height: 34, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
            background: task.done ? PALETTE.forest : `${color}22`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: task.done ? "#FFF" : color,
            transition: "all .2s ease",
          }}>
            {task.done ? <Check size={17} strokeWidth={3} /> : (task.title || "?").charAt(0).toUpperCase()}
          </span>
          <EditableTitle value={task.title} done={task.done} onToggle={onToggle} onRename={onRenameTask}
            style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500, lineHeight: 1.3 }} />
          <ExpandBtn open={open} onClick={() => setOpen(!open)} count={count} />
        </div>
        {metaRow}
        {subsArea}
      </div>
    );
  }

  // — Clairière : feuille organique, la pousse devient feuille verte cochée.
  if (f === "clairiere") {
    return (
      <div className="cl-card" style={cardStyle({
        padding: "10px 9px 10px 12px",
        background: task.done ? `${PALETTE.forest}0C` : PALETTE.panel,
        borderColor: task.done ? `${PALETTE.forest}55` : undefined,
      })}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, minHeight: 34 }}>
          <span onClick={() => onToggle()} className="cl-tap" style={{ cursor: "pointer", display: "flex", flexShrink: 0 }}>
            {task.done
              ? <CheckCircle2 size={22} color={PALETTE.forest} />
              : <Sprout size={22} color={color} strokeWidth={2} />}
          </span>
          <EditableTitle value={task.title} done={task.done} onToggle={onToggle} onRename={onRenameTask}
            style={{ flex: 1, minWidth: 0, fontFamily: PALETTE.fontDisplay, fontSize: 14.5, fontWeight: 500, lineHeight: 1.3 }} />
          <ExpandBtn open={open} onClick={() => setOpen(!open)} count={count} />
        </div>
        {metaRow}
        {subsArea}
      </div>
    );
  }

  // — Élan : carte numérotée, zone de coche pleine hauteur à droite.
  if (f === "elan") {
    const num = String(index + 1).padStart(2, "0");
    return (
      <div style={{
        border: `2px solid ${PALETTE.ink}`, borderRadius: 16, overflow: "hidden",
        background: task.done ? PALETTE.canvasDeep : PALETTE.panel,
        boxShadow: task.done ? "none" : "4px 4px 0 rgba(17,17,17,0.16)",
      }}>
        <div style={{ display: "flex", alignItems: "stretch", minHeight: 52 }}>
          <span style={{
            width: 40, flexShrink: 0, background: task.done ? PALETTE.ink : PALETTE.amber,
            color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, fontStyle: "italic", letterSpacing: -1,
          }}>{num}</span>
          <span onClick={() => onToggle()} style={{
            flex: 1, minWidth: 0, padding: "8px 10px", cursor: "pointer",
            display: "flex", flexDirection: "column", justifyContent: "center", gap: 2,
          }}>
            <EditableTitle value={task.title} done={task.done} onToggle={onToggle} onRename={onRenameTask}
              style={{ fontSize: 13.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: -0.2, lineHeight: 1.2 }} />
            {count && <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 1.2, color: PALETTE.inkFaint }}>{count}</span>}
          </span>
          <button onClick={() => setOpen(!open)} className="cl-press" style={{
            width: 30, flexShrink: 0, background: "transparent", borderLeft: `2px solid ${PALETTE.ink}`,
            display: "flex", alignItems: "center", justifyContent: "center", color: PALETTE.ink,
          }}>
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <button onClick={() => onToggle()} className="cl-press" style={{
            width: 46, flexShrink: 0, borderLeft: `2px solid ${PALETTE.ink}`,
            background: task.done ? PALETTE.success : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Check size={22} color={task.done ? "#FFF" : PALETTE.lineSoft} strokeWidth={4} />
          </button>
        </div>
        {open && <div style={{ borderTop: `2px solid ${PALETTE.ink}`, padding: "4px 10px 10px", background: PALETTE.canvasDeep }}>{metaRow}{subsArea}</div>}
      </div>
    );
  }

  // — Claude : papier ivoire, titre serif, état écrit en toutes lettres.
  if (f === "claude") {
    return (
      <div className="cl-card" style={cardStyle({ padding: "11px 12px 10px" })}>
        <EditableTitle tag="div" value={task.title} done={task.done} onToggle={onToggle} onRename={onRenameTask}
          style={{ fontFamily: PALETTE.fontDisplay, fontSize: 15, fontWeight: 500, lineHeight: 1.35 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
          <button onClick={() => onToggle()} className="cl-press" style={{
            padding: "5px 12px", borderRadius: 999, fontSize: 11.5, fontWeight: 600,
            background: task.done ? `${PALETTE.success}18` : PALETTE.canvasDeep,
            color: task.done ? PALETTE.success : PALETTE.inkSoft,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            {task.done ? <Check size={12} /> : <Circle size={12} />}
            {task.done ? "Fait" : "À faire"}
          </button>
          <div style={{ flex: 1 }} />
          <ExpandBtn open={open} onClick={() => setOpen(!open)} count={count} />
        </div>
        {metaRow}
        {subsArea}
      </div>
    );
  }

  // — Aurore : tuile de verre, mini-cadran, gros bouton rond de coche.
  if (f === "aurore") {
    const pct = totalSubs ? Math.round((doneSubs / totalSubs) * 100) : (task.done ? 100 : 0);
    return (
      <div className="cl-card" style={cardStyle({
        padding: "10px 10px 9px",
        background: task.done ? `${color}18` : PALETTE.cardBg,
      })}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ProgressRing pct={pct} color={color} size={32} thickness={3.5} />
            <span style={{ position: "absolute", fontSize: 8.5, fontWeight: 700, color: PALETTE.inkSoft }}>{pct}</span>
          </div>
          <EditableTitle value={task.title} done={task.done} onToggle={onToggle} onRename={onRenameTask}
            style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, lineHeight: 1.3, paddingTop: 2 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 7 }}>
          <ExpandBtn open={open} onClick={() => setOpen(!open)} count={count} />
          <div style={{ flex: 1 }} />
          <button onClick={() => onToggle()} className="cl-press" style={{
            width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
            background: task.done ? color : "rgba(255,255,255,0.7)",
            border: `2px solid ${task.done ? color : ctrlLine()}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: task.done ? `0 6px 16px ${color}55` : "none",
          }}>
            <Check size={18} color={task.done ? "#FFF" : PALETTE.inkFaint} strokeWidth={3} />
          </button>
        </div>
        {metaRow}
        {subsArea}
      </div>
    );
  }

  // — Bento : compartiment du plateau, grosse icône-lettre, coche carrée.
  if (f === "bento") {
    return (
      <div className="cl-card" style={cardStyle({
        padding: "10px 10px 9px",
        background: task.done ? `${color}10` : PALETTE.panel,
        borderColor: task.done ? `${color}66` : undefined,
      })}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: `${color}1A`, color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 800,
          }}>{(task.title || "?").charAt(0).toUpperCase()}</span>
          <EditableTitle value={task.title} done={task.done} onToggle={onToggle} onRename={onRenameTask}
            style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, lineHeight: 1.3, paddingTop: 1 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 7 }}>
          <ExpandBtn open={open} onClick={() => setOpen(!open)} count={count} />
          <div style={{ flex: 1 }} />
          <button onClick={() => onToggle()} className="cl-press" style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            background: task.done ? color : "transparent",
            border: `2px solid ${task.done ? color : PALETTE.line}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {task.done && <Check size={16} color="#FFF" strokeWidth={3.5} />}
          </button>
        </div>
        {metaRow}
        {subsArea}
      </div>
    );
  }

  // — Pop : la carte pleine largeur d'origine, inchangée.
  return <PopCardItem {...props} open={open} setOpen={setOpen} doneSubs={doneSubs} totalSubs={totalSubs} />;
}

// Pop conserve sa présentation d'origine (liste de cartes épaisses).
function PopCardItem({ task, onToggle, onDelete, onAddSub, onToggleSub, onDeleteSub, onDragStart, subVoice, open, setOpen, doneSubs, totalSubs, onChangeCategorie, onChangeEta, onChangeSubEta, onChangeTitle, onChangeSubTitle }) {
  const onRenameTask = onChangeTitle ? (v) => onChangeTitle(task.id, v) : undefined;
  return (
    <div>
      <div className="cl-card" onClick={() => onToggle()} style={cardStyle({
        padding: "8px 8px 8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, minHeight: 52,
      })}>
        {onDragStart && <DragHandle onPointerDown={onDragStart} />}
        <Checkbox done={task.done} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <EditableTitle tag="div" value={task.title} done={task.done} onToggle={onToggle} onRename={onRenameTask}
            style={{ fontWeight: PALETTE.bodyWeight, fontSize: 14.5 }} />
          {totalSubs > 0 && <div style={{ fontSize: 11, color: PALETTE.inkFaint, marginTop: 2 }}>{doneSubs} / {totalSubs} sous-missions</div>}
          <TaskMeta task={task} onChangeCategorie={onChangeCategorie} onChangeEta={onChangeEta} />
        </div>
        <IconButton icon={open ? ChevronDown : ChevronRight} variant="subtle" size={30} iconSize={14}
          onClick={(e) => { e.stopPropagation(); setOpen(!open); }} title="Déplier" />
        <IconButton icon={Trash2} variant="subtle" size={30} iconSize={13}
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} title="Supprimer" />
      </div>

      {open && (
        <div style={{ paddingLeft: 28 }}>
          {(task.subtasks || []).map((s) => s.pending
            ? <PendingRow key={s.id} phase={s.pending} indent />
            : (
              <div key={s.id} style={{ position: "relative", marginTop: 8 }}>
                <div className="cl-tap" onClick={() => onToggleSub(task.id, s.id)} style={{
                  background: PALETTE.canvasDeep, border: `1px solid ${PALETTE.lineSoft}`, borderRadius: PALETTE.radiusChip,
                  padding: "8px 8px 8px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, minHeight: 40,
                }}>
                  <Checkbox done={s.done} size={16} />
                  <EditableTitle value={s.title} done={s.done} onToggle={() => onToggleSub(task.id, s.id)}
                    onRename={onChangeSubTitle ? (v) => onChangeSubTitle(task.id, s.id, v) : undefined}
                    style={{ fontSize: 13, flex: 1 }} />
                  {onChangeSubEta && <EtaChip value={s.eta} onChange={(v) => onChangeSubEta(task.id, s.id, v)} />}
                  <TrashLink onClick={() => onDeleteSub(task.id, s.id)} size={12} />
                </div>
              </div>
            ))}
          <div style={{ marginTop: 8 }}>
            <Composer sub placeholder="Nom de la sous-mission…" voice={subVoice} voiceArg={task.id}
              onSubmit={(v) => onAddSub(task.id, v)} />
          </div>
        </div>
      )}
    </div>
  );
}

// Le contenant : grille responsive partout, sauf Pop (pile d'origine).
function MissionGrid({ tasks, onReorder, ...handlers }) {
  const f = PALETTE.family;
  const gridStyle = f === "pop"
    ? { display: "flex", flexDirection: "column", gap: 8 }
    : { display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${PALETTE.missionMin}px, 1fr))`, gap: 9, alignItems: "start" };

  return (
    <SortableList
      items={tasks} keyId="id" onReorder={onReorder}
      gridStyle={gridStyle}
      renderItem={(t, i, drag) => (
        t.pending
          ? <PendingRow key={t.id} phase={t.pending} />
          : <MissionCard
              {...handlers}
              task={t} index={i}
              onDragStart={drag}
              onToggle={() => handlers.onToggle(t.id)}
            />
      )}
    />
  );
}

// ============================================================
// VIEWS
// ============================================================
const WEEK_ICONS = { Famille: Phone, Maison: ListChecks, Sport: Dumbbell, Cuisine: ChefHat };
function weekGroupColors() {
  return { Famille: PALETTE.berry, Maison: PALETTE.amber, Sport: PALETTE.sky, Cuisine: PALETTE.clay };
}

function TasksView({ state, weekly, daily, onToggleSimple, onDeleteSimple, onReorderTasks, onResetOrder,
  onRequestReset, onRequestClearDone, onToggleWeeklyTask, onToggleDailyTask,
  onAddTask, onAddSubtask, onToggleSubtask, onDeleteSubtask, taskVoice, subVoice,
  onChangeCategorie, onChangeEta, onChangeSubEta, onChangeTitle, onChangeSubTitle }) {
  const totalDone = state.tasks.filter((t) => t.done).length;
  const totalCount = state.tasks.length;
  const isEmpty = state.tasks.length === 0;
  const weekColors = weekGroupColors();
  // Bouton général déplier/replier : `key` change à chaque clic pour que le
  // signal reprenne même quand `open` revient à une valeur déjà envoyée.
  const [expandSignal, setExpandSignal] = useState(null);
  const toggleExpandAll = () => setExpandSignal((prev) => ({ open: !(prev?.open), key: (prev?.key || 0) + 1 }));

  const dayDone = totalDone
    + weekly.groups.reduce((a, g) => a + g.tasks.filter((t) => t.done).length, 0)
    + daily.groups.reduce((a, g) => a + g.tasks.filter((t) => t.done).length, 0);
  const dayTotal = totalCount
    + weekly.groups.reduce((a, g) => a + g.tasks.length, 0)
    + daily.groups.reduce((a, g) => a + g.tasks.length, 0);

  return (
    <div>
      <HeroStrip done={dayDone} total={dayTotal} />

      {/* ---- Hebdo puis Daily : une seule ligne chacun ---- */}
      <RitualLine label="Hebdo" icon={CalendarDays} color={PALETTE.sky}
        groups={weekly.groups} onToggle={onToggleWeeklyTask}
        colorFor={(g) => weekColors[g.name] || PALETTE.forest} />
      <RitualLine label="Daily" icon={Zap} color={PALETTE.berry}
        groups={daily.groups} onToggle={onToggleDailyTask}
        colorFor={(g, gi) => colorForIndex(gi)} />

      {/* ---- Missions ---- */}
      <div style={{ marginTop: 12 }}>
        <SectionHead icon={ListChecks} label="Missions" color={PALETTE.amber}
          right={
            <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: PALETTE.inkFaint, fontWeight: 600, marginRight: 3 }}>{totalDone}/{totalCount}</span>
              <IconButton icon={expandSignal?.open ? ChevronsUp : ChevronsDown} variant="ghost" size={30} iconSize={13}
                onClick={toggleExpandAll} title={expandSignal?.open ? "Tout replier" : "Tout déplier"} />
              <IconButton icon={RotateCcw} variant="ghost" size={30} iconSize={13} onClick={onResetOrder} title="Ordre A→Z" />
              <IconButton icon={Trash2} variant="subtle" size={30} iconSize={13} color={PALETTE.danger} onClick={onRequestClearDone} title="Effacer tâches faites" />
              <IconButton icon={AlertTriangle} variant="subtle" size={30} iconSize={13} color={PALETTE.danger} onClick={onRequestReset} title="Tout réinitialiser" />
            </span>
          } />

        {/* Le champ ne se referme jamais : écrire une tâche ne demande aucun clic préalable. */}
        <div style={{ marginBottom: 10 }}>
          <Composer placeholder="Nouvelle mission… (bouton maintenu : dicter)" onSubmit={onAddTask} voice={taskVoice} />
        </div>

        {isEmpty && <EmptyState title="Rien pour l'instant" subtitle="Écris ta première mission — ou maintiens le bouton pour la dicter" />}

        {state.tasks.length > 0 && (
          <MissionGrid
            tasks={state.tasks}
            onReorder={onReorderTasks}
            onToggle={onToggleSimple}
            onDelete={onDeleteSimple}
            onAddSub={onAddSubtask}
            onToggleSub={onToggleSubtask}
            onDeleteSub={onDeleteSubtask}
            subVoice={subVoice}
            onChangeCategorie={onChangeCategorie}
            onChangeEta={onChangeEta}
            onChangeSubEta={onChangeSubEta}
            onChangeTitle={onChangeTitle}
            onChangeSubTitle={onChangeSubTitle}
            expandSignal={expandSignal}
          />
        )}
      </div>
    </div>
  );
}

// Ligne d'une catégorie : plus simple qu'une MissionCard (pas de sous-missions,
// pas de glisser-déposer) — le select de catégorie sert aussi à en sortir une
// mission en la remettant à « Sans catégorie ».
// Comme MissionCard, mais un seul style (pas de thème à décliner) : checkbox,
// titre, catégorie/échéance en dessous, et les sous-missions au dépli — même
// mécanique que sur la page Missions (`useTaskItem` + `MissionSubs`).
function CategoryTaskRow({ task, onToggle, onDelete, onChangeCategorie, onChangeEta, onAddSub, onToggleSub, onDeleteSub, onChangeSubEta, onChangeTitle, onChangeSubTitle, expandSignal }) {
  const { open, setOpen, doneSubs, totalSubs } = useTaskItem(task, expandSignal);
  const count = totalSubs > 0 ? `${doneSubs}/${totalSubs}` : null;
  return (
    <div className="cl-card" style={cardStyle({ padding: "9px 9px 9px 11px" })}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span onClick={onToggle} className="cl-tap" style={{ cursor: "pointer", display: "flex" }}>
          <Checkbox done={task.done} size={20} />
        </span>
        <EditableTitle value={task.title} done={task.done} onToggle={onToggle} onRename={onChangeTitle}
          style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 500, lineHeight: 1.3 }} />
        <ExpandBtn open={open} onClick={() => setOpen(!open)} count={count} />
        <TrashLink onClick={onDelete} size={13} />
      </div>
      <TaskMeta task={task} onChangeCategorie={onChangeCategorie} onChangeEta={onChangeEta} />
      {open && (
        <MissionSubs task={task} onToggleSub={onToggleSub} onDeleteSub={onDeleteSub}
          onAddSub={onAddSub} onDelete={onDelete} onChangeSubEta={onChangeSubEta} onChangeSubTitle={onChangeSubTitle} />
      )}
    </div>
  );
}

function CategoryView({ name, tasks, onToggle, onDelete, onAddTask, onChangeCategorie, onChangeEta, onAddSubtask, onToggleSubtask, onDeleteSubtask, onChangeSubEta, onChangeTitle, onChangeSubTitle }) {
  const meta = CATEGORY_META[name];
  const color = PALETTE[meta.colorKey] || PALETTE.forest;
  const items = tasks.filter((t) => t.categorie === name);
  const todo = items.filter((t) => !t.done).length;
  const [expandSignal, setExpandSignal] = useState(null);
  const toggleExpandAll = () => setExpandSignal((prev) => ({ open: !(prev?.open), key: (prev?.key || 0) + 1 }));
  return (
    <div>
      <PageTitle icon={meta.icon} color={color} title={name} subtitle={`${todo} à faire · ${items.length} mission${items.length > 1 ? "s" : ""}`}
        action={items.length > 0 && (
          <IconButton icon={expandSignal?.open ? ChevronsUp : ChevronsDown} variant="ghost" size={32} iconSize={14}
            onClick={toggleExpandAll} title={expandSignal?.open ? "Tout replier" : "Tout déplier"} />
        )} />
      <div style={{ marginBottom: 10 }}>
        <Composer placeholder={`Nouvelle mission ${name}…`} onSubmit={(v) => onAddTask(v, name)} />
      </div>
      {items.length === 0 && <EmptyState title="Rien ici" subtitle="Ajoute une mission avec le champ ci-dessus" />}
      {items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((t) => (
            <CategoryTaskRow key={t.id} task={t}
              onToggle={() => onToggle(t.id)} onDelete={() => onDelete(t.id)}
              onChangeCategorie={(v) => onChangeCategorie(t.id, v)}
              onChangeEta={(v) => onChangeEta(t.id, v)}
              onChangeTitle={onChangeTitle ? (v) => onChangeTitle(t.id, v) : undefined}
              onChangeSubTitle={onChangeSubTitle}
              onAddSub={onAddSubtask} onToggleSub={onToggleSubtask} onDeleteSub={onDeleteSubtask}
              onChangeSubEta={onChangeSubEta} expandSignal={expandSignal} />
          ))}
        </div>
      )}
    </div>
  );
}

function DossierCard({ dossier, index, onOpen, onDelete, onDragStart }) {
  const pct = dossierPct(dossier);
  const color = colorForIndex(index);
  const taskCount = dossier.tasks.reduce((a, t) => a + (t.subtasks?.length || 1), 0);
  return (
    <div
      className="cl-card"
      style={cardStyle({
        borderRadius: PALETTE.radiusCardLg, padding: "11px 11px 11px 10px", cursor: "pointer",
        display: "flex", flexDirection: "column", gap: 9,
      })}
      onClick={() => onOpen(dossier.id)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        {onDragStart && <DragHandle onPointerDown={onDragStart} />}
        <IconBadge icon={Folder} color={color} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: PALETTE.fontDisplay, fontWeight: 600, fontSize: 14.5, color: PALETTE.ink, wordBreak: "break-word", lineHeight: 1.25 }}>
            {dossier.name}
          </div>
          <div style={{ fontSize: 11, color: PALETTE.inkFaint, marginTop: 1 }}>{taskCount} mission{taskCount > 1 ? "s" : ""} · {pct}%</div>
        </div>
        <IconButton icon={Trash2} variant="subtle" size={30} iconSize={13} onClick={(e) => { e.stopPropagation(); onDelete(dossier.id); }} title="Supprimer" />
      </div>
      <ProgressBar pct={pct} color={color} />
    </div>
  );
}

function DossiersView({ dossiers, onReorderDossiers, onOpenDossier, onDeleteDossier, onResetOrder }) {
  const isEmpty = dossiers.length === 0;
  const doneCount = dossiers.filter((d) => dossierPct(d) === 100).length;
  return (
    <div>
      <SectionHead icon={Folder} label={`Dossiers · ${doneCount}/${dossiers.length} terminés`} color={PALETTE.forest}
        right={<PillButton variant="ghost" icon={RotateCcw} onClick={onResetOrder}>A→Z</PillButton>} />
      {isEmpty && <EmptyState icon={Folder} title="Aucun dossier" subtitle="Décris un projet à l'assistant pour en créer un" />}
      {dossiers.length > 0 && (
        <SortableList items={dossiers} keyId="id" onReorder={onReorderDossiers}
          gridStyle={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 9, alignItems: "start" }}
          renderItem={(d, i, drag) => <DossierCard dossier={d} index={i} onOpen={onOpenDossier} onDelete={onDeleteDossier} onDragStart={drag} />} />
      )}
    </div>
  );
}

function BarRow({ label, current, max, color, icon: Icon }) {
  const pct = max ? Math.round((current / max) * 100) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {Icon && <Icon size={14} color={color} />}
        <span style={{ fontSize: 11, fontWeight: 600, color: PALETTE.inkSoft, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
        <span style={{ fontFamily: PALETTE.fontDisplay, fontSize: 14, fontWeight: 700, color }}>{current}</span>
        <span style={{ fontSize: 10.5, color: PALETTE.inkFaint }}>/{max}</span>
      </div>
      <ProgressBar pct={pct} color={color} height={6} />
    </div>
  );
}

function DashboardView({ state, weekly, daily, monthly, emailItems }) {
  const totalDone = state.tasks.filter((t) => t.done).length + state.dossiers.reduce((a, d) => a + d.tasks.reduce((b, t) => b + (t.subtasks?.length ? t.subtasks.filter((s) => s.done).length : t.done ? 1 : 0), 0), 0);
  const totalCount = state.tasks.length + state.dossiers.reduce((a, d) => a + d.tasks.reduce((b, t) => b + (t.subtasks?.length || 1), 0), 0);
  const weekDone = weekly.groups.reduce((a, g) => a + g.tasks.filter((t) => t.done).length, 0);
  const weekTotal = weekly.groups.reduce((a, g) => a + g.tasks.length, 0);
  const dailyDone = daily.groups.reduce((a, g) => a + g.tasks.filter((t) => t.done).length, 0);
  const dailyTotal = daily.groups.reduce((a, g) => a + g.tasks.length, 0);
  const monthlyDone = monthly.groups.reduce((a, g) => a + g.tasks.filter((t) => t.done).length, 0);
  const monthlyTotal = monthly.groups.reduce((a, g) => a + g.tasks.length, 0);
  const emailTotal = Array.isArray(emailItems) ? emailItems.reduce((a, g) => a + (g.items?.length || 0), 0) : 0;

  const dayDone = weekDone + dailyDone + totalDone;
  const dayTotal = weekTotal + dailyTotal + totalCount;

  return (
    <div>
      <HeroStrip done={dayDone} total={dayTotal} />

      <SectionHead icon={TrendingUp} label="Vue d'ensemble" color={PALETTE.sky} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 9, marginBottom: 14 }}>
        <div className="cl-card" style={cardStyle({ padding: 12 })}><BarRow label="Missions" current={totalDone} max={totalCount || 1} color={PALETTE.amber} icon={ListChecks} /></div>
        <div className="cl-card" style={cardStyle({ padding: 12 })}><BarRow label="Hebdo" current={weekDone} max={weekTotal || 1} color={PALETTE.sky} icon={CalendarDays} /></div>
        <div className="cl-card" style={cardStyle({ padding: 12 })}><BarRow label="Daily" current={dailyDone} max={dailyTotal || 1} color={PALETTE.berry} icon={Zap} /></div>
        <div className="cl-card" style={cardStyle({ padding: 12 })}><BarRow label="Mensuelle" current={monthlyDone} max={monthlyTotal || 1} color={PALETTE.sage} icon={CalendarRange} /></div>
        <div className="cl-card" style={cardStyle({ padding: 12 })}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Mail size={14} color={PALETTE.clay} />
            <span style={{ fontSize: 11, fontWeight: 600, color: PALETTE.inkSoft, flex: 1 }}>Email</span>
            <span style={{ fontFamily: PALETTE.fontDisplay, fontSize: 14, fontWeight: 700, color: PALETTE.clay }}>{emailTotal}</span>
          </div>
          <div style={{ fontSize: 10.5, color: PALETTE.inkFaint, marginTop: 5 }}>action{emailTotal > 1 ? "s" : ""} à traiter</div>
        </div>
      </div>

      {state.dossiers.length > 0 && (
        <div className="cl-card" style={cardStyle({ padding: 14 })}>
          <SectionHead icon={Folder} label="Dossiers actifs" color={PALETTE.forest} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: 10 }}>
            {state.dossiers.map((d, i) => {
              const pct = dossierPct(d);
              return (
                <div key={d.id} style={{ textAlign: "center" }}>
                  <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <ProgressRing pct={pct} color={colorForIndex(i)} size={42} />
                    <span style={{ position: "absolute", fontSize: 9.5, fontWeight: 700, color: PALETTE.inkSoft }}>{pct}</span>
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: PALETTE.ink, marginTop: 5, wordBreak: "break-word", lineHeight: 1.25 }}>{d.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DailyView({ daily, onToggleTask }) {
  const total = daily.groups.reduce((a, g) => a + g.tasks.length, 0);
  const done = daily.groups.reduce((a, g) => a + g.tasks.filter((t) => t.done).length, 0);
  return (
    <div>
      <PageTitle icon={Zap} color={PALETTE.berry} title="Quotidien" subtitle={`${done} / ${total} · rituels du jour`} />
      <RitualBoard groups={daily.groups} onToggleTask={onToggleTask} colorFor={(g, i) => colorForIndex(i)} />
    </div>
  );
}

function WeekView({ weekly, onToggleTask }) {
  const total = weekly.groups.reduce((a, g) => a + g.tasks.length, 0);
  const done = weekly.groups.reduce((a, g) => a + g.tasks.filter((t) => t.done).length, 0);
  const groupColors = weekGroupColors();
  return (
    <div>
      <PageTitle icon={CalendarDays} color={PALETTE.sky} title="Hebdo" subtitle={`${done} / ${total} · lundi → dimanche`} />
      <RitualBoard
        groups={weekly.groups}
        onToggleTask={onToggleTask}
        colorFor={(g) => groupColors[g.name] || PALETTE.forest}
        iconFor={(g) => WEEK_ICONS[g.name] || Circle}
      />
    </div>
  );
}

function MonthlyView({ monthly, onToggleTask }) {
  const total = monthly.groups.reduce((a, g) => a + g.tasks.length, 0);
  const done = monthly.groups.reduce((a, g) => a + g.tasks.filter((t) => t.done).length, 0);
  return (
    <div>
      <PageTitle icon={CalendarRange} color={PALETTE.clay} title="Mensuelle" subtitle={`${done} / ${total} · rituels du mois`} />
      <RitualBoard groups={monthly.groups} onToggleTask={onToggleTask} colorFor={(g, i) => colorForIndex(i + 1)} />
    </div>
  );
}

// En-tête de page compact commun (remplace l'ancien PageHeader, moitié moins haut)
function PageTitle({ icon: Icon, color, title, subtitle, action }) {
  const accent = color || PALETTE.forest;
  return (
    <div className="cl-rise" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      {Icon && <IconBadge icon={Icon} color={accent} size={36} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={titleStyle({ fontSize: Math.round(PALETTE.h1Size * 0.82) })}>{title}</h1>
        {subtitle && <p style={{ fontSize: 11.5, color: PALETTE.inkFaint, margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function SportView({ sport, onOpenDossier }) {
  return (
    <div>
      <PageTitle icon={Dumbbell} color={PALETTE.sage} title="Sport" subtitle={`${sport.dossiers.length} programmes`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 9 }}>
        {sport.dossiers.map((d, i) => {
          const pct = dossierPct(d);
          const color = colorForIndex(i);
          return (
            <div key={d.id} className="cl-card" onClick={() => onOpenDossier(d.id)} style={cardStyle({
              borderRadius: PALETTE.radiusCardLg, padding: "12px", cursor: "pointer", borderColor: `${color}55`,
            })}>
              <ProgressRing pct={pct} color={color} size={30} />
              <div style={{ fontFamily: PALETTE.fontDisplay, fontWeight: 600, fontSize: 14.5, color: PALETTE.ink, marginTop: 8 }}>{d.name}</div>
              <div style={{ fontSize: 11, color: PALETTE.inkFaint, marginTop: 2 }}>{d.tasks.length} missions · {pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DossierDetailView({ dossier, onBack, onToggleTask, onDeleteTask, onAddTask, onAddSubtask, onToggleSubtask, onDeleteSubtask, onReorderTasks, onChangeTitle, onChangeSubTitle }) {
  const done = dossier.tasks.filter((t) => t.done).length + dossier.tasks.reduce((a, t) => a + (t.subtasks?.filter((s) => s.done).length || 0), 0);
  const total = dossier.tasks.length + dossier.tasks.reduce((a, t) => a + (t.subtasks?.length || 0), 0);
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <IconButton icon={ChevronLeft} variant="ghost" size={36} iconSize={16} onClick={onBack} title="Retour" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={titleStyle({ fontSize: Math.round(PALETTE.h1Size * 0.82) })}>{dossier.name}</h1>
          <p style={{ fontSize: 11.5, color: PALETTE.inkFaint, margin: "2px 0 0" }}>{done} / {total} · {pct}%</p>
        </div>
        <div style={{ width: 90 }}><ProgressBar pct={pct} color={PALETTE.forest} height={6} /></div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <Composer placeholder="Nouvelle mission du dossier…" onSubmit={(v) => onAddTask(dossier.id, v)} />
      </div>
      {dossier.tasks.length > 0 && (
        <MissionGrid
          tasks={dossier.tasks}
          onReorder={onReorderTasks}
          onToggle={onToggleTask}
          onDelete={onDeleteTask}
          onAddSub={onAddSubtask}
          onToggleSub={onToggleSubtask}
          onDeleteSub={onDeleteSubtask}
          onChangeTitle={onChangeTitle}
          onChangeSubTitle={onChangeSubTitle}
        />
      )}
      {dossier.tasks.length === 0 && <EmptyState title="Dossier vide" subtitle="Ajoute une mission avec le champ ci-dessus" />}
    </div>
  );
}

function EmailGroupFolder({ group, onDismiss }) {
  const [expanded, setExpanded] = useState(false);
  const itemCount = group.items ? group.items.length : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <button className="cl-card" onClick={() => setExpanded(!expanded)} style={cardStyle({
        width: "100%", padding: "11px 12px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", minHeight: 48,
        borderColor: `${group.color}55`,
      })}>
        <IconBadge icon={Mail} color={group.color} size={30} />
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontWeight: 600, fontSize: 13.5, color: PALETTE.ink }}>{group.group}</div>
          <div style={{ fontSize: 11, color: PALETTE.inkFaint }}>{itemCount} action{itemCount > 1 ? "s" : ""}</div>
        </div>
        {expanded ? <ChevronDown size={15} color={PALETTE.inkFaint} /> : <ChevronRight size={15} color={PALETTE.inkFaint} />}
      </button>
      {expanded && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 6, paddingLeft: 8, marginTop: 8, borderLeft: `3px solid ${group.color}` }}>
          {group.items?.map((it) => (
            <div key={it.id} style={{ background: `${group.color}0d`, border: `1px solid ${group.color}25`, borderRadius: PALETTE.radiusChip, padding: "9px 6px 9px 11px", display: "flex", alignItems: "flex-start", gap: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: group.color, textTransform: "uppercase", marginBottom: 2 }}>{it.sender}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: PALETTE.ink, wordBreak: "break-word" }}>{it.title}</div>
                {it.summary && <div style={{ fontSize: 11, color: PALETTE.inkFaint, marginTop: 3 }}>{it.summary}</div>}
              </div>
              <IconButton icon={X} variant="subtle" size={28} iconSize={13} onClick={() => onDismiss(it.id)} title="Ignorer" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmailView({ items, scanning, lastScan, onScan, onDismiss }) {
  const totalItems = Array.isArray(items) ? items.reduce((a, g) => a + (g.items?.length || 0), 0) : 0;
  return (
    <div>
      <PageTitle
        icon={Mail} color={PALETTE.clay} title="Email"
        subtitle={lastScan ? `Scanné ${new Date(lastScan).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}` : "Jamais scanné"}
        action={
          <PillButton variant="primary" icon={scanning ? Loader2 : Mail} onClick={onScan} disabled={scanning}>
            {scanning ? "Scan 30j..." : "Scanner 30j"}
          </PillButton>
        }
      />
      {!scanning && totalItems === 0 && <EmptyState icon={Sparkles} title="Inbox propre" subtitle="Aucune action en attente" />}
      {Array.isArray(items) && items.map((g) => <EmailGroupFolder key={g.id} group={g} onDismiss={onDismiss} />)}
    </div>
  );
}

// Le contenu vient de l'état persisté de l'app, pas d'un `useState` local :
// React réutilise cette instance quand on passe d'un domaine à l'autre, or un
// initialiseur de `useState` ne rejoue jamais après le montage — les cinq
// domaines affichaient donc tous le contenu du premier ouvert. Le `key` posé
// à l'appel garantit en plus que les univers dépliés se referment en changeant
// de domaine.
function DomainView({ domainId, univers, onDeleteObjectif }) {
  const domain = DOMAINES[domainId];
  const [expandedUnivers, setExpandedUnivers] = useState({});

  if (!domain) return null;
  const Icon = domain.icon;
  const domColor = PALETTE[domain.colorKey] || PALETTE.forest;
  const objectifs = univers || [];

  const toggleUnivers = (univerName) => {
    setExpandedUnivers((prev) => ({ ...prev, [univerName]: !prev[univerName] }));
  };

  const deleteObjectif = (univerName, objectifId) => onDeleteObjectif(domainId, univerName, objectifId);

  return (
    <div>
      <PageTitle icon={Icon} color={domColor} title={domain.name} subtitle={`Domaine de vie · ${objectifs.length} univers`} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8, alignItems: "start" }}>
        {objectifs.map((u) => {
          const isExpanded = expandedUnivers[u.name];
          return (
            <div key={u.name}>
              <button
                className="cl-card"
                onClick={() => toggleUnivers(u.name)}
                style={cardStyle({
                  width: "100%", padding: "11px 13px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", minHeight: 46,
                })}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: domColor, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: PALETTE.bodyWeight, color: PALETTE.ink, flex: 1, textAlign: "left" }}>{u.name}</span>
                <span style={{ fontSize: 10.5, color: PALETTE.inkFaint, fontWeight: 600 }}>{u.items.length}</span>
                <ChevronRight size={15} color={PALETTE.inkFaint} style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
              </button>

              {isExpanded && (
                <div className="cl-rise" style={{ paddingLeft: 16, paddingTop: 6, display: "flex", flexDirection: "column", gap: 5 }}>
                  {u.items.map((obj) => (
                    <div key={obj.id} style={{
                      background: PALETTE.canvasDeep, border: `1px solid ${PALETTE.lineSoft}`, borderRadius: PALETTE.radiusChip,
                      padding: "8px 10px", fontSize: 12.5, color: PALETTE.ink,
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                    }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: domColor, flexShrink: 0 }} />
                        {obj.title}
                      </span>
                      <TrashLink onClick={() => deleteObjectif(u.name, obj.id)} size={13} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// APP SHELL — navigation compacte : une rangée marque + Tâches,
// puis UNE rangée d'icônes (récurrences · domaines). L'actif
// s'étire en pilule avec son libellé, le reste est icône seule.
// ============================================================
// ---------- Catégories de missions ----------
// Cinq catégories fixes, indépendantes des dossiers/domaines : une mission
// n'appartient qu'à une catégorie à la fois (ou aucune, `categorie: null`).
const CATEGORY_META = {
  Matera: { icon: Home, colorKey: "forest" },
  Boulot: { icon: Briefcase, colorKey: "sky" },
  AdminFR: { icon: Landmark, colorKey: "berry" },
  AdminDE: { icon: Stamp, colorKey: "clay" },
  Placement: { icon: PiggyBank, colorKey: "sage" },
};
const CATEGORIES = Object.keys(CATEGORY_META);

const NAV_ITEMS = [
  { id: "daily", label: "Daily", icon: Zap },
  { id: "week", label: "Hebdo", icon: CalendarDays },
  { id: "monthly", label: "Mensuelle", icon: CalendarRange },
  { id: "email", label: "Email", icon: Mail },
  { id: "_sep", sep: true },
  { id: "domaine-vitalite", label: "Vitalité", icon: Heart },
  { id: "domaine-etudes", label: "Études", icon: BookOpen },
  { id: "domaine-passions", label: "Passions", icon: Sparkles },
  { id: "domaine-modeles", label: "Modèles Éco", icon: TrendingUp },
  { id: "domaine-gestion", label: "Gestion", icon: Wallet },
];
// Catégories : ligne à part, sous la ligne principale (voir headerInner).
const NAV_CATEGORY_ITEMS = CATEGORIES.map((name) => ({ id: `cat-${name}`, label: name, icon: CATEGORY_META[name].icon }));

// ---------- Domaines de vie (arborescence) ----------
const DOMAINES = {
  "domaine-vitalite": {
    name: "Vitalité", icon: Heart, colorKey: "sage",
    univers: [
      { name: "Santé", objectifs: [
        { id: uid(), title: "Réparer mon dos", done: false },
        { id: uid(), title: "Arrêter de fumer", done: false },
        { id: uid(), title: "eau", done: false },
        { id: uid(), title: "fume", done: false },
      ]},
      { name: "Sport", objectifs: [
        { id: uid(), title: "Construire une discipline de jogging", done: false },
        { id: uid(), title: "Nager une fois par semaine", done: false },
        { id: uid(), title: "jog", done: false },
        { id: uid(), title: "piscine", done: false },
      ]},
      { name: "Hygiène", objectifs: [
        { id: uid(), title: "douche", done: false },
        { id: uid(), title: "range", done: false },
      ]},
    ],
  },
  "domaine-etudes": {
    name: "Études", icon: BookOpen, colorKey: "sky",
    univers: [
      { name: "Langue", objectifs: [
        { id: uid(), title: "Connaître les lettres en arabe", done: false },
        { id: uid(), title: "Conversation simple en russe", done: false },
        { id: uid(), title: "arabe", done: false },
        { id: uid(), title: "russe", done: false },
      ]},
      { name: "Conservatoire", objectifs: [
        { id: uid(), title: "Lire les notes clés de sol", done: false },
        { id: uid(), title: "Reconnaître la hauteur des notes", done: false },
        { id: uid(), title: "solfège", done: false },
        { id: uid(), title: "oreille", done: false },
      ]},
      { name: "Apps", objectifs: [
        { id: uid(), title: "Applications d'organisation des tâches de vie", done: false },
        { id: uid(), title: "Applications de gestion des tonalités pour patients", done: false },
        { id: uid(), title: "tuna", done: false },
        { id: uid(), title: "clairière", done: false },
        { id: uid(), title: "tour", done: false },
      ]},
    ],
  },
  "domaine-passions": {
    name: "Passions", icon: Sparkles, colorKey: "berry",
    univers: [
      { name: "Clarinette", objectifs: [
        { id: uid(), title: "Discipline d'entraînement", done: false },
        { id: uid(), title: "Jouer devant public une fois par semaine", done: false },
        { id: uid(), title: "Jouer avec des gens une fois par semaine", done: false },
        { id: uid(), title: "app", done: false },
        { id: uid(), title: "train", done: false },
        { id: uid(), title: "public", done: false },
        { id: uid(), title: "groupe", done: false },
      ]},
      { name: "Bike", objectifs: [
        { id: uid(), title: "Ride Cossade Grenoble", done: false },
        { id: uid(), title: "Débridage", done: false },
        { id: uid(), title: "ride", done: false },
        { id: uid(), title: "équipement", done: false },
      ]},
      { name: "Loisirs", objectifs: [
        { id: uid(), title: "échecs", done: false },
        { id: uid(), title: "drone", done: false },
      ]},
      { name: "Projet utopique", objectifs: [
        { id: uid(), title: "bayard", done: false },
        { id: uid(), title: "gaming", done: false },
        { id: uid(), title: "baliseur", done: false },
      ]},
    ],
  },
  "domaine-modeles": {
    name: "Modèles Économiques", icon: TrendingUp, colorKey: "clay",
    univers: [
      { name: "Projet pro", objectifs: [
        { id: uid(), title: "guide conf", done: false },
        { id: uid(), title: "webmaster", done: false },
      ]},
      { name: "Boulot", objectifs: [
        { id: uid(), title: "CEA", done: false },
        { id: uid(), title: "accent", done: false },
      ]},
      { name: "Lifestyle", objectifs: [
        { id: uid(), title: "placement", done: false },
        { id: uid(), title: "social", done: false },
        { id: uid(), title: "planning", done: false },
      ]},
    ],
  },
  "domaine-gestion": {
    name: "Gestion", icon: Wallet, colorKey: "forest",
    univers: [
      { name: "Moustier", objectifs: [
        { id: uid(), title: "matera", done: false },
        { id: uid(), title: "travaux", done: false },
        { id: uid(), title: "rénovation intérieure", done: false },
      ]},
      { name: "Urbane", objectifs: [
        { id: uid(), title: "résidéa", done: false },
        { id: uid(), title: "locataire", done: false },
      ]},
      { name: "Admin", objectifs: [
        { id: uid(), title: "France", done: false },
        { id: uid(), title: "Allemagne", done: false },
      ]},
      { name: "Finance", objectifs: [
        { id: uid(), title: "compte", done: false },
        { id: uid(), title: "savings", done: false },
      ]},
    ],
  },
};

// Contenu initial des domaines, sous une forme modifiable et enregistrable.
function defaultDomaines() {
  const out = {};
  Object.entries(DOMAINES).forEach(([id, d]) => {
    out[id] = d.univers.map((u) => ({ name: u.name, items: u.objectifs.map((o) => ({ ...o })) }));
  });
  return out;
}

// On repart des domaines connus du code, et on reprend ce qui a été enregistré
// quand c'est exploitable : un domaine ajouté depuis la dernière visite apparaît
// avec son contenu d'origine au lieu de rester vide.
function mergeDomaines(stored) {
  const base = defaultDomaines();
  if (!stored || typeof stored !== "object") return base;
  const out = {};
  Object.keys(base).forEach((id) => {
    const s = stored[id];
    out[id] = Array.isArray(s) ? s : base[id];
  });
  return out;
}

export default function Clairiere() {
  useFonts();
  const [themeId, setThemeId] = useState("clairiere");
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [state, setState] = useState(defaultState());
  const [weekly, setWeekly] = useState(defaultWeekly());
  const [daily, setDaily] = useState(defaultDaily());
  const [monthly, setMonthly] = useState(defaultMonthly());
  const [sport, setSport] = useState(defaultSport());
  const [domaines, setDomaines] = useState(defaultDomaines);
  const [emailItems, setEmailItems] = useState([]);
  const [emailScanning, setEmailScanning] = useState(false);
  const [emailLastScan, setEmailLastScan] = useState(null);
  const [loaded, setLoaded] = useState(false);
  // Chargement en échec : on n'écrit plus rien tant que la page n'a pas été
  // rechargée avec succès, sinon les défauts affichés écraseraient les données.
  const [loadFailed, setLoadFailed] = useState(false);
  // Page ouverte en http : aucun micro possible, quel que soit le bouton. On
  // le dit une fois, en haut, avec le moyen d'en sortir — plutôt qu'un message
  // d'échec sans issue à chaque tentative de dictée.
  const [insecure] = useState(() => typeof window !== "undefined" && !window.isSecureContext);
  const [insecureHidden, setInsecureHidden] = useState(false);
  const [saveOk, setSaveOk] = useState(true);
  const [view, setView] = useState("tasks");
  const [activeDossierId, setActiveDossierId] = useState(null);
  const [dossierSource, setDossierSource] = useState("main"); // "main" | "objectifs"
  const [dossierReturnView, setDossierReturnView] = useState("dossiers");
  const [messages, setMessages] = useState([{ role: "assistant", content: "Prête. Dis-moi ce qu'il faut faire." }]);
  const [assistantStatus, setAssistantStatus] = useState("ok");
  const [chatOpen, setChatOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [confirmingClearDone, setConfirmingClearDone] = useState(false);
  const scrollRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState(false);
  const recognitionRef = useRef(null);
  const voice = useVoiceCapture();
  const voiceTargetRef = useRef(null);
  const [voiceArmed, setVoiceArmed] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  // ---- initial load ----
  // Tant que TOUTES les clés n'ont pas été lues, on n'enregistre rien. Un
  // serveur qui redémarre pendant le chargement renvoyait des lectures vides,
  // et l'app enregistrait aussitôt ses données de démonstration par-dessus le
  // vrai contenu : sept clés perdues d'un coup.
  useEffect(() => {
    (async () => {
      const [s, w, d, sp, ec, c, th, mo, dm] = await Promise.all([
        storageGet(STORAGE_KEYS.state), storageGet(STORAGE_KEYS.weekly), storageGet(STORAGE_KEYS.daily),
        storageGet(STORAGE_KEYS.sport), storageGet(STORAGE_KEYS.emails), storageGet(STORAGE_KEYS.chat),
        storageGet(STORAGE_KEYS.theme), storageGet(STORAGE_KEYS.monthly), storageGet(STORAGE_KEYS.domaines),
      ]);
      const reads = [s, w, d, sp, ec, c, th, mo, dm];
      if (reads.some((r) => !r.ok)) {
        setLoadFailed(true);
        return;
      }
      const migrated = LEGACY_THEME_IDS[th.value] || th.value;
      if (migrated && THEMES[migrated]) { applyTheme(migrated); setThemeId(migrated); }
      if (s.value && (s.value.tasks || s.value.dossiers)) {
        setState({ tasks: normalizeTasks(s.value.tasks), dossiers: normalizeDossiers(s.value.dossiers) });
      }
      if (w.value) {
        const currentMonday = getMondayISO();
        if (w.value.weekStart !== currentMonday) {
          const reset = { ...w.value, weekStart: currentMonday, groups: w.value.groups.map((g) => ({ ...g, tasks: g.tasks.map((t) => ({ ...t, done: false })) })) };
          setWeekly(reset);
          storageSet(STORAGE_KEYS.weekly, reset);
        } else setWeekly(w.value);
      }
      if (d.value) setDaily(d.value);
      if (mo.value) setMonthly(mo.value);
      if (sp.value) setSport({ ...sp.value, dossiers: normalizeDossiers(sp.value.dossiers) });
      if (ec.value) { setEmailItems(ec.value.items || []); setEmailLastScan(ec.value.lastScan || null); }
      if (c.value) setMessages(c.value);
      setDomaines(mergeDomaines(dm.value));
      setLoaded(true);
    })();
  }, []);

  // ---- persistence (post-load only) ----
  useEffect(() => { if (loaded) storageSet(STORAGE_KEYS.state, state).then(setSaveOk); }, [state, loaded]);
  useEffect(() => { if (loaded) storageSet(STORAGE_KEYS.weekly, weekly); }, [weekly, loaded]);
  useEffect(() => { if (loaded) storageSet(STORAGE_KEYS.daily, daily); }, [daily, loaded]);
  useEffect(() => { if (loaded) storageSet(STORAGE_KEYS.monthly, monthly); }, [monthly, loaded]);
  useEffect(() => { if (loaded) storageSet(STORAGE_KEYS.sport, sport); }, [sport, loaded]);
  useEffect(() => { if (loaded) storageSet(STORAGE_KEYS.chat, messages); }, [messages, loaded]);
  useEffect(() => { if (loaded) storageSet(STORAGE_KEYS.domaines, domaines).then(setSaveOk); }, [domaines, loaded]);
  useEffect(() => { if (loaded) storageSet(STORAGE_KEYS.emails, { items: emailItems, lastScan: emailLastScan }); }, [emailItems, emailLastScan, loaded]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, sending, chatOpen]);

  const toggleRecording = () => {
    if (isRecording) { try { recognitionRef.current?.stop(); } catch {} setIsRecording(false); return; }
    // En http, la reconnaissance vocale du navigateur est bloquée comme le
    // reste : on renvoie vers le bandeau qui sait basculer en https.
    if (insecure) { setInsecureHidden(false); showToast(MIC_HELP.insecure); return; }
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) { setMicError(true); setTimeout(() => setMicError(false), 4500); return; }
    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = "fr-FR"; recognition.interimResults = true; recognition.continuous = false;
      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
        setInput(transcript);
      };
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => { setIsRecording(false); setMicError(true); setTimeout(() => setMicError(false), 4500); };
      recognitionRef.current = recognition;
      setInput(""); recognition.start(); setIsRecording(true);
    } catch { setMicError(true); setTimeout(() => setMicError(false), 4500); }
  };

  const toggleSimpleTask = (id) => setState((prev) => ({ ...prev, tasks: prev.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
  const deleteSimpleTask = (id) => setState((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
  const reorderTasks = (next) => setState((prev) => ({ ...prev, tasks: next }));
  const reorderDossiers = (next) => setState((prev) => ({ ...prev, dossiers: next }));

  const resetTasksOrder = () => setState((prev) => ({ ...prev, tasks: [...prev.tasks].sort((a, b) => a.title.localeCompare(b.title, "fr")) }));
  const resetDossiersOrder = () => setState((prev) => ({ ...prev, dossiers: [...prev.dossiers].sort((a, b) => a.name.localeCompare(b.name, "fr")) }));

  const deleteDossier = (id) => {
    setState((prev) => ({ ...prev, dossiers: prev.dossiers.filter((d) => d.id !== id) }));
    if (activeDossierId === id) setView("dossiers");
  };
  const openDossier = (id) => { setActiveDossierId(id); setDossierSource("main"); setDossierReturnView("dossiers"); setView("dossier"); };

  // ---- reset tâches + dossiers uniquement ----
  const confirmReset = () => {
    setState({ tasks: [], dossiers: [] });
    setConfirmingReset(false);
    setView("tasks");
  };

  // ---- effacer tâches faites, partout : missions, leurs sous-missions, et
  // les mêmes dans chaque dossier ----
  const confirmClearDone = () => {
    setState((prev) => ({
      tasks: prev.tasks
        .filter((t) => !t.done)
        .map((t) => ({ ...t, subtasks: (t.subtasks || []).filter((s) => !s.done) })),
      dossiers: prev.dossiers.map((d) => ({
        ...d,
        tasks: d.tasks
          .filter((t) => !t.done)
          .map((t) => ({ ...t, subtasks: (t.subtasks || []).filter((s) => !s.done) })),
      })),
    }));
    setConfirmingClearDone(false);
  };

  const toggleWeeklyTask = (groupId, taskId) => setWeekly((prev) => ({ ...prev, groups: prev.groups.map((g) => (g.id !== groupId ? g : { ...g, tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) })) }));
  const toggleDailyTask = (groupId, taskId) => setDaily((prev) => ({ ...prev, groups: prev.groups.map((g) => (g.id !== groupId ? g : { ...g, tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) })) }));
  const toggleMonthlyTask = (groupId, taskId) => setMonthly((prev) => ({ ...prev, groups: prev.groups.map((g) => (g.id !== groupId ? g : { ...g, tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) })) }));

  // ---- handlers génériques dossier (state.dossiers) ----
  const withActiveCollection = (updater) => {
    setState((prev) => ({ ...prev, dossiers: updater(prev.dossiers) }));
  };
  const toggleDossierTask = (taskId) => withActiveCollection((dossiers) => dossiers.map((d) => (d.id === activeDossierId ? { ...d, tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) } : d)));
  const deleteDossierTask = (taskId) => withActiveCollection((dossiers) => dossiers.map((d) => (d.id === activeDossierId ? { ...d, tasks: d.tasks.filter((t) => t.id !== taskId) } : d)));
  const addTaskToDossier = (dossierId, title) => withActiveCollection((dossiers) => dossiers.map((d) => (d.id === dossierId ? { ...d, tasks: [...d.tasks, { id: uid(), title: title || "Nouvelle mission", done: false, subtasks: [] }] } : d)));
  const reorderDossierTasks = (next) => withActiveCollection((dossiers) => dossiers.map((d) => (d.id === activeDossierId ? { ...d, tasks: next } : d)));
  const addSubtask = (taskId, title) => withActiveCollection((dossiers) => dossiers.map((d) => (d.id === activeDossierId ? { ...d, tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), { id: uid(), title: title || "Sous-mission", done: false }] } : t)) } : d)));
  const toggleSubtask = (taskId, subtaskId) => withActiveCollection((dossiers) => dossiers.map((d) => (d.id === activeDossierId ? { ...d, tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: (t.subtasks || []).map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s)) } : t)) } : d)));
  const deleteSubtask = (taskId, subtaskId) => withActiveCollection((dossiers) => dossiers.map((d) => (d.id === activeDossierId ? { ...d, tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: (t.subtasks || []).filter((s) => s.id !== subtaskId) } : t)) } : d)));
  const changeDossierTaskTitle = (taskId, title) => withActiveCollection((dossiers) => dossiers.map((d) => (d.id === activeDossierId ? { ...d, tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, title } : t)) } : d)));
  const changeDossierSubtaskTitle = (taskId, subtaskId, title) => withActiveCollection((dossiers) => dossiers.map((d) => (d.id === activeDossierId ? { ...d, tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: (t.subtasks || []).map((s) => (s.id === subtaskId ? { ...s, title } : s)) } : t)) } : d)));

  const deleteObjectif = (domainId, univerName, objectifId) =>
    setDomaines((prev) => ({
      ...prev,
      [domainId]: (prev[domainId] || []).map((u) =>
        u.name === univerName ? { ...u, items: u.items.filter((o) => o.id !== objectifId) } : u
      ),
    }));

  const backToMain = () => setView(dossierReturnView || "dossiers");
  const dismissEmail = (id) => setEmailItems((prev) => prev.map((g) => ({ ...g, items: g.items.filter((it) => it.id !== id) })).filter((g) => g.items.length > 0));

  const changeTheme = (id) => {
    applyTheme(id);
    setThemeId(id);
    setThemePickerOpen(false);
    storageSet(STORAGE_KEYS.theme, id);
  };

  const handleScanEmails = async () => {
    setEmailScanning(true);
    try {
      const items = await scanGmailForActions();
      setEmailItems(items);
      setEmailLastScan(new Date().toISOString());
    } catch (e) { console.error("scan failed", e); }
    finally { setEmailScanning(false); }
  };


  // ---- Dictée : capture, transcription, découpage ----
  const showToast = useCallback((message) => {
    clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  }, []);

  // Sous-tâches des missions (state.tasks) — miroir des helpers `dossiers`.
  const patchMission = (taskId, fn) =>
    setState((prev) => ({ ...prev, tasks: prev.tasks.map((t) => (t.id === taskId ? fn(t) : t)) }));

  // `toggle` ne convient pas au chat : "j'ai fini X" doit cocher X, pas
  // inverser son etat - repeter la phrase ne doit pas la decocher.
  const setMissionDone = (id, done) =>
    setState((prev) => ({ ...prev, tasks: prev.tasks.map((t) => (t.id === id ? { ...t, done } : t)) }));

  // `categorie` par défaut à null (page Tâches) ; les pages de catégorie
  // passent leur nom pour classer la mission dès la création.
  const addMissionTask = (title, categorie = null) =>
    setState((prev) => ({ ...prev, tasks: [...prev.tasks, { id: uid(), title, done: false, categorie, eta: null, subtasks: [] }] }));
  const addMissionSubtask = (taskId, title) =>
    patchMission(taskId, (t) => ({ ...t, subtasks: [...(t.subtasks || []), { id: uid(), title, done: false, eta: null }] }));
  const toggleMissionSubtask = (taskId, subId) =>
    patchMission(taskId, (t) => ({ ...t, subtasks: (t.subtasks || []).map((s) => (s.id === subId ? { ...s, done: !s.done } : s)) }));
  const deleteMissionSubtask = (taskId, subId) =>
    patchMission(taskId, (t) => ({ ...t, subtasks: (t.subtasks || []).filter((s) => s.id !== subId) }));

  const changeMissionCategorie = (taskId, categorie) =>
    patchMission(taskId, (t) => ({ ...t, categorie }));
  const changeMissionEta = (taskId, eta) =>
    patchMission(taskId, (t) => ({ ...t, eta }));
  const changeMissionSubEta = (taskId, subId, eta) =>
    patchMission(taskId, (t) => ({ ...t, subtasks: (t.subtasks || []).map((s) => (s.id === subId ? { ...s, eta } : s)) }));
  const changeMissionTitle = (taskId, title) =>
    patchMission(taskId, (t) => ({ ...t, title }));
  const changeMissionSubTitle = (taskId, subId, title) =>
    patchMission(taskId, (t) => ({ ...t, subtasks: (t.subtasks || []).map((s) => (s.id === subId ? { ...s, title } : s)) }));

  // `voiceArmed` s'allume dès l'appui, avant même que le micro soit ouvert :
  // getUserMedia peut prendre un instant, voire attendre une autorisation, et
  // sans retour visuel immédiat on croit que l'appui long n'a pas pris.
  const startVoice = useCallback(async (target) => {
    const reason = micUnavailableReason();
    if (reason) { showToast(MIC_HELP[reason]); return; }
    setVoiceArmed(true);
    voiceTargetRef.current = target;
    const failure = await voice.start();
    if (failure) {
      setVoiceArmed(false);
      voiceTargetRef.current = null;
      showToast(MIC_HELP[failure] || MIC_HELP.failed);
    }
  }, [voice, showToast]);

  const cancelVoice = useCallback(() => {
    voice.cancel();
    setVoiceArmed(false);
    voiceTargetRef.current = null;
  }, [voice]);

  // Une dictée en tâche : la ligne apparaît tout de suite en « transcription… »,
  // se remplit avec le texte brut dès qu'il arrive, puis est remplacée par le
  // titre et les sous-tâches que le modèle en tire. On ne fait jamais attendre
  // devant un écran vide, et le texte dicté n'est jamais perdu en route.
  const finishVoice = useCallback(async () => {
    const target = voiceTargetRef.current;
    const wasRecording = voice.recording;
    voiceTargetRef.current = null;
    setVoiceArmed(false);
    const blob = await voice.stop();
    if (!target) return;
    if (!blob) {
      showToast(wasRecording
        ? "Appui trop court — maintiens le bouton pour dicter."
        : "Micro pas encore prêt — réessaie.");
      return;
    }

    const placeholderId = uid();
    const isSub = target.kind === "subtask";
    const parent = isSub ? state.tasks.find((t) => t.id === target.taskId) : null;

    const setPending = (phase) => {
      if (isSub) patchMission(target.taskId, (t) => ({ ...t, subtasks: [...(t.subtasks || []), { id: placeholderId, pending: phase }] }));
      else setState((prev) => ({ ...prev, tasks: [...prev.tasks, { id: placeholderId, pending: phase }] }));
    };
    const updatePending = (patch) => {
      if (isSub) patchMission(target.taskId, (t) => ({ ...t, subtasks: (t.subtasks || []).map((sx) => (sx.id === placeholderId ? { ...sx, ...patch } : sx)) }));
      else setState((prev) => ({ ...prev, tasks: prev.tasks.map((t) => (t.id === placeholderId ? { ...t, ...patch } : t)) }));
    };
    const dropPending = () => {
      if (isSub) patchMission(target.taskId, (t) => ({ ...t, subtasks: (t.subtasks || []).filter((sx) => sx.id !== placeholderId) }));
      else setState((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== placeholderId) }));
    };

    setPending("transcribing");
    let text = "";
    try {
      text = await transcribeAudio(blob);
    } catch (e) {
      dropPending();
      showToast(e.message === "whisper_unavailable"
        ? "Transcription indisponible sur le Pi."
        : "La transcription a échoué.");
      return;
    }
    if (!text) { dropPending(); showToast("Rien entendu."); return; }

    // Le texte brut suffit déjà à avoir une tâche utilisable.
    updatePending({ title: text, done: false, pending: "thinking", subtasks: [] });

    try {
      const result = await structureText(text, isSub ? "subtask" : "task", parent?.title || "");
      if (isSub) {
        const titles = result.subtasks.length ? result.subtasks : [text];
        patchMission(target.taskId, (t) => ({
          ...t,
          subtasks: [
            ...(t.subtasks || []).filter((sx) => sx.id !== placeholderId),
            ...titles.map((title) => ({ id: uid(), title, done: false })),
          ],
        }));
      } else {
        updatePending({
          title: result.title || text,
          pending: null,
          subtasks: result.subtasks.map((title) => ({ id: uid(), title, done: false })),
        });
      }
      if (result.degraded) showToast("Modèle local indisponible : dictée gardée telle quelle.");
    } catch {
      // Le découpage a échoué : on garde la transcription brute comme tâche.
      if (isSub) {
        patchMission(target.taskId, (t) => ({
          ...t,
          subtasks: (t.subtasks || []).map((sx) => (sx.id === placeholderId ? { id: placeholderId, title: text, done: false } : sx)),
        }));
      } else updatePending({ pending: null });
      showToast("Découpage impossible : texte gardé tel quel.");
    }
  }, [voice, state.tasks, showToast]);

  const taskVoice = {
    start: () => startVoice({ kind: "task" }),
    end: finishVoice,
    cancel: cancelVoice,
  };
  const subVoice = {
    start: (taskId) => startVoice({ kind: "subtask", taskId }),
    end: finishVoice,
    cancel: cancelVoice,
  };

  // ---- Chat : appliquer une intention ----
  // C'est le front qui redige la confirmation. Il sait exactement ce qu'il
  // vient de faire, et l'ecrit instantanement - inutile de faire generer
  // "Tache ajoutee" par un modele a 7 jetons par seconde.
  const applyIntent = (intent, target, tasks) => {
    const label = (target || "").trim();

    if (intent === "add") {
      if (!label) return { reply: "Je n'ai pas saisi la mission à ajouter.", status: "question" };
      addMissionTask(label);
      return { reply: `Ajouté : ${label}`, status: "ok" };
    }
    if (intent === "add_folder") {
      if (!label) return { reply: "Quel nom pour le dossier ?", status: "question" };
      setState((prev) => ({ ...prev, dossiers: [...prev.dossiers, { id: uid(), name: label, tasks: [] }] }));
      return { reply: `Dossier créé : ${label}`, status: "ok" };
    }
    if (intent === "done" || intent === "undone" || intent === "delete") {
      // Le rapprochement se fait ici, sur les vrais titres. Un modele local
      // reecrit ou traduit les intitules (mesure : « call the plumber » pour
      // « appeler le plombier ») : on ne lui confie jamais l'identification.
      const match = findTask(tasks, label);
      if (!match) return { reply: `Je ne trouve pas « ${label} » dans tes missions.`, status: "question" };
      if (intent === "delete") {
        deleteSimpleTask(match.id);
        return { reply: `Supprimé : ${match.title}`, status: "ok" };
      }
      const done = intent === "done";
      setMissionDone(match.id, done);
      return { reply: `${done ? "Coché" : "Décoché"} : ${match.title}`, status: "ok" };
    }
    if (intent === "query") {
      const left = tasks.filter((t) => !t.done);
      if (!left.length) return { reply: "Tout est fait. Rien en attente.", status: "ok" };
      return { reply: `${left.length} en attente. La prochaine : ${left[0].title}.`, status: "ok" };
    }
    return { reply: "Je n'ai pas compris ce qu'il faut faire.", status: "question" };
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);

    // Chemin rapide : la tournure est reconnue localement, on applique sans
    // le moindre aller-retour reseau. C'est le cas de la quasi-totalite des
    // phrases tapees ici, et c'est ce qui tient la promesse des 2 secondes.
    const local = parseIntent(text);
    if (local) {
      const { reply, status } = applyIntent(local.intent, local.target, state.tasks);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      setAssistantStatus(status);
      return;
    }

    // Repechage : seule cette branche paye le cout du modele (~3 s).
    setSending(true);
    try {
      const data = await classifyIntent(text);
      if (data.degraded) {
        setMessages((m) => [...m, { role: "assistant", content: "Le modèle local n'a pas répondu. Reformule, ou dis simplement « ajoute … »." }]);
        setAssistantStatus("error");
        return;
      }
      const { reply, status } = applyIntent(data.intent, data.target, state.tasks);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      setAssistantStatus(status);
    } finally {
      setSending(false);
    }
  }, [input, sending, state.tasks]);


  // Bouton de nav icône : l'actif s'étire en pilule et montre son libellé.
  const NavIconBtn = ({ id, label, icon: Icon, big = false }) => {
    const active = view === id || (view === "dossier" && dossierReturnView === id);
    return (
      <button
        className="cl-press"
        onClick={() => setView(id)}
        title={label}
        style={{
          background: active ? accentFill() : "transparent",
          color: active ? PALETTE.onAccent : PALETTE.inkSoft,
          padding: active || big ? "0 12px" : "0 9px", height: 36,
          borderRadius: PALETTE.navRadius,
          fontSize: big ? 14 : 11.5, fontWeight: big ? PALETTE.h1Weight : 700,
          textTransform: PALETTE.navCase, letterSpacing: PALETTE.navTracking,
          fontFamily: big ? PALETTE.fontDisplay : PALETTE.fontBody,
          fontStyle: big ? PALETTE.h1Style : "normal",
          boxShadow: active && PALETTE.family === "elan" ? "2px 2px 0 rgba(17,17,17,0.85)" : "none",
          whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
          transition: "all 0.18s cubic-bezier(.34,1.4,.64,1)", flexShrink: 0, border: "none", cursor: "pointer",
        }}
      >
        <Icon size={big ? 16 : 17} />
        {(active || big) && <span>{label}</span>}
      </button>
    );
  };

  const headerInner = (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, position: "relative", flexWrap: "wrap" }}>
        <NavIconBtn id="dashboard" label="Clairière" icon={Trees} big />
        <NavIconBtn id="tasks" label="Missions" icon={ListChecks} big />
        <span style={{ width: 1, height: 22, background: PALETTE.lineSoft, margin: "0 5px", flexShrink: 0 }} />
        <div className="cl-hscroll" style={{ display: "flex", alignItems: "center", gap: 2, overflowX: "auto", flex: 1, minWidth: 120 }}>
          {NAV_ITEMS.map((it) =>
            it.sep
              ? <span key={it.id} style={{ width: 1, height: 22, background: PALETTE.lineSoft, margin: "0 5px", flexShrink: 0 }} />
              : <NavIconBtn key={it.id} id={it.id} label={it.label} icon={it.icon} />
          )}
        </div>
        <button
          className="cl-press"
          onClick={() => setThemePickerOpen((o) => !o)}
          title="Changer le style visuel"
          style={{
            width: 36, height: 36, borderRadius: PALETTE.radiusPill === "999px" ? "50%" : PALETTE.radiusChip,
            flexShrink: 0, border: cardBorder(), background: PALETTE.panel,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            boxShadow: PALETTE.cardShadow,
          }}
        >
          <span style={{
            width: 16, height: 16, borderRadius: PALETTE.radiusPill === "999px" ? "50%" : 4,
            background: `conic-gradient(${Object.values(THEMES).map((t) => t.swatch).join(",")})`,
          }} />
        </button>
        {themePickerOpen && (
          <>
            <div onClick={() => setThemePickerOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 55 }} />
            <div className="cl-rise" style={{
              position: "absolute", top: 42, right: 0, zIndex: 60,
              background: PALETTE.panel, border: cardBorder(), borderRadius: PALETTE.radiusCardLg,
              boxShadow: "0 18px 44px rgba(0,0,0,0.18)", padding: 10, width: 300, maxWidth: "calc(100vw - 28px)",
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.2, color: PALETTE.inkFaint, textTransform: "uppercase", padding: "2px 4px 9px" }}>Style visuel</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                {Object.entries(THEMES).map(([id, t]) => {
                  const active = themeId === id;
                  return (
                    <button
                      key={id}
                      className="cl-press"
                      onClick={() => changeTheme(id)}
                      title={t.tagline}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "stretch", gap: 7,
                        padding: 8, borderRadius: 12, textAlign: "left",
                        border: `2px solid ${active ? PALETTE.forest : PALETTE.lineSoft}`,
                        background: active ? PALETTE.canvasDeep : "transparent",
                        transition: "all 0.18s ease",
                      }}
                    >
                      {/* Aperçu miniature du thème */}
                      <span style={{
                        height: 30, borderRadius: 8, display: "block",
                        background: `linear-gradient(120deg, ${t.canvas || "#fff"} 0%, ${t.canvasDeep || "#eee"} 100%)`,
                        border: `1px solid ${t.line || "#ddd"}`, position: "relative", overflow: "hidden",
                      }}>
                        <span style={{ position: "absolute", left: 6, top: 8, width: 26, height: 5, borderRadius: 3, background: t.swatch }} />
                        <span style={{ position: "absolute", left: 6, top: 17, width: 40, height: 4, borderRadius: 3, background: t.line }} />
                        <span style={{ position: "absolute", right: 6, top: 8, width: 14, height: 14, borderRadius: t.checkboxShape === "square" ? 4 : "50%", background: t.swatch2 || t.swatch }} />
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 700, color: PALETTE.ink }}>
                        {t.label}
                        {active && <Check size={12} color={PALETTE.forest} style={{ marginLeft: "auto" }} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Ligne des catégories — séparée du reste de la nav, jamais mélangée. */}
      <div className="cl-hscroll" style={{ display: "flex", alignItems: "center", gap: 2, overflowX: "auto" }}>
        {NAV_CATEGORY_ITEMS.map((it) => <NavIconBtn key={it.id} id={it.id} label={it.label} icon={it.icon} />)}
      </div>
    </div>
  );

  return (
    <div style={{ background: PALETTE.appBg, fontFamily: PALETTE.fontBody, minHeight: "100vh", position: "relative" }}>
      <style>{`
        * { box-sizing: border-box; }
        html, body { background: ${PALETTE.canvas}; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: ${PALETTE.line}; border-radius: 6px; }
        .cl-hscroll { scrollbar-width: none; }
        .cl-hscroll::-webkit-scrollbar { display: none; }
        .clairiere-main { position: relative; z-index: 1; width: 100%; min-height: 100vh; min-height: 100dvh; padding: 12px 12px 84px; overflow-y: auto; max-width: 860px; margin: 0 auto; }
        @media (min-width: 600px) { .clairiere-main { padding: 14px 18px 88px; } }
        button { font-family: inherit; border: none; background: none; cursor: pointer; }
        input:focus { outline: none; }
        .cl-field::placeholder { color: var(--cl-ph); }

        /* Cartes : élévation au survol, pilotée par le thème */
        .cl-card { transition: transform .2s cubic-bezier(.34,1.3,.64,1), box-shadow .2s ease, border-color .2s ease; }
        @media (hover: hover) {
          .cl-card:hover { transform: ${PALETTE.hoverLift}; box-shadow: ${PALETTE.hoverShadow}; }
        }
        .cl-card:active { transform: scale(.985); }

        /* Retour tactile sur tout ce qui se coche */
        .cl-tap:active { transform: scale(.94); }
        .cl-press:active { transform: scale(.93); }

        /* Entrée de page / de section */
        @keyframes clRise { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: none; } }
        .cl-rise { animation: clRise .38s cubic-bezier(.22,.9,.3,1) both; }
        .clairiere-main > div > * { animation: clRise .34s cubic-bezier(.22,.9,.3,1) both; }

        /* Case cochée : petit rebond de récompense */
        @keyframes clPop { 0% { transform: scale(1); } 45% { transform: scale(1.22); } 100% { transform: scale(1); } }
        .cl-checked { animation: clPop .32s cubic-bezier(.34,1.6,.64,1); }

        @keyframes clSpin { to { transform: rotate(360deg); } }
        .cl-spin, .animate-spin { animation: clSpin 1s linear infinite; }

        @keyframes clPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .45; transform: scale(.82); } }
        .cl-rec-dot { animation: clPulse 1.1s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* Calque décoratif du thème (grain, trames) */}
      {PALETTE.appOverlay && (
        <div aria-hidden style={{ position: "fixed", inset: 0, background: PALETTE.appOverlay, pointerEvents: "none", zIndex: 0 }} />
      )}

      {/* Header + Nav — flottant (carte détachée) ou pleine largeur selon le thème */}
      {PALETTE.headerFloat ? (
        <div style={{ position: "sticky", top: 0, zIndex: 50, padding: "8px 10px 0" }}>
          <div style={{
            maxWidth: 860, margin: "0 auto",
            background: PALETTE.headerBg, border: PALETTE.headerBorder,
            borderRadius: PALETTE.radiusCardLg, boxShadow: PALETTE.headerShadow,
            backdropFilter: `blur(${PALETTE.headerBlur}px)`, WebkitBackdropFilter: `blur(${PALETTE.headerBlur}px)`,
          }}>
            {headerInner}
          </div>
        </div>
      ) : (
        <div style={{
          position: "sticky", top: 0, zIndex: 50, background: PALETTE.headerBg,
          backdropFilter: `blur(${PALETTE.headerBlur}px)`, WebkitBackdropFilter: `blur(${PALETTE.headerBlur}px)`,
          borderBottom: PALETTE.headerBorder, boxShadow: PALETTE.headerShadow,
        }}>
          {headerInner}
        </div>
      )}

      <div className="clairiere-main">
        {/* Rien n'est enregistré tant que ce bandeau est là : le dire est plus
            utile qu'un enregistrement silencieux qui détruirait les données. */}
        {loadFailed && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "11px 13px",
            background: `${PALETTE.danger}12`, border: `1.5px solid ${PALETTE.danger}44`,
            borderRadius: PALETTE.radiusCard,
          }}>
            <AlertTriangle size={17} color={PALETTE.danger} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PALETTE.ink }}>Données non chargées</div>
              <div style={{ fontSize: 11.5, color: PALETTE.inkSoft, marginTop: 2 }}>
                Le serveur n'a pas répondu. Rien n'est enregistré pour ne rien écraser — recharge la page.
              </div>
            </div>
            <PillButton variant="danger" icon={RotateCcw} onClick={() => window.location.reload()}>Recharger</PillButton>
          </div>
        )}

        {insecure && !insecureHidden && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "11px 13px",
            background: `${PALETTE.amber}14`, border: `1.5px solid ${PALETTE.amber}55`,
            borderRadius: PALETTE.radiusCard,
          }}>
            <Mic size={17} color={PALETTE.amber} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PALETTE.ink }}>Dictée indisponible en http</div>
              <div style={{ fontSize: 11.5, color: PALETTE.inkSoft, marginTop: 2 }}>
                Le navigateur n'ouvre le micro qu'en https. Tout le reste fonctionne.
              </div>
            </div>
            <PillButton variant="amber" icon={Mic} onClick={() => { window.location.href = httpsTarget(); }}>
              Passer en HTTPS
            </PillButton>
            <IconButton icon={X} variant="subtle" size={28} iconSize={14} onClick={() => setInsecureHidden(true)} title="Masquer" />
          </div>
        )}

        {confirmingReset && view === "tasks" && (
          <ConfirmBar
            label="Effacer toutes les missions et dossiers ? Irréversible."
            confirmLabel="Tout effacer"
            onConfirm={confirmReset}
            onCancel={() => setConfirmingReset(false)}
          />
        )}
        {confirmingClearDone && view === "tasks" && (
          <ConfirmBar
            label="Effacer toutes les tâches complétées ? Irréversible."
            confirmLabel="Effacer"
            onConfirm={confirmClearDone}
            onCancel={() => setConfirmingClearDone(false)}
          />
        )}

        {view === "tasks" && (
          <TasksView state={state} weekly={weekly} daily={daily} onToggleSimple={toggleSimpleTask} onDeleteSimple={deleteSimpleTask}
            onReorderTasks={reorderTasks} onResetOrder={resetTasksOrder} onRequestReset={() => setConfirmingReset(true)}
            onRequestClearDone={() => setConfirmingClearDone(true)}
            onToggleWeeklyTask={toggleWeeklyTask} onToggleDailyTask={toggleDailyTask}
            onAddTask={addMissionTask} onAddSubtask={addMissionSubtask}
            onToggleSubtask={toggleMissionSubtask} onDeleteSubtask={deleteMissionSubtask}
            taskVoice={taskVoice} subVoice={subVoice}
            onChangeCategorie={changeMissionCategorie} onChangeEta={changeMissionEta} onChangeSubEta={changeMissionSubEta}
            onChangeTitle={changeMissionTitle} onChangeSubTitle={changeMissionSubTitle} />
        )}
        {view === "dossiers" && (
          <DossiersView dossiers={state.dossiers} onReorderDossiers={reorderDossiers} onOpenDossier={openDossier}
            onDeleteDossier={deleteDossier} onResetOrder={resetDossiersOrder} />
        )}
        {view === "dossier" && state.dossiers.find((d) => d.id === activeDossierId) && (
          <DossierDetailView dossier={state.dossiers.find((d) => d.id === activeDossierId)} onBack={backToMain}
            onToggleTask={toggleDossierTask} onDeleteTask={deleteDossierTask} onAddTask={addTaskToDossier}
            onAddSubtask={addSubtask} onToggleSubtask={toggleSubtask} onDeleteSubtask={deleteSubtask}
            onReorderTasks={reorderDossierTasks}
            onChangeTitle={changeDossierTaskTitle} onChangeSubTitle={changeDossierSubtaskTitle} />
        )}
        {view === "dashboard" && <DashboardView state={state} weekly={weekly} daily={daily} monthly={monthly} emailItems={emailItems} />}
        {view === "daily" && <DailyView daily={daily} onToggleTask={toggleDailyTask} />}
        {view === "week" && <WeekView weekly={weekly} onToggleTask={toggleWeeklyTask} />}
        {view === "monthly" && <MonthlyView monthly={monthly} onToggleTask={toggleMonthlyTask} />}
        {view === "email" && <EmailView items={emailItems} scanning={emailScanning} lastScan={emailLastScan} onScan={handleScanEmails} onDismiss={dismissEmail} />}
        {DOMAINES[view] && (
          <DomainView key={view} domainId={view} univers={domaines[view]} onDeleteObjectif={deleteObjectif} />
        )}
        {view.startsWith("cat-") && CATEGORY_META[view.slice(4)] && (
          <CategoryView key={view} name={view.slice(4)} tasks={state.tasks}
            onToggle={toggleSimpleTask} onDelete={deleteSimpleTask} onAddTask={addMissionTask}
            onChangeCategorie={changeMissionCategorie} onChangeEta={changeMissionEta}
            onAddSubtask={addMissionSubtask} onToggleSubtask={toggleMissionSubtask}
            onDeleteSubtask={deleteMissionSubtask} onChangeSubEta={changeMissionSubEta}
            onChangeTitle={changeMissionTitle} onChangeSubTitle={changeMissionSubTitle} />
        )}
      </div>

      {/* Barre assistant flottante */}
      <div style={{
        position: "fixed", bottom: 12, left: 12, right: 12, maxWidth: 730, margin: "0 auto",
        background: PALETTE.cardBlur ? PALETTE.cardBg : PALETTE.panel,
        backdropFilter: PALETTE.cardBlur ? `blur(${PALETTE.cardBlur}px)` : undefined,
        WebkitBackdropFilter: PALETTE.cardBlur ? `blur(${PALETTE.cardBlur}px)` : undefined,
        border: cardBorder(), borderRadius: PALETTE.radiusPill === "999px" ? 999 : PALETTE.radiusCardLg,
        padding: "6px 6px 6px 8px", display: "flex", gap: 6, alignItems: "center", zIndex: 100,
        boxShadow: PALETTE.hoverShadow,
      }}>
        <button className="cl-press" onClick={() => setChatOpen((o) => !o)} title="Assistant" style={{
          width: 36, height: 36, borderRadius: PALETTE.radiusPill === "999px" ? "50%" : PALETTE.radiusChip,
          background: PALETTE.canvasDeep, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <StatusDot status={assistantStatus} />
        </button>
        <input
          value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ajoute une mission ou un dossier..."
          style={{ flex: 1, border: "none", background: "transparent", fontSize: 14, fontFamily: PALETTE.fontBody, color: PALETTE.ink, minWidth: 0 }}
        />
        <IconButton icon={Mic} variant={isRecording ? "amber" : "ghost"} size={36} iconSize={15} onClick={toggleRecording} title="Micro" />
        <IconButton icon={Send} variant="primary" size={36} iconSize={15} onClick={send} disabled={sending || !input.trim()} title="Envoyer" style={{ opacity: sending || !input.trim() ? 0.4 : 1 }} />
        {micError && (
          <div style={{ position: "absolute", bottom: "100%", right: 10, marginBottom: 8, background: PALETTE.ink, color: PALETTE.canvas, fontSize: 11, padding: "6px 10px", borderRadius: 8, maxWidth: 180, textAlign: "center" }}>
            Micro via clavier (Gboard)
          </div>
        )}
      </div>

      {(voiceArmed || voice.recording) && <RecordingOverlay live={voice.recording} />}
      {!voiceArmed && !voice.recording && <Toast message={toast} />}

      {/* Chat overlay */}
      {chatOpen && (
        <div className="cl-rise" style={{
          position: "fixed", top: 70, right: 12, width: "min(320px, 88vw)", maxHeight: "58vh",
          background: PALETTE.panel, border: cardBorder(), borderRadius: PALETTE.radiusCardLg,
          boxShadow: "0 22px 50px rgba(0,0,0,0.20)", zIndex: 200, display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ padding: "10px 10px 10px 14px", borderBottom: `1px solid ${PALETTE.lineSoft}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: PALETTE.canvasDeep }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: PALETTE.ink, display: "flex", alignItems: "center", gap: 6 }}>
              <StatusDot status={assistantStatus} /> Assistant
            </span>
            <IconButton icon={X} variant="subtle" size={30} iconSize={14} onClick={() => setChatOpen(false)} title="Fermer" />
          </div>
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 7 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%",
                background: m.role === "user" ? accentFill() : PALETTE.canvasDeep,
                color: m.role === "user" ? PALETTE.onAccent : PALETTE.ink,
                borderRadius: PALETTE.radiusPill === "999px"
                  ? (m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px")
                  : PALETTE.radiusChip,
                padding: "9px 12px", fontSize: 12.5, lineHeight: 1.45,
              }}>
                {m.content}
              </div>
            ))}
            {sending && <div style={{ alignSelf: "flex-start", color: PALETTE.inkFaint, fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}><Loader2 size={11} className="animate-spin" /> réflexion...</div>}
          </div>
        </div>
      )}
    </div>
  );
}
