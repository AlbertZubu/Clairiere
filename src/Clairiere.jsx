import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, ChevronDown, ChevronRight, ChevronLeft, Trash2, Circle,
  CheckCircle2, Loader2, GripVertical, Mic, ListChecks, CalendarDays,
  BarChart3, Zap, Languages, Music, Dumbbell, Mail, RotateCcw, X,
  TrendingUp, BookOpen, Brain, Heart, Gamepad2, Trophy, Phone, Plus, Waves,
  AlertTriangle, Check, Sparkles, Trees, Folder, CircleDot, CalendarRange, Wallet,
} from "lucide-react";

// ============================================================
// DESIGN SYSTEM — 8 univers visuels
// ------------------------------------------------------------
// Chaque thème pilote non seulement les couleurs, mais aussi :
// le fond de page (dégradés), la forme et l'ombre des cartes, la
// nav, l'échelle typographique, le style des titres et labels.
// Deux thèmes ne doivent JAMAIS se ressembler : c'est le but.
// Tous les fonds sont clairs (préférence assumée).
// ============================================================

// Valeurs par défaut : tout thème hérite de ça, puis surcharge.
// (Sans base, un token oublié dans un thème garderait la valeur du thème précédent.)
const BASE_TOKENS = {
  // — surfaces
  canvas: "#FFFFFF", canvasDeep: "#F2F2F2", panel: "#FFFFFF",
  appBg: "#FFFFFF",              // fond de page complet (dégradés autorisés)
  appOverlay: null,              // calque décoratif fixe au-dessus du fond
  headerBg: "rgba(255,255,255,0.85)",
  headerBlur: 10,
  headerBorder: "1px solid rgba(0,0,0,0.07)",
  headerShadow: "none",
  // — encre
  ink: "#111111", inkSoft: "#4A4A4A", inkFaint: "#7A7A7A",
  line: "#E2E2E2", lineSoft: "#EFEFEF",
  lineStrong: null,              // bordure des cases/chips inactifs (null → line)
  // — accents (noms sémantiques hérités, valeurs propres à chaque thème)
  forest: "#111111", forestSoft: "#3A3A3A",
  amber: "#C68A3D", amberSoft: "#E0B679",
  clay: "#B5674A", sky: "#4E7789", sage: "#7C9473", berry: "#93516A",
  danger: "#C0392B", success: "#3F7A45",
  onAccent: "#FFFFFF",           // texte posé sur la couleur primaire
  accentGrad: null,              // dégradé optionnel des boutons primaires
  glowAccent: "0 6px 16px rgba(0,0,0,0.10)",
  // — typo
  fontDisplay: "'Public Sans', sans-serif", fontBody: "'Public Sans', sans-serif",
  h1Size: 26, h1Weight: 700, h1Case: "none", h1Tracking: -0.2, h1Style: "normal",
  subSize: 12.5, subWeight: 500, subCase: "none", subTracking: 0,
  labelCase: "uppercase", labelWeight: 700, labelTracking: 1,
  sectionRule: "dash",           // dash | block | plain | rule | dot
  bodyWeight: 600,
  // — formes
  radiusCard: "14px", radiusCardLg: "16px", radiusChip: "12px", radiusPill: "999px",
  cardBg: null,                  // null → panel
  cardBorderWidth: 1.5,
  cardBorderColor: null,         // null → line
  cardShadow: "0 1px 3px rgba(0,0,0,0.05)",
  cardBlur: 0,
  hoverLift: "translateY(-2px)",
  hoverShadow: "0 8px 22px rgba(0,0,0,0.10)",
  // — éléments tâches
  chipRadius: "12px", chipSize: 34, chipBorderWidth: 1.5,
  chipShadow: "0 2px 6px rgba(0,0,0,0.06)",
  missionRadius: "12px",
  checkboxShape: "circle",       // circle | square
  // — navigation
  navRadius: "999px", navActiveBg: null, navActiveColor: null,
  navIdleColor: null, navActiveShadow: "none", navUnderline: false,
  navPad: "7px 12px", navWeight: 600, navCase: "none", navTracking: 0,
  // — divers
  ringThickness: null,
  tagline: "",
};

const THEMES = {
  // 1 — CLAIRIÈRE : papier chaud, encre forêt, formes organiques faites main
  clairiere: {
    label: "Clairière", swatch: "#2C4A32", swatch2: "#C68A3D",
    tagline: "Une trouée de lumière dans la forêt.",
    canvas: "#F7F3E9", canvasDeep: "#EDE5D0", panel: "#FFFDF7",
    appBg:
      "radial-gradient(1100px 620px at 8% -12%, #FFFEF6 0%, rgba(255,254,246,0) 62%)," +
      "radial-gradient(900px 520px at 102% 2%, #E8F0E0 0%, rgba(232,240,224,0) 58%)," +
      "radial-gradient(700px 700px at 50% 115%, #F2EAD6 0%, rgba(242,234,214,0) 60%)," +
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
    h1Size: 27, h1Weight: 600, h1Tracking: -0.2,
    labelCase: "uppercase", labelWeight: 700, labelTracking: 1.1, sectionRule: "dash",
    radiusCard: "18px 7px 18px 7px", radiusCardLg: "22px 9px 22px 9px", radiusChip: "14px 6px 14px 6px",
    cardBorderWidth: 1.5, cardShadow: "0 2px 10px rgba(46,60,40,0.05)",
    hoverShadow: "0 10px 26px rgba(46,60,40,0.12)",
    chipRadius: "14px 6px 14px 6px", chipSize: 34, chipBorderWidth: 1.5,
    chipShadow: "0 2px 6px rgba(31,42,30,0.08)", missionRadius: "13px 5px 13px 5px",
    checkboxShape: "circle",
  },

  // 2 — ÉLAN : brutalisme sportif, noir/rouge, angles nets, ombres dures
  elan: {
    label: "Élan", swatch: "#111111", swatch2: "#E4002B",
    tagline: "PAS DE JOUR SANS.",
    canvas: "#FFFFFF", canvasDeep: "#F1F1F1", panel: "#FFFFFF",
    appBg:
      "linear-gradient(180deg,#FFFFFF 0%,#FFFFFF 55%,#F4F4F4 100%)",
    appOverlay:
      "repeating-linear-gradient(135deg, rgba(17,17,17,0.022) 0 1px, rgba(0,0,0,0) 1px 14px)",
    headerBg: "rgba(255,255,255,0.94)", headerBorder: "2px solid #111111",
    ink: "#0B0B0B", inkSoft: "#404040", inkFaint: "#767676",
    line: "#111111", lineSoft: "#DCDCDC",
    forest: "#111111", forestSoft: "#3A3A3A",
    amber: "#E4002B", amberSoft: "#FF4E63",
    clay: "#E4002B", sky: "#0B0B0B", sage: "#00713F", berry: "#E4002B",
    danger: "#E4002B", success: "#00713F",
    glowAccent: "4px 4px 0 #111111",
    fontDisplay: "'Archivo', 'Helvetica Neue', Arial, sans-serif",
    fontBody: "'Archivo', 'Helvetica Neue', Arial, sans-serif",
    h1Size: 32, h1Weight: 800, h1Case: "uppercase", h1Tracking: -0.8, h1Style: "italic",
    subCase: "uppercase", subWeight: 700, subTracking: 1.2, subSize: 11,
    labelCase: "uppercase", labelWeight: 800, labelTracking: 1.6, sectionRule: "block",
    bodyWeight: 700,
    radiusCard: "0px", radiusCardLg: "0px", radiusChip: "0px", radiusPill: "0px",
    cardBorderWidth: 2, cardBorderColor: "#111111", cardShadow: "4px 4px 0 rgba(17,17,17,0.10)",
    hoverLift: "translate(-2px,-2px)", hoverShadow: "6px 6px 0 rgba(17,17,17,0.90)",
    chipRadius: "0px", chipSize: 34, chipBorderWidth: 2,
    chipShadow: "3px 3px 0 rgba(17,17,17,0.14)", missionRadius: "0px",
    checkboxShape: "square",
    navRadius: "0px", navCase: "uppercase", navWeight: 800, navTracking: 1.1, navPad: "8px 13px",
    ringThickness: 5,
  },

  // 3 — STUDIO : minimalisme absolu, aucune bordure, ombres douces, énormes rayons
  studio: {
    label: "Studio", swatch: "#0071E3", swatch2: "#F5F5F7",
    tagline: "L'essentiel, rien d'autre.",
    canvas: "#F5F5F7", canvasDeep: "#EBEBEF", panel: "#FFFFFF",
    appBg: "linear-gradient(180deg,#F7F7F9 0%,#F1F1F4 100%)",
    headerBg: "rgba(247,247,249,0.78)", headerBlur: 20, headerBorder: "1px solid rgba(0,0,0,0.05)",
    ink: "#1D1D1F", inkSoft: "#6E6E73", inkFaint: "#8E8E93",
    line: "#E5E5EA", lineSoft: "#F0F0F3",
    forest: "#0071E3", forestSoft: "#0A84FF",
    amber: "#FF9F0A", amberSoft: "#FFC062",
    clay: "#FF6B35", sky: "#0071E3", sage: "#30D158", berry: "#FF375F",
    danger: "#FF3B30", success: "#30D158",
    glowAccent: "0 8px 20px rgba(0,113,227,0.28)",
    fontDisplay: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif",
    fontBody: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif",
    h1Size: 33, h1Weight: 700, h1Tracking: -0.9,
    subSize: 13.5, subWeight: 400,
    labelCase: "none", labelWeight: 600, labelTracking: 0, sectionRule: "plain",
    radiusCard: "18px", radiusCardLg: "22px", radiusChip: "16px",
    cardBorderWidth: 0, cardShadow: "0 1px 2px rgba(0,0,0,0.04), 0 10px 26px rgba(0,0,0,0.045)",
    hoverLift: "translateY(-3px)", hoverShadow: "0 2px 4px rgba(0,0,0,0.05), 0 18px 40px rgba(0,0,0,0.09)",
    chipRadius: "14px", chipSize: 38, chipBorderWidth: 0,
    chipShadow: "0 1px 3px rgba(0,0,0,0.06), 0 6px 16px rgba(0,0,0,0.05)", missionRadius: "16px",
    checkboxShape: "circle",
    navRadius: "999px", navActiveShadow: "0 2px 8px rgba(0,113,227,0.30)",
    ringThickness: 3,
  },

  // 4 — CLAUDE : chaleureux, terracotta, serif Lora, formes pilules
  claude: {
    label: "Claude", swatch: "#CC785C", swatch2: "#F0ECE1",
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
    h1Size: 28, h1Weight: 600, h1Tracking: -0.3,
    subSize: 13, subWeight: 400,
    labelCase: "uppercase", labelWeight: 600, labelTracking: 0.9, sectionRule: "dot",
    radiusCard: "14px", radiusCardLg: "18px", radiusChip: "999px",
    cardBorderWidth: 1, cardShadow: "0 2px 8px rgba(80,60,45,0.05)",
    hoverShadow: "0 10px 28px rgba(120,80,60,0.14)",
    chipRadius: "999px", chipSize: 36, chipBorderWidth: 1.5,
    chipShadow: "0 3px 10px rgba(204,120,92,0.14)", missionRadius: "20px",
    checkboxShape: "circle",
  },

  // 5 — AURORE : verre dépoli, dégradés pastel, halos colorés
  aurore: {
    label: "Aurore", swatch: "#7B6CF6", swatch2: "#F79BC4",
    tagline: "Une belle journée à faire éclore.",
    canvas: "#FBFAFF", canvasDeep: "#F0EDFB", panel: "rgba(255,255,255,0.72)",
    appBg:
      "radial-gradient(760px 620px at 4% -8%, #FFE1D2 0%, rgba(255,225,210,0) 62%)," +
      "radial-gradient(720px 560px at 98% 4%, #E2DBFF 0%, rgba(226,219,255,0) 60%)," +
      "radial-gradient(820px 640px at 46% 108%, #D6F3E8 0%, rgba(214,243,232,0) 62%)," +
      "radial-gradient(600px 500px at 88% 82%, #FFE7F2 0%, rgba(255,231,242,0) 60%)," +
      "#FBFAFF",
    headerBg: "rgba(251,250,255,0.62)", headerBlur: 18, headerBorder: "1px solid rgba(255,255,255,0.85)",
    headerShadow: "0 6px 24px rgba(110,95,180,0.07)",
    ink: "#241F45", inkSoft: "#5D5680", inkFaint: "#8A83A8",
    line: "rgba(255,255,255,0.9)", lineSoft: "rgba(210,205,240,0.55)",
    lineStrong: "rgba(140,128,196,0.42)",
    forest: "#7B6CF6", forestSoft: "#9A8DFF",
    amber: "#F5A65B", amberSoft: "#FFCB9A",
    clay: "#F2836E", sky: "#57BDEA", sage: "#4CC4A0", berry: "#EB7BB5",
    danger: "#E8607D", success: "#4CC4A0",
    accentGrad: "linear-gradient(135deg,#7B6CF6 0%,#B57BF0 55%,#F79BC4 100%)",
    glowAccent: "0 10px 26px rgba(123,108,246,0.34)",
    fontDisplay: "'Outfit', sans-serif", fontBody: "'Outfit', sans-serif",
    h1Size: 31, h1Weight: 600, h1Tracking: -0.6,
    subSize: 13, subWeight: 400,
    labelCase: "uppercase", labelWeight: 600, labelTracking: 1.4, sectionRule: "dot",
    radiusCard: "22px", radiusCardLg: "26px", radiusChip: "18px",
    cardBg: "rgba(255,255,255,0.68)", cardBorderWidth: 1, cardBorderColor: "rgba(255,255,255,0.95)",
    cardShadow: "0 8px 30px rgba(96,84,168,0.10)", cardBlur: 16,
    hoverLift: "translateY(-3px)", hoverShadow: "0 16px 42px rgba(96,84,168,0.18)",
    chipRadius: "16px", chipSize: 37, chipBorderWidth: 1,
    chipShadow: "0 5px 16px rgba(96,84,168,0.12)", missionRadius: "18px",
    checkboxShape: "circle",
    navRadius: "999px", navActiveShadow: "0 6px 18px rgba(123,108,246,0.35)",
    ringThickness: 4,
  },

  // 6 — ENCRE : mise en page éditoriale, serif à grande échelle, filets fins
  encre: {
    label: "Encre", swatch: "#16150F", swatch2: "#A8322A",
    tagline: "Écris ta journée comme une une.",
    canvas: "#FCFBF6", canvasDeep: "#F3F1E8", panel: "#FFFFFE",
    appBg:
      "linear-gradient(180deg,#FDFCF8 0%,#F8F6EE 100%)",
    appOverlay:
      "repeating-linear-gradient(0deg, rgba(22,21,15,0.013) 0 1px, rgba(0,0,0,0) 1px 38px)",
    headerBg: "rgba(252,251,246,0.93)", headerBorder: "1px solid #16150F", headerBlur: 6,
    ink: "#16150F", inkSoft: "#4A4738", inkFaint: "#84806E",
    line: "#DAD5C4", lineSoft: "#EAE6D9",
    forest: "#16150F", forestSoft: "#3B382C",
    amber: "#A8322A", amberSoft: "#D0665C",
    clay: "#8A6A3B", sky: "#3E5A6B", sage: "#5C6B4A", berry: "#7A3B52",
    danger: "#A8322A", success: "#4A6B42",
    glowAccent: "0 4px 12px rgba(22,21,15,0.20)",
    fontDisplay: "'Instrument Serif', 'Playfair Display', Georgia, serif",
    fontBody: "'Public Sans', Georgia, serif",
    h1Size: 40, h1Weight: 400, h1Tracking: -0.8,
    subSize: 12, subWeight: 400, subCase: "uppercase", subTracking: 1.6,
    labelCase: "uppercase", labelWeight: 700, labelTracking: 2, sectionRule: "rule",
    bodyWeight: 500,
    radiusCard: "2px", radiusCardLg: "2px", radiusChip: "2px", radiusPill: "2px",
    cardBorderWidth: 1, cardBorderColor: "#D6D0BC", cardShadow: "none",
    hoverLift: "none", hoverShadow: "0 6px 18px rgba(22,21,15,0.10)",
    chipRadius: "2px", chipSize: 34, chipBorderWidth: 1,
    chipShadow: "none", missionRadius: "2px",
    checkboxShape: "square",
    navRadius: "2px", navUnderline: true, navCase: "uppercase", navWeight: 700,
    navTracking: 1.2, navPad: "7px 10px",
    ringThickness: 2,
  },

  // 7 — POP : couleurs électriques sur blanc, cartes épaisses, ombres portées colorées
  pop: {
    label: "Pop", swatch: "#6E3AFF", swatch2: "#FF4D8D",
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
    h1Size: 31, h1Weight: 700, h1Tracking: -1,
    subSize: 12.5, subWeight: 500,
    labelCase: "uppercase", labelWeight: 700, labelTracking: 1.3, sectionRule: "block",
    bodyWeight: 600,
    radiusCard: "20px", radiusCardLg: "24px", radiusChip: "16px",
    cardBorderWidth: 2, cardBorderColor: "#E4DEFF",
    cardShadow: "0 4px 0 rgba(110,58,255,0.13)",
    hoverLift: "translateY(-3px)", hoverShadow: "0 8px 0 rgba(110,58,255,0.22)",
    chipRadius: "15px", chipSize: 38, chipBorderWidth: 2,
    chipShadow: "0 3px 0 rgba(110,58,255,0.14)", missionRadius: "16px",
    checkboxShape: "circle",
    navRadius: "14px", navActiveShadow: "0 3px 0 rgba(78,32,190,0.40)", navWeight: 700,
    ringThickness: 5,
  },

  // 8 — SUMI : japandi, papier de riz, trait fin, un seul rouge vermillon
  sumi: {
    label: "Sumi", swatch: "#26241E", swatch2: "#C4552F",
    tagline: "Un geste après l'autre.",
    canvas: "#F4F1E9", canvasDeep: "#EAE5D8", panel: "#FBF9F3",
    appBg:
      "radial-gradient(1000px 700px at 82% -10%, #FBF9F2 0%, rgba(251,249,242,0) 58%)," +
      "#F4F1E9",
    appOverlay:
      "repeating-linear-gradient(45deg, rgba(38,36,30,0.012) 0 1px, rgba(0,0,0,0) 1px 7px)",
    headerBg: "rgba(244,241,233,0.9)", headerBorder: "1px solid #DFD9C9",
    ink: "#26241E", inkSoft: "#5C584C", inkFaint: "#918B7B",
    line: "#DCD6C6", lineSoft: "#E9E4D7",
    forest: "#26241E", forestSoft: "#4A463C",
    amber: "#C4552F", amberSoft: "#DE8A6C",
    clay: "#9A6B3F", sky: "#4A6272", sage: "#77836A", berry: "#8C5A66",
    danger: "#B03A28", success: "#5E7A55",
    glowAccent: "0 6px 16px rgba(38,36,30,0.16)",
    fontDisplay: "'Cormorant Garamond', Georgia, serif", fontBody: "'Public Sans', sans-serif",
    h1Size: 36, h1Weight: 500, h1Tracking: 0.5,
    subSize: 12, subWeight: 400, subTracking: 0.6,
    labelCase: "uppercase", labelWeight: 500, labelTracking: 2.6, sectionRule: "plain",
    bodyWeight: 500,
    radiusCard: "3px", radiusCardLg: "3px", radiusChip: "3px", radiusPill: "3px",
    cardBorderWidth: 1, cardBorderColor: "#DFD9C9", cardShadow: "none",
    hoverLift: "none", hoverShadow: "0 3px 14px rgba(38,36,30,0.09)",
    chipRadius: "3px", chipSize: 36, chipBorderWidth: 1,
    chipShadow: "none", missionRadius: "3px",
    checkboxShape: "square",
    navRadius: "3px", navPad: "7px 11px", navWeight: 600, navTracking: 0.6,
    ringThickness: 2,
  },
};

// Anciens identifiants de thème encore stockés côté serveur → nouveaux équivalents
const LEGACY_THEME_IDS = { nike: "elan", apple: "studio" };

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

// Fond des boutons/éléments primaires : dégradé si le thème en définit un.
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

function subtitleStyle(extra = {}) {
  return {
    fontSize: PALETTE.subSize, fontWeight: PALETTE.subWeight, textTransform: PALETTE.subCase,
    letterSpacing: PALETTE.subTracking, color: PALETTE.inkFaint, margin: "5px 0 0", ...extra,
  };
}

// En-tête de page commun — la personnalité du thème s'exprime ici.
function PageHeader({ title, subtitle, icon: Icon, color, action }) {
  const accent = color || PALETTE.forest;
  return (
    <div className="cl-rise" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
        {PALETTE.sectionRule === "plain" && !Icon && (
          <span style={{ width: 3, height: PALETTE.h1Size * 1.05, background: accent, flexShrink: 0, borderRadius: 2 }} />
        )}
        {Icon && <IconBadge icon={Icon} color={accent} size={42} />}
        <div style={{ minWidth: 0 }}>
          <h1 style={titleStyle()}>{title}</h1>
          {subtitle && <p style={subtitleStyle()}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
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
      "&family=Lora:wght@400;500;600;700" +
      "&family=Inter:wght@400;500;600;700" +
      "&family=Outfit:wght@300;400;500;600;700" +
      "&family=Space+Grotesk:wght@400;500;600;700" +
      "&family=Instrument+Serif:ital@0;1" +
      "&family=Cormorant+Garamond:wght@300;400;500;600;700" +
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
async function callClaude(messages, userInput) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, userInput }),
    });
    const data = await response.json();
    return { reply: data.reply || "Action effectuée.", status: data.status || "ok", actions: data.actions || [] };
  } catch (e) {
    console.error("chat call failed", e);
    return { reply: "Erreur de connexion.", status: "error", actions: [] };
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
  theme: "clairiere:theme", monthly: "clairiere:monthly",
};

async function storageGet(key) {
  try {
    const res = await fetch(`/api/storage/${encodeURIComponent(key)}`);
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = await res.json();
    return data ? JSON.parse(data.value) : null;
  } catch {
    return null;
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
const ICON_MAP = {
  Music, Brain, BookOpen, Dumbbell, Heart, Gamepad2, Languages, Phone,
  Zap, Shirt: ListChecks, Waves, Bike: Dumbbell, Mountain: Dumbbell,
  ChefHat: Trophy, Trophy, TrendingUp, Plus, Footprints: Dumbbell, Sparkles,
  BedDouble: ListChecks,
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
        fontFamily: PALETTE.fontBody, whiteSpace: "nowrap",
        transition: "all 0.18s cubic-bezier(.34,1.4,.64,1)", ...style,
      }}
    >
      {Icon && <Icon size={13} />}
      {children}
    </button>
  );
}

// Bouton icône — la rondeur suit le thème (cercle partout sauf thèmes anguleux)
function IconButton({ icon: Icon, onClick, variant = "ghost", size = 34, iconSize = 15, title, color, style, disabled }) {
  const variants = {
    ghost: { background: PALETTE.canvasDeep, color: PALETTE.inkSoft },
    primary: { background: accentFill(), color: PALETTE.onAccent, boxShadow: PALETTE.glowAccent },
    amber: { background: PALETTE.amber, color: PALETTE.onAccent },
    subtle: { background: "transparent", color: PALETTE.inkFaint },
  };
  const angular = PALETTE.radiusPill !== "999px";
  const iconColor = color || variants[variant].color;
  return (
    <button
      className="cl-press"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        ...variants[variant], width: size, height: size,
        borderRadius: angular ? PALETTE.radiusChip : "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "all 0.18s cubic-bezier(.34,1.4,.64,1)", ...style,
      }}
    >
      <Icon size={iconSize} color={iconColor} />
    </button>
  );
}

// Label de section — 5 traitements possibles selon le thème
function SectionLabel({ children, color }) {
  const kind = PALETTE.sectionRule;
  const base = {
    fontSize: 11, fontWeight: PALETTE.labelWeight, letterSpacing: PALETTE.labelTracking,
    textTransform: PALETTE.labelCase, marginBottom: 11,
  };
  const accent = color || PALETTE.forest;

  if (kind === "block") {
    return (
      <div style={{ marginBottom: 11 }}>
        <span style={{
          ...base, marginBottom: 0, display: "inline-block", background: accent, color: PALETTE.onAccent,
          padding: "4px 10px", borderRadius: PALETTE.radiusPill === "999px" ? 999 : PALETTE.radiusChip,
        }}>{children}</span>
      </div>
    );
  }
  if (kind === "rule") {
    return (
      <div style={{ ...base, color: PALETTE.ink, display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${PALETTE.ink}`, paddingBottom: 5 }}>
        {children}
      </div>
    );
  }
  if (kind === "dot") {
    return (
      <div style={{ ...base, color: PALETTE.inkSoft, display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, display: "inline-block" }} />
        {children}
      </div>
    );
  }
  if (kind === "plain") {
    return <div style={{ ...base, color: PALETTE.inkSoft, fontSize: 12.5 }}>{children}</div>;
  }
  return (
    <div style={{ ...base, color: PALETTE.inkFaint, display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 14, height: 1.5, background: PALETTE.line, display: "inline-block" }} />
      {children}
    </div>
  );
}

// ---------- Bandeau d'accueil — la signature visuelle la plus forte de chaque thème ----------
const HERO = {
  clairiere: { kind: "soft", title: "La clairière du jour", sub: "Ce qui pousse, ce qui attend, ce qui est fait." },
  elan: { kind: "slab", title: "Aujourd'hui", sub: "Pas de jour sans." },
  studio: { kind: "plain", title: "Aujourd'hui", sub: "Une chose à la fois." },
  claude: { kind: "soft", title: "Aujourd'hui", sub: "Prends ton temps, avance quand même." },
  aurore: { kind: "gradient", title: "Ta journée", sub: "Il n'y a qu'à commencer." },
  encre: { kind: "ruled", title: "Le journal du jour", sub: "Édition personnelle" },
  pop: { kind: "pop", title: "On y va !", sub: "Trois clics et c'est lancé." },
  sumi: { kind: "zen", title: "Aujourd'hui", sub: "Un geste après l'autre." },
};

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

// Phrase d'encouragement — dépend uniquement de l'avancement, jamais culpabilisante
function pepTalk(pct, total) {
  if (!total) return "Rien de prévu : le terrain est libre.";
  if (pct === 100) return "Tout est fait. Journée pleine.";
  if (pct >= 75) return "Dernière ligne droite.";
  if (pct >= 40) return "Bien lancé, ça avance.";
  if (pct > 0) return "Le plus dur est derrière : c'est commencé.";
  return "Une seule case à cocher pour démarrer.";
}

function HeroBanner({ viewKey, done, total }) {
  const h = HERO[viewKey] || HERO.clairiere;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const pep = pepTalk(pct, total);

  const Ring = (
    <div style={{ position: "relative", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <ProgressRing pct={pct} color={h.kind === "slab" ? PALETTE.amber : PALETTE.forest} size={58} />
      <span style={{
        position: "absolute", fontSize: 13, fontWeight: 700, fontFamily: PALETTE.fontBody,
        color: h.kind === "slab" ? "#FFFFFF" : PALETTE.ink,
      }}>{pct}%</span>
    </div>
  );

  // — bandeau plein, noir, angles vifs
  if (h.kind === "slab") {
    return (
      <div className="cl-rise" style={{
        background: PALETTE.ink, margin: "-14px -14px 20px", padding: "24px 18px 22px",
        display: "flex", alignItems: "center", gap: 16,
        borderBottom: `6px solid ${PALETTE.amber}`,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 2, color: PALETTE.amber, textTransform: "uppercase" }}>{todayLabel()}</div>
          <div style={{ ...titleStyle(), color: "#FFFFFF", marginTop: 6 }}>{h.title}</div>
          <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "#FFFFFF", opacity: 0.72, marginTop: 8 }}>{pep}</div>
        </div>
        {Ring}
      </div>
    );
  }

  // — carte en verre dégradé
  if (h.kind === "gradient") {
    return (
      <div className="cl-rise" style={{
        background: PALETTE.accentGrad, borderRadius: PALETTE.radiusCardLg,
        margin: "0 0 20px", padding: "22px 20px", color: "#FFFFFF",
        boxShadow: PALETTE.glowAccent, display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 500, letterSpacing: 1.2, textTransform: "uppercase", opacity: 0.85 }}>{greeting()} · {todayLabel()}</div>
          <div style={{ ...titleStyle(), color: "#FFFFFF", marginTop: 6 }}>{h.title}</div>
          <div style={{ fontSize: 13, marginTop: 7, opacity: 0.92 }}>{pep}</div>
        </div>
        <div style={{ position: "relative", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ProgressRing pct={pct} color="#FFFFFF" size={58} />
          <span style={{ position: "absolute", fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>{pct}%</span>
        </div>
      </div>
    );
  }

  // — bloc coloré épais, style sticker
  if (h.kind === "pop") {
    return (
      <div className="cl-rise" style={{
        background: PALETTE.canvasDeep, border: `2px solid ${PALETTE.forest}`,
        borderRadius: PALETTE.radiusCardLg, boxShadow: `0 6px 0 ${PALETTE.forest}`,
        margin: "0 0 22px", padding: "20px 18px", display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.3, textTransform: "uppercase", color: PALETTE.berry }}>{todayLabel()}</div>
          <div style={{ ...titleStyle(), marginTop: 5 }}>{h.title}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: PALETTE.inkSoft, marginTop: 6 }}>{pep}</div>
        </div>
        {Ring}
      </div>
    );
  }

  // — filets typographiques, mise en page de journal
  if (h.kind === "ruled") {
    return (
      <div className="cl-rise" style={{ margin: "0 0 22px", borderTop: `2px solid ${PALETTE.ink}`, borderBottom: `1px solid ${PALETTE.line}`, padding: "12px 0 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: PALETTE.inkFaint }}>
          <span>{h.sub}</span><span>{todayLabel()}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginTop: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={titleStyle()}>{h.title}</div>
            <div style={{ fontSize: 13, fontStyle: "italic", color: PALETTE.inkSoft, marginTop: 6 }}>{pep}</div>
          </div>
          {Ring}
        </div>
      </div>
    );
  }

  // — zen : beaucoup d'air, un trait vertical vermillon
  if (h.kind === "zen") {
    return (
      <div className="cl-rise" style={{ margin: "6px 0 30px", display: "flex", alignItems: "center", gap: 18 }}>
        <span style={{ width: 2, alignSelf: "stretch", background: PALETTE.amber, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, letterSpacing: 3, textTransform: "uppercase", color: PALETTE.inkFaint }}>{todayLabel()}</div>
          <div style={{ ...titleStyle(), marginTop: 8 }}>{h.title}</div>
          <div style={{ fontSize: 12.5, color: PALETTE.inkSoft, marginTop: 8, letterSpacing: 0.4 }}>{pep}</div>
        </div>
        {Ring}
      </div>
    );
  }

  // — plain : titre seul, aucune boîte (Studio)
  if (h.kind === "plain") {
    return (
      <div className="cl-rise" style={{ margin: "0 0 22px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: PALETTE.inkFaint }}>{greeting()}</div>
          <div style={{ ...titleStyle(), marginTop: 2 }}>{h.title}</div>
          <div style={{ fontSize: 13.5, color: PALETTE.inkSoft, marginTop: 6 }}>{pep}</div>
        </div>
        {Ring}
      </div>
    );
  }

  // — soft : carte douce teintée (Clairière, Claude)
  return (
    <div className="cl-rise" style={{
      background: `linear-gradient(135deg, ${PALETTE.forest}12 0%, ${PALETTE.amber}10 100%), ${PALETTE.panel}`,
      border: cardBorder(), borderRadius: PALETTE.radiusCardLg, boxShadow: PALETTE.cardShadow,
      margin: "0 0 20px", padding: "20px 18px", display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: PALETTE.labelWeight, letterSpacing: PALETTE.labelTracking, textTransform: "uppercase", color: PALETTE.inkFaint }}>
          {greeting()} · {todayLabel()}
        </div>
        <div style={{ ...titleStyle(), marginTop: 7 }}>{h.title}</div>
        <div style={{ fontSize: 13, color: PALETTE.inkSoft, marginTop: 7 }}>{pep}</div>
      </div>
      {Ring}
    </div>
  );
}

function EmptyState({ icon: Icon = Trees, title, subtitle }) {
  return (
    <div style={{ textAlign: "center", padding: "46px 20px", color: PALETTE.inkFaint }}>
      <span style={{
        width: 58, height: 58, display: "inline-flex", alignItems: "center", justifyContent: "center",
        borderRadius: PALETTE.radiusPill === "999px" ? "50%" : PALETTE.radiusChip,
        background: `${PALETTE.forest}0E`, marginBottom: 14,
      }}>
        <Icon size={26} color={PALETTE.forest} strokeWidth={1.8} />
      </span>
      <div style={{ fontFamily: PALETTE.fontDisplay, fontSize: 16, fontWeight: 600, color: PALETTE.ink }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12.5, marginTop: 6, color: PALETTE.inkFaint }}>{subtitle}</div>}
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


// ---------- Confirm inline ----------
function ConfirmBar({ label, confirmLabel = "Confirmer", onConfirm, onCancel }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, background: `${PALETTE.danger}10`,
      border: `1.5px solid ${PALETTE.danger}33`, borderRadius: PALETTE.radiusCard, padding: "10px 12px", marginBottom: 14,
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
// CARDS
// ============================================================
function Checkbox({ done, size = 18 }) {
  const isSquare = PALETTE.checkboxShape === "square";
  return (
    <span
      className={done ? "cl-checked" : undefined}
      style={{
        width: size, height: size, borderRadius: isSquare ? Math.max(2, size * 0.16) : "50%", flexShrink: 0,
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

// Badge icône coloré — sa forme suit le langage du thème (rond, carré, pilule)
function IconBadge({ icon: Icon, color, size = 36 }) {
  const angular = PALETTE.radiusPill !== "999px";
  return (
    <span style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: angular ? PALETTE.radiusChip : size * 0.34,
      background: `${color}1c`,
      border: PALETTE.cardBorderWidth >= 2 ? `2px solid ${color}` : "none",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={size * 0.5} color={color} strokeWidth={2.2} />
    </span>
  );
}

// Barre de progression fine sous un titre
function ProgressBar({ pct, color, height = 6 }) {
  const r = PALETTE.radiusPill === "999px" ? 99 : 2;
  return (
    <div style={{ height, background: PALETTE.canvasDeep, borderRadius: r, overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: r, transition: "width 0.5s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function SimpleTaskCard({ item, onToggle, onDelete, onDragStart }) {
  return (
    <div
      className="cl-card"
      style={cardStyle({
        padding: "12px 10px 12px 8px", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 10, minHeight: 54,
        opacity: item.done ? 0.72 : 1,
      })}
      onClick={() => onToggle(item.id)}
    >
      <DragHandle onPointerDown={onDragStart} />
      <Checkbox done={item.done} size={21} />
      <span style={{
        fontSize: 14.5, fontWeight: PALETTE.bodyWeight, color: item.done ? PALETTE.inkFaint : PALETTE.ink,
        textDecoration: item.done ? "line-through" : "none", wordBreak: "break-word", lineHeight: 1.3, flex: 1,
      }}>
        {item.title}
      </span>
      <IconButton icon={Trash2} variant="subtle" size={32} iconSize={14} onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} title="Supprimer" />
    </div>
  );
}

function MissionChip({ item, onToggle, onDelete, onDragStart }) {
  const squareCheckbox = PALETTE.checkboxShape === "square";
  return (
    <div
      onPointerDown={onDragStart}
      onClick={() => onToggle(item.id)}
      className="cl-tap"
      style={{
        position: "relative", background: item.done ? `${PALETTE.forest}12` : (PALETTE.cardBg || PALETTE.panel),
        border: PALETTE.chipBorderWidth ? `${PALETTE.chipBorderWidth}px solid ${item.done ? PALETTE.forest : ctrlLine()}` : "none",
        borderRadius: PALETTE.missionRadius, padding: "12px 8px", cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
        minHeight: 74, boxShadow: item.done ? "none" : PALETTE.chipShadow,
        backdropFilter: PALETTE.cardBlur ? `blur(${PALETTE.cardBlur}px)` : undefined,
        transition: "all 0.18s cubic-bezier(.34,1.4,.64,1)",
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
        style={{
          position: "absolute", top: -8, right: -8, width: 24, height: 24, borderRadius: "50%",
          background: "transparent", border: "none", cursor: "pointer", padding: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        title="Supprimer"
      >
        <span style={{
          width: 16, height: 16, borderRadius: squareCheckbox ? 3 : "50%", background: PALETTE.canvasDeep,
          border: `1px solid ${PALETTE.line}`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <X size={10} color={PALETTE.inkFaint} strokeWidth={3} />
        </span>
      </button>
      <Checkbox done={item.done} size={19} />
      <span style={{
        fontSize: 11.5, fontWeight: PALETTE.bodyWeight, color: item.done ? PALETTE.inkFaint : PALETTE.ink,
        textDecoration: item.done ? "line-through" : "none", textAlign: "center",
        lineHeight: 1.2, wordBreak: "break-word", display: "-webkit-box",
        WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {item.title}
      </span>
    </div>
  );
}

// Chip toggle réutilisé par Hebdo et Daily — forme/taille/ombre pilotées par le thème actif
function TaskChip({ done, color, icon: Icon, title, onClick }) {
  return (
    <button className="cl-tap" onClick={onClick} title={title} style={{
      background: done ? `${color}1c` : (PALETTE.cardBg || PALETTE.panel),
      border: PALETTE.chipBorderWidth ? `${PALETTE.chipBorderWidth}px solid ${done ? color : ctrlLine()}` : "none",
      borderRadius: PALETTE.chipRadius, padding: 0, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, width: PALETTE.chipSize, height: PALETTE.chipSize,
      boxShadow: done ? "none" : PALETTE.chipShadow,
      backdropFilter: PALETTE.cardBlur ? `blur(${PALETTE.cardBlur}px)` : undefined,
      transition: "all 0.18s cubic-bezier(.34,1.4,.64,1)",
    }}>
      {done ? <CheckCircle2 size={16} color={color} /> : <Icon size={15} color={PALETTE.inkFaint} />}
    </button>
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
        borderRadius: PALETTE.radiusCardLg, padding: "12px 12px 12px 10px", cursor: "pointer",
        display: "flex", flexDirection: "column", gap: 10,
      })}
      onClick={() => onOpen(dossier.id)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <DragHandle onPointerDown={onDragStart} />
        <IconBadge icon={Folder} color={color} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: PALETTE.fontDisplay, fontWeight: 600, fontSize: 15, color: PALETTE.ink, wordBreak: "break-word", lineHeight: 1.25 }}>
            {dossier.name}
          </div>
          <div style={{ fontSize: 11.5, color: PALETTE.inkFaint, marginTop: 1 }}>{taskCount} tâche{taskCount > 1 ? "s" : ""}</div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color, flexShrink: 0 }}>{pct}%</span>
        <ChevronRight size={16} color={PALETTE.inkFaint} style={{ flexShrink: 0 }} />
        <IconButton icon={Trash2} variant="subtle" size={30} iconSize={13} onClick={(e) => { e.stopPropagation(); onDelete(dossier.id); }} title="Supprimer" />
      </div>
      <div style={{ paddingLeft: 46 }}>
        <ProgressBar pct={pct} color={color} />
      </div>
    </div>
  );
}

// ============================================================
// VIEWS
// ============================================================
function TasksView({ state, weekly, daily, onToggleSimple, onDeleteSimple, onReorderTasks, onResetOrder, onRequestReset, onToggleWeeklyTask, onToggleDailyTask, themeId }) {
  const totalDone = state.tasks.filter((t) => t.done).length;
  const totalCount = state.tasks.length;
  const isEmpty = state.tasks.length === 0;
  const weekColors = weekGroupColors();

  // Avancement global du jour : missions + hebdo + daily, c'est ce qui alimente le bandeau
  const dayDone = totalDone
    + weekly.groups.reduce((a, g) => a + g.tasks.filter((t) => t.done).length, 0)
    + daily.groups.reduce((a, g) => a + g.tasks.filter((t) => t.done).length, 0);
  const dayTotal = totalCount
    + weekly.groups.reduce((a, g) => a + g.tasks.length, 0)
    + daily.groups.reduce((a, g) => a + g.tasks.length, 0);

  return (
    <div>
      <HeroBanner viewKey={themeId} done={dayDone} total={dayTotal} />

      {/* ---- Hebdo (toggle icônes, groupée avec petites séparations) ---- */}
      <div style={{ marginBottom: 18 }}>
        <SectionLabel color={PALETTE.sky}>Hebdo</SectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 5, overflowX: "auto", padding: "2px 5px 6px 2px" }}>
          {weekly.groups.map((g, gi) => {
            const color = weekColors[g.name] || PALETTE.forest;
            return (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                {gi > 0 && <span style={{ width: 1.5, height: 16, background: PALETTE.line, margin: "0 3px", flexShrink: 0 }} />}
                {g.tasks.map((t) => {
                  const TaskIcon = getIcon(t.icon);
                  return (
                    <TaskChip key={t.id} done={t.done} color={color} icon={TaskIcon} title={`${g.name} · ${t.title}`} onClick={() => onToggleWeeklyTask(g.id, t.id)} />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Daily (toggle icônes, groupée avec petites séparations) ---- */}
      <div style={{ marginBottom: 18 }}>
        <SectionLabel color={PALETTE.berry}>Daily</SectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 5, overflowX: "auto", padding: "2px 5px 6px 2px" }}>
          {daily.groups.map((g, gi) => {
            const color = colorForIndex(gi);
            return (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                {gi > 0 && <span style={{ width: 1.5, height: 16, background: PALETTE.line, margin: "0 3px", flexShrink: 0 }} />}
                {g.tasks.map((t) => {
                  const TaskIcon = getIcon(t.icon);
                  return (
                    <TaskChip key={t.id} done={t.done} color={color} icon={TaskIcon} title={`${g.name} · ${t.title}`} onClick={() => onToggleDailyTask(g.id, t.id)} />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Missions (ajoutées manuellement, grille 6 colonnes compacte) ---- */}
      <div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
          <div>
            <SectionLabel color={PALETTE.amber}>Missions</SectionLabel>
            <p style={{ fontSize: 12, color: PALETTE.inkFaint, margin: "3px 0 0" }}>{totalDone} / {totalCount} faites</p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <PillButton variant="ghost" icon={RotateCcw} onClick={onResetOrder}>Ordre A→Z</PillButton>
            <PillButton variant="dangerGhost" icon={AlertTriangle} onClick={onRequestReset}>Réinitialiser</PillButton>
          </div>
        </div>

        {isEmpty && <EmptyState title="Rien pour l'instant" subtitle="Ajoute une mission depuis la barre en bas" />}

        {state.tasks.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <SortableList items={state.tasks} keyId="id" onReorder={onReorderTasks}
              gridStyle={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))", gap: 8 }}
              renderItem={(t, i, d) => <MissionChip item={t} onToggle={onToggleSimple} onDelete={onDeleteSimple} onDragStart={d} />} />
          </div>
        )}
      </div>
    </div>
  );
}

function DossiersView({ dossiers, onReorderDossiers, onOpenDossier, onDeleteDossier, onResetOrder }) {
  const isEmpty = dossiers.length === 0;
  const doneCount = dossiers.filter((d) => dossierPct(d) === 100).length;

  return (
    <div>
      <PageHeader
        title="Dossiers"
        subtitle={`${doneCount} / ${dossiers.length} terminés`}
        action={<PillButton variant="ghost" icon={RotateCcw} onClick={onResetOrder}>Ordre A→Z</PillButton>}
      />

      {isEmpty && <EmptyState icon={Folder} title="Aucun dossier" subtitle="Décris un projet à l'assistant pour en créer un" />}

      {dossiers.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <SortableList items={dossiers} keyId="id" onReorder={onReorderDossiers}
            gridStyle={{ display: "flex", flexDirection: "column", gap: 9 }}
            renderItem={(d, i, drag) => <DossierCard dossier={d} index={i} onOpen={onOpenDossier} onDelete={onDeleteDossier} onDragStart={drag} />} />
        </div>
      )}
    </div>
  );
}

function BarRow({ label, current, max, color, icon: Icon }) {
  const pct = max ? Math.round((current / max) * 100) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {Icon && <Icon size={15} color={color} />}
        <span style={{ fontSize: 11.5, fontWeight: 600, color: PALETTE.inkSoft, flex: 1 }}>{label}</span>
        <span style={{ fontFamily: PALETTE.fontDisplay, fontSize: 15, fontWeight: 700, color }}>{current}</span>
        <span style={{ fontSize: 11, color: PALETTE.inkFaint }}>/{max}</span>
      </div>
      <ProgressBar pct={pct} color={color} height={7} />
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

  // Élan du jour : tout ce qui est cochable aujourd'hui, une seule jauge
  const dayDone = weekDone + dailyDone + totalDone;
  const dayTotal = weekTotal + dailyTotal + totalCount;
  const dayPct = dayTotal ? Math.round((dayDone / dayTotal) * 100) : 0;

  return (
    <div>
      {/* Bandeau d'élan — la première chose qu'on voit en ouvrant l'app */}
      <div className="cl-rise" style={cardStyle({
        borderRadius: PALETTE.radiusCardLg, padding: "20px 18px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 18,
        background: PALETTE.accentGrad
          ? PALETTE.accentGrad
          : `linear-gradient(135deg, ${PALETTE.forest}10 0%, ${PALETTE.amber}0E 100%), ${PALETTE.cardBg || PALETTE.panel}`,
        boxShadow: PALETTE.accentGrad ? PALETTE.glowAccent : PALETTE.cardShadow,
      })}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 11, fontWeight: PALETTE.labelWeight, letterSpacing: PALETTE.labelTracking,
            textTransform: "uppercase", color: PALETTE.accentGrad ? "rgba(255,255,255,0.85)" : PALETTE.inkFaint,
          }}>
            {greeting()} · {todayLabel()}
          </div>
          <div style={{ ...titleStyle({ marginTop: 7 }), color: PALETTE.accentGrad ? "#FFFFFF" : PALETTE.ink }}>
            {dayDone} sur {dayTotal}
          </div>
          <div style={{ fontSize: 13, marginTop: 7, color: PALETTE.accentGrad ? "rgba(255,255,255,0.92)" : PALETTE.inkSoft }}>
            {pepTalk(dayPct, dayTotal)}
          </div>
        </div>
        <div style={{ position: "relative", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ProgressRing pct={dayPct} color={PALETTE.accentGrad ? "#FFFFFF" : PALETTE.forest} size={64} />
          <span style={{
            position: "absolute", fontSize: 14, fontWeight: 700, fontFamily: PALETTE.fontBody,
            color: PALETTE.accentGrad ? "#FFFFFF" : PALETTE.ink,
          }}>{dayPct}%</span>
        </div>
      </div>

      <SectionLabel>Vue d'ensemble</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div className="cl-card" style={cardStyle({ padding: 14 })}><BarRow label="Tâches" current={totalDone} max={totalCount || 1} color={PALETTE.amber} icon={ListChecks} /></div>
        <div className="cl-card" style={cardStyle({ padding: 14 })}><BarRow label="Hebdo" current={weekDone} max={weekTotal || 1} color={PALETTE.forest} icon={CalendarDays} /></div>
        <div className="cl-card" style={cardStyle({ padding: 14 })}><BarRow label="Daily" current={dailyDone} max={dailyTotal || 1} color={PALETTE.berry} icon={Zap} /></div>
        <div className="cl-card" style={cardStyle({ padding: 14 })}><BarRow label="Mensuelle" current={monthlyDone} max={monthlyTotal || 1} color={PALETTE.sky} icon={CalendarRange} /></div>
        <div className="cl-card" style={cardStyle({ padding: 14 })}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Mail size={15} color={PALETTE.clay} />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: PALETTE.inkSoft, flex: 1 }}>Email</span>
            <span style={{ fontFamily: PALETTE.fontDisplay, fontSize: 15, fontWeight: 700, color: PALETTE.clay }}>{emailTotal}</span>
          </div>
          <div style={{ fontSize: 11, color: PALETTE.inkFaint, marginTop: 5 }}>action{emailTotal > 1 ? "s" : ""} à traiter</div>
        </div>
      </div>

      {state.dossiers.length > 0 && (
        <div className="cl-card" style={cardStyle({ padding: 16 })}>
          <SectionLabel>Dossiers actifs</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: 10 }}>
            {state.dossiers.map((d, i) => {
              const pct = dossierPct(d);
              return (
                <div key={d.id} style={{ textAlign: "center" }}>
                  <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <ProgressRing pct={pct} color={colorForIndex(i)} size={44} />
                    <span style={{ position: "absolute", fontSize: 9.5, fontWeight: 700, color: PALETTE.inkSoft }}>{pct}</span>
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: PALETTE.ink, marginTop: 6, wordBreak: "break-word", lineHeight: 1.25 }}>{d.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Tuile d'un rituel (daily / hebdo / mensuel) — même objet visuel partout
function RitualTile({ task, color, onClick, minWidth }) {
  const Icon = getIcon(task.icon);
  const done = task.done;
  return (
    <div
      className="cl-card cl-tap"
      onClick={onClick}
      style={cardStyle({
        borderRadius: PALETTE.radiusChip, padding: "13px 8px", cursor: "pointer", textAlign: "center",
        background: done ? `${color}16` : (PALETTE.cardBg || PALETTE.panel),
        border: PALETTE.cardBorderWidth ? `${PALETTE.cardBorderWidth}px solid ${done ? color : (PALETTE.cardBorderColor || PALETTE.line)}` : "none",
        boxShadow: done ? "none" : PALETTE.cardShadow,
        minWidth,
      })}
    >
      {done ? <CheckCircle2 size={19} color={color} /> : <Icon size={19} color={PALETTE.inkFaint} />}
      <div style={{
        fontSize: 11.5, fontWeight: PALETTE.bodyWeight, color: done ? color : PALETTE.ink, marginTop: 6,
        textDecoration: done ? "line-through" : "none", wordBreak: "break-word", lineHeight: 1.25,
      }}>{task.title}</div>
    </div>
  );
}

// Rendu commun des vues "groupes de rituels" — Quotidien, Hebdo, Mensuelle
function RitualGroups({ groups, onToggleTask, colorFor, iconFor, tileMin = 96 }) {
  return (
    <>
      {groups.map((g, gi) => {
        const color = colorFor(g, gi);
        const Icon = iconFor ? iconFor(g) : getIcon(g.icon);
        const gDone = g.tasks.filter((t) => t.done).length;
        return (
          <div key={g.id} style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <IconBadge icon={Icon} color={color} size={26} />
              <span style={{
                fontSize: 11, fontWeight: PALETTE.labelWeight, letterSpacing: PALETTE.labelTracking,
                color: PALETTE.ink, textTransform: PALETTE.labelCase, flex: 1,
              }}>{g.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: gDone === g.tasks.length ? color : PALETTE.inkFaint }}>
                {gDone}/{g.tasks.length}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${tileMin}px, 1fr))`, gap: 8 }}>
              {g.tasks.map((t) => (
                <RitualTile key={t.id} task={t} color={color} onClick={() => onToggleTask(g.id, t.id)} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

function DailyView({ daily, onToggleTask }) {
  const total = daily.groups.reduce((a, g) => a + g.tasks.length, 0);
  const done = daily.groups.reduce((a, g) => a + g.tasks.filter((t) => t.done).length, 0);
  return (
    <div>
      <PageHeader title="Quotidien" subtitle={`${done} / ${total} · rituels du jour`} icon={Zap} color={PALETTE.berry} />
      <RitualGroups groups={daily.groups} onToggleTask={onToggleTask} colorFor={(g, i) => colorForIndex(i)} />
    </div>
  );
}

const WEEK_ICONS = { Famille: Phone, Maison: ListChecks, Sport: Dumbbell, Cuisine: Trophy };
// Couleur par groupe Hebdo — source unique, utilisée par TasksView ET WeekView pour rester synchronisées.
// Fonction (pas une constante figée) pour bien refléter PALETTE si le thème change.
function weekGroupColors() {
  return { Famille: PALETTE.berry, Maison: PALETTE.amber, Sport: PALETTE.sky, Cuisine: PALETTE.clay };
}

function WeekView({ weekly, onToggleTask }) {
  const total = weekly.groups.reduce((a, g) => a + g.tasks.length, 0);
  const done = weekly.groups.reduce((a, g) => a + g.tasks.filter((t) => t.done).length, 0);
  const groupColors = weekGroupColors();

  return (
    <div>
      <PageHeader title="Hebdo" subtitle={`${done} / ${total} · lundi → dimanche`} icon={CalendarDays} color={PALETTE.sky} />
      <RitualGroups
        groups={weekly.groups}
        onToggleTask={onToggleTask}
        colorFor={(g) => groupColors[g.name] || PALETTE.forest}
        iconFor={(g) => WEEK_ICONS[g.name] || Circle}
        tileMin={86}
      />
    </div>
  );
}

function SportView({ sport, onOpenDossier }) {
  return (
    <div>
      <PageHeader title="Sport" subtitle={`${sport.dossiers.length} programmes`} icon={Dumbbell} color={PALETTE.sage} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
        {sport.dossiers.map((d, i) => {
          const pct = dossierPct(d);
          const color = colorForIndex(i);
          return (
            <div key={d.id} className="cl-card" onClick={() => onOpenDossier(d.id)} style={cardStyle({
              borderRadius: PALETTE.radiusCardLg, padding: "14px", cursor: "pointer", borderColor: `${color}55`,
            })}>
              <ProgressRing pct={pct} color={color} size={32} />
              <div style={{ fontFamily: PALETTE.fontDisplay, fontWeight: 600, fontSize: 15.5, color: PALETTE.ink, marginTop: 9 }}>{d.name}</div>
              <div style={{ fontSize: 11.5, color: PALETTE.inkFaint, marginTop: 3 }}>{d.tasks.length} tâches · {pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthlyView({ monthly, onToggleTask }) {
  const total = monthly.groups.reduce((a, g) => a + g.tasks.length, 0);
  const done = monthly.groups.reduce((a, g) => a + g.tasks.filter((t) => t.done).length, 0);
  return (
    <div>
      <PageHeader title="Mensuelle" subtitle={`${done} / ${total} · rituels du mois`} icon={CalendarRange} color={PALETTE.clay} />
      <RitualGroups groups={monthly.groups} onToggleTask={onToggleTask} colorFor={(g, i) => colorForIndex(i + 1)} />
    </div>
  );
}

// Mini-label discret au-dessus d'une ligne de nav — juste assez pour orienter sans prendre de place
function NavGroupLabel({ children }) {
  return (
    <div style={{ fontSize: 9.5, fontWeight: PALETTE.labelWeight, letterSpacing: PALETTE.labelTracking, color: PALETTE.inkFaint, textTransform: PALETTE.labelCase, padding: "2px 2px 3px" }}>
      {children}
    </div>
  );
}

// Un seul bouton de nav — le thème décide s'il s'agit d'une pilule, d'un bloc ou d'un simple souligné
function NavButton({ label, icon: Icon, active, onClick, iconSize = 13 }) {
  const underline = PALETTE.navUnderline;
  return (
    <button
      className="cl-press"
      onClick={onClick}
      style={{
        background: underline ? "transparent" : (active ? (PALETTE.navActiveBg || accentFill()) : "transparent"),
        color: active ? (underline ? PALETTE.ink : (PALETTE.navActiveColor || PALETTE.onAccent)) : (PALETTE.navIdleColor || PALETTE.inkSoft),
        padding: PALETTE.navPad, borderRadius: PALETTE.navRadius,
        fontSize: 12, fontWeight: active ? Math.min(800, PALETTE.navWeight + 100) : PALETTE.navWeight,
        textTransform: PALETTE.navCase, letterSpacing: PALETTE.navTracking,
        boxShadow: active && !underline ? PALETTE.navActiveShadow : "none",
        borderBottom: underline ? `2px solid ${active ? PALETTE.amber : "transparent"}` : "none",
        whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
        transition: "all 0.18s cubic-bezier(.34,1.4,.64,1)", flexShrink: 0,
      }}
    >
      <Icon size={iconSize} />{label}
    </button>
  );
}

function NavRow({ items, view, dossierReturnView, onSelect }) {
  return (
    <div className="cl-navrow" style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 6 }}>
      {items.map(({ id, label, icon: Icon }) => (
        <NavButton
          key={id} label={label} icon={Icon}
          active={view === id || (view === "dossier" && dossierReturnView === id)}
          onClick={() => onSelect(id)}
        />
      ))}
    </div>
  );
}

function DomainView({ domainId }) {
  const domain = DOMAINES[domainId];
  const [expandedUnivers, setExpandedUnivers] = useState({});
  const [objectifs, setObjectifs] = useState(domain ? domain.univers.map(u => ({ name: u.name, items: u.objectifs })) : []);

  if (!domain) return null;
  const Icon = domain.icon;
  const domColor = PALETTE[domain.colorKey] || PALETTE.forest;

  const toggleUnivers = (univerName) => {
    setExpandedUnivers((prev) => ({ ...prev, [univerName]: !prev[univerName] }));
  };

  const deleteObjectif = (univerName, objectifId) => {
    setObjectifs((prev) => prev.map((u) => 
      u.name === univerName 
        ? { ...u, items: u.items.filter((obj) => obj.id !== objectifId) }
        : u
    ));
  };

  return (
    <div>
      <PageHeader title={domain.name} subtitle={`Domaine de vie · ${objectifs.length} univers`} icon={Icon} color={domColor} />

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {objectifs.map((u) => {
          const isExpanded = expandedUnivers[u.name];
          return (
            <div key={u.name}>
              <button
                className="cl-card"
                onClick={() => toggleUnivers(u.name)}
                style={cardStyle({
                  width: "100%", padding: "13px 14px", display: "flex", alignItems: "center", gap: 11, cursor: "pointer",
                })}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: domColor, flexShrink: 0 }} />
                <span style={{ fontSize: 14.5, fontWeight: PALETTE.bodyWeight, color: PALETTE.ink, flex: 1, textAlign: "left" }}>{u.name}</span>
                <ChevronRight size={16} color={PALETTE.inkFaint} style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
              </button>

              {isExpanded && (
                <div className="cl-rise" style={{ paddingLeft: 20, paddingTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {u.items.map((obj) => (
                    <div key={obj.id} style={{
                      background: PALETTE.canvasDeep, border: `1px solid ${PALETTE.lineSoft}`, borderRadius: PALETTE.radiusChip,
                      padding: "10px 12px", fontSize: 13, color: PALETTE.ink,
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                    }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: domColor, flexShrink: 0 }} />
                        {obj.title}
                      </span>
                      <button
                        onClick={() => deleteObjectif(u.name, obj.id)}
                        style={{
                          background: "transparent", border: "none", cursor: "pointer", padding: 0,
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}
                        title="Supprimer"
                      >
                        <Trash2 size={14} color={PALETTE.danger} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 10.5, color: PALETTE.inkFaint, marginTop: 16, fontStyle: "italic" }}>
        Cliquez sur un univers pour voir les objectifs. Cliquez sur le badge trash pour supprimer un objectif.
      </p>
    </div>
  );
}

function SubtaskRow({ subtask, onToggle, onDelete, isLast }) {
  return (
    <div style={{ position: "relative", paddingLeft: 28, marginTop: 8 }}>
      {/* Connecteur arbre */}
      <span style={{ position: "absolute", left: 10, top: isLast ? -8 : -8, bottom: isLast ? "50%" : -8, width: 1.5, background: PALETTE.line }} />
      <span style={{ position: "absolute", left: 10, top: 18, width: 12, height: 1.5, background: PALETTE.line }} />
      <div className="cl-tap" onClick={onToggle} style={{
        background: PALETTE.canvasDeep, border: `1px solid ${PALETTE.lineSoft}`, borderRadius: PALETTE.radiusChip,
        padding: "8px 8px 8px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, minHeight: 40,
      }}>
        <Checkbox done={subtask.done} size={16} />
        <span style={{ fontSize: 13, color: subtask.done ? PALETTE.inkFaint : PALETTE.ink, flex: 1, textDecoration: subtask.done ? "line-through" : "none", wordBreak: "break-word" }}>{subtask.title}</span>
        <IconButton icon={Trash2} variant="subtle" size={28} iconSize={12} onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Supprimer" />
      </div>
    </div>
  );
}

function TaskRow({ task, onToggle, onDelete, onAddSub, onToggleSub, onDeleteSub }) {
  const [expanded, setExpanded] = useState(false);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  return (
    <div>
      <div className="cl-card" onClick={onToggle} style={cardStyle({
        padding: "8px 8px 8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, minHeight: 52,
      })}>
        <Checkbox done={task.done} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: PALETTE.bodyWeight, fontSize: 14.5, color: task.done ? PALETTE.inkFaint : PALETTE.ink, textDecoration: task.done ? "line-through" : "none", wordBreak: "break-word" }}>{task.title}</div>
          {hasSubtasks && <div style={{ fontSize: 11, color: PALETTE.inkFaint, marginTop: 2 }}>{task.subtasks.filter((s) => s.done).length} / {task.subtasks.length} sous-tâches</div>}
        </div>
        {hasSubtasks && (
          <IconButton icon={expanded ? ChevronDown : ChevronRight} variant="subtle" size={30} iconSize={14} onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} title="Déplier" />
        )}
        <IconButton icon={Plus} variant="subtle" size={30} iconSize={14} onClick={(e) => { e.stopPropagation(); onAddSub(task.id); }} title="Ajouter sous-tâche" color={PALETTE.amber} />
        <IconButton icon={Trash2} variant="subtle" size={30} iconSize={13} onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} title="Supprimer" />
      </div>
      {expanded && hasSubtasks && (
        <div style={{ position: "relative" }}>{task.subtasks.map((s, si) => (
          <SubtaskRow key={s.id} subtask={s} onToggle={() => onToggleSub(task.id, s.id)} onDelete={() => onDeleteSub(task.id, s.id)} isLast={si === task.subtasks.length - 1} />
        ))}</div>
      )}
    </div>
  );
}

function DossierDetailView({ dossier, onBack, onToggleTask, onDeleteTask, onAddTask, onAddSubtask, onToggleSubtask, onDeleteSubtask }) {
  const done = dossier.tasks.filter((t) => t.done).length + dossier.tasks.reduce((a, t) => a + (t.subtasks?.filter((s) => s.done).length || 0), 0);
  const total = dossier.tasks.length + dossier.tasks.reduce((a, t) => a + (t.subtasks?.length || 0), 0);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 18 }}>
        <IconButton icon={ChevronLeft} variant="ghost" size={38} iconSize={17} onClick={onBack} title="Retour" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={titleStyle({ fontSize: Math.round(PALETTE.h1Size * 0.82) })}>{dossier.name}</h1>
          <p style={subtitleStyle({ margin: "3px 0 0" })}>{done} / {total} · {total ? Math.round((done / total) * 100) : 0}%</p>
        </div>
        <PillButton variant="primary" icon={Plus} onClick={() => onAddTask(dossier.id)}>Tâche</PillButton>
      </div>
      <div style={{ marginBottom: 16 }}>
        <ProgressBar pct={total ? Math.round((done / total) * 100) : 0} color={PALETTE.forest} height={5} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {dossier.tasks.map((t) => (
          <TaskRow key={t.id} task={t} onToggle={() => onToggleTask(t.id)} onDelete={onDeleteTask} onAddSub={onAddSubtask} onToggleSub={onToggleSubtask} onDeleteSub={onDeleteSubtask} />
        ))}
        {dossier.tasks.length === 0 && <EmptyState title="Dossier vide" subtitle="Ajoute une tâche avec le bouton ci-dessus" />}
      </div>
    </div>
  );
}

function EmailGroupFolder({ group, onDismiss }) {
  const [expanded, setExpanded] = useState(false);
  const itemCount = group.items ? group.items.length : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <button className="cl-card" onClick={() => setExpanded(!expanded)} style={cardStyle({
        width: "100%", padding: "12px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", minHeight: 52,
        borderColor: `${group.color}55`,
      })}>
        <Mail size={15} color={group.color} />
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontWeight: 600, fontSize: 13.5, color: PALETTE.ink }}>{group.group}</div>
          <div style={{ fontSize: 11, color: PALETTE.inkFaint }}>{itemCount} action{itemCount > 1 ? "s" : ""}</div>
        </div>
        {expanded ? <ChevronDown size={15} color={PALETTE.inkFaint} /> : <ChevronRight size={15} color={PALETTE.inkFaint} />}
      </button>
      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 8, marginTop: 8, borderLeft: `3px solid ${group.color}` }}>
          {group.items?.map((it) => (
            <div key={it.id} style={{ background: `${group.color}0d`, border: `1px solid ${group.color}25`, borderRadius: PALETTE.radiusChip, padding: "10px 6px 10px 12px", display: "flex", alignItems: "flex-start", gap: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: group.color, textTransform: "uppercase", marginBottom: 2 }}>{it.sender}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: PALETTE.ink, wordBreak: "break-word" }}>{it.title}</div>
                {it.summary && <div style={{ fontSize: 11.5, color: PALETTE.inkFaint, marginTop: 3 }}>{it.summary}</div>}
              </div>
              <IconButton icon={X} variant="subtle" size={30} iconSize={13} onClick={() => onDismiss(it.id)} title="Ignorer" />
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
      <PageHeader
        title="Email"
        subtitle={lastScan ? `Scanné ${new Date(lastScan).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}` : "Jamais scanné"}
        icon={Mail}
        color={PALETTE.clay}
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

// ============================================================
// APP SHELL
// ============================================================
const NAV_GROUPS = [
  {
    id: "recurrences", label: "Récurrences",
    items: [
      { id: "daily", label: "Daily", icon: Zap },
      { id: "week", label: "Hebdo", icon: CalendarDays },
      { id: "monthly", label: "Mensuelle", icon: CalendarRange },
      { id: "email", label: "Email", icon: Mail },
    ],
  },
  {
    id: "domaines", label: "Domaines",
    items: [
      { id: "domaine-vitalite", label: "Vitalité", icon: Heart },
      { id: "domaine-etudes", label: "Études", icon: BookOpen },
      { id: "domaine-passions", label: "Passions", icon: Sparkles },
      { id: "domaine-modeles", label: "Modèles Éco", icon: TrendingUp },
      { id: "domaine-gestion", label: "Gestion", icon: Wallet },
    ],
  },
];

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

export default function Clairiere() {
  useFonts();
  const [themeId, setThemeId] = useState("clairiere");
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [state, setState] = useState(defaultState());
  const [weekly, setWeekly] = useState(defaultWeekly());
  const [daily, setDaily] = useState(defaultDaily());
  const [monthly, setMonthly] = useState(defaultMonthly());
  const [sport, setSport] = useState(defaultSport());
  const [emailItems, setEmailItems] = useState([]);
  const [emailScanning, setEmailScanning] = useState(false);
  const [emailLastScan, setEmailLastScan] = useState(null);
  const [loaded, setLoaded] = useState(false);
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
  const scrollRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState(false);
  const recognitionRef = useRef(null);

  // ---- initial load ----
  useEffect(() => {
    (async () => {
      const [s, w, d, sp, ec, c, th, mo] = await Promise.all([
        storageGet(STORAGE_KEYS.state), storageGet(STORAGE_KEYS.weekly), storageGet(STORAGE_KEYS.daily),
        storageGet(STORAGE_KEYS.sport), storageGet(STORAGE_KEYS.emails), storageGet(STORAGE_KEYS.chat),
        storageGet(STORAGE_KEYS.theme), storageGet(STORAGE_KEYS.monthly),
      ]);
      const migrated = LEGACY_THEME_IDS[th] || th;
      if (migrated && THEMES[migrated]) { applyTheme(migrated); setThemeId(migrated); }
      if (s && (s.tasks || s.dossiers)) setState({ tasks: s.tasks || [], dossiers: s.dossiers || [] });
      if (w) {
        const currentMonday = getMondayISO();
        if (w.weekStart !== currentMonday) {
          const reset = { ...w, weekStart: currentMonday, groups: w.groups.map((g) => ({ ...g, tasks: g.tasks.map((t) => ({ ...t, done: false })) })) };
          setWeekly(reset);
          storageSet(STORAGE_KEYS.weekly, reset);
        } else setWeekly(w);
      }
      if (d) setDaily(d);
      if (mo) setMonthly(mo);
      if (sp) setSport(sp);
      if (ec) { setEmailItems(ec.items || []); setEmailLastScan(ec.lastScan || null); }
      if (c) setMessages(c);
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
  useEffect(() => { if (loaded) storageSet(STORAGE_KEYS.emails, { items: emailItems, lastScan: emailLastScan }); }, [emailItems, emailLastScan, loaded]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, sending, chatOpen]);

  const toggleRecording = () => {
    if (isRecording) { try { recognitionRef.current?.stop(); } catch {} setIsRecording(false); return; }
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

  const toggleWeeklyTask = (groupId, taskId) => setWeekly((prev) => ({ ...prev, groups: prev.groups.map((g) => (g.id !== groupId ? g : { ...g, tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) })) }));
  const toggleDailyTask = (groupId, taskId) => setDaily((prev) => ({ ...prev, groups: prev.groups.map((g) => (g.id !== groupId ? g : { ...g, tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) })) }));
  const toggleMonthlyTask = (groupId, taskId) => setMonthly((prev) => ({ ...prev, groups: prev.groups.map((g) => (g.id !== groupId ? g : { ...g, tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) })) }));

  // ---- handlers génériques dossier (state.dossiers) ----
  const withActiveCollection = (updater) => {
    setState((prev) => ({ ...prev, dossiers: updater(prev.dossiers) }));
  };
  const toggleDossierTask = (taskId) => withActiveCollection((dossiers) => dossiers.map((d) => (d.id === activeDossierId ? { ...d, tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) } : d)));
  const deleteDossierTask = (taskId) => withActiveCollection((dossiers) => dossiers.map((d) => (d.id === activeDossierId ? { ...d, tasks: d.tasks.filter((t) => t.id !== taskId) } : d)));
  const addTaskToDossier = (dossierId) => withActiveCollection((dossiers) => dossiers.map((d) => (d.id === dossierId ? { ...d, tasks: [...d.tasks, { id: uid(), title: "Nouvelle tâche", done: false, subtasks: [] }] } : d)));
  const addSubtask = (taskId) => withActiveCollection((dossiers) => dossiers.map((d) => (d.id === activeDossierId ? { ...d, tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), { id: uid(), title: "Sous-tâche", done: false }] } : t)) } : d)));
  const toggleSubtask = (taskId, subtaskId) => withActiveCollection((dossiers) => dossiers.map((d) => (d.id === activeDossierId ? { ...d, tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: (t.subtasks || []).map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s)) } : t)) } : d)));
  const deleteSubtask = (taskId, subtaskId) => withActiveCollection((dossiers) => dossiers.map((d) => (d.id === activeDossierId ? { ...d, tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: (t.subtasks || []).filter((s) => s.id !== subtaskId) } : t)) } : d)));

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

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setSending(true);
    try {
      const result = await callClaude(messages, text);
      setMessages((m) => [...m, { role: "assistant", content: result.reply }]);
      setAssistantStatus(result.status === "question" ? "question" : result.status === "error" ? "error" : "ok");
      if (result.actions && result.actions.length) {
        result.actions.forEach((act) => {
          if (act.type === "add_task") setState((prev) => ({ ...prev, tasks: [...prev.tasks, { id: uid(), title: act.title || "Tâche", done: false }] }));
          else if (act.type === "add_dossier") setState((prev) => ({ ...prev, dossiers: [...prev.dossiers, { id: uid(), name: act.name || "Dossier", tasks: [] }] }));
        });
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Erreur." }]);
      setAssistantStatus("error");
    } finally { setSending(false); }
  }, [input, sending, messages]);

  return (
    <div style={{ background: PALETTE.appBg, fontFamily: PALETTE.fontBody, minHeight: "100vh", position: "relative" }}>
      <style>{`
        * { box-sizing: border-box; }
        html, body { background: ${PALETTE.canvas}; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: ${PALETTE.line}; border-radius: 6px; }
        .clairiere-main { position: relative; z-index: 1; width: 100%; min-height: 100vh; min-height: 100dvh; padding: 16px 14px 92px; overflow-y: auto; max-width: 760px; margin: 0 auto; }
        @media (min-width: 600px) { .clairiere-main { padding: 26px 22px 100px; } }
        button { font-family: inherit; border: none; background: none; cursor: pointer; }
        input:focus { outline: none; }

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

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* Calque décoratif du thème (grain, trames, filets) */}
      {PALETTE.appOverlay && (
        <div aria-hidden style={{ position: "fixed", inset: 0, background: PALETTE.appOverlay, backgroundSize: PALETTE.appOverlaySize || "auto", pointerEvents: "none", zIndex: 0 }} />
      )}

      {/* Header + Nav */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50, background: PALETTE.headerBg,
        backdropFilter: `blur(${PALETTE.headerBlur}px)`, WebkitBackdropFilter: `blur(${PALETTE.headerBlur}px)`,
        borderBottom: PALETTE.headerBorder, boxShadow: PALETTE.headerShadow,
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "12px 14px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, position: "relative" }}>
            <button
              className="cl-press"
              onClick={() => setView("dashboard")}
              style={{
                background: view === "dashboard" ? accentFill() : "transparent",
                color: view === "dashboard" ? PALETTE.onAccent : PALETTE.forest,
                padding: PALETTE.navPad, borderRadius: PALETTE.navRadius,
                boxShadow: view === "dashboard" ? PALETTE.navActiveShadow : "none",
                whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.18s cubic-bezier(.34,1.4,.64,1)", flexShrink: 0, border: "none", cursor: "pointer",
              }}
            >
              <Trees size={16} />
              <span style={{ fontFamily: PALETTE.fontDisplay, fontWeight: PALETTE.h1Weight, fontSize: 16, letterSpacing: 0.2, textTransform: PALETTE.h1Case, fontStyle: PALETTE.h1Style }}>Clairière</span>
            </button>
            <button
              className="cl-press"
              onClick={() => setView("tasks")}
              style={{
                background: view === "tasks" ? accentFill() : "transparent",
                color: view === "tasks" ? PALETTE.onAccent : PALETTE.forest,
                padding: PALETTE.navPad, borderRadius: PALETTE.navRadius,
                boxShadow: view === "tasks" ? PALETTE.navActiveShadow : "none",
                whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.18s cubic-bezier(.34,1.4,.64,1)", flexShrink: 0, border: "none", cursor: "pointer",
              }}
            >
              <ListChecks size={16} />
              <span style={{ fontFamily: PALETTE.fontDisplay, fontWeight: PALETTE.h1Weight, fontSize: 16, letterSpacing: 0.2, textTransform: PALETTE.h1Case, fontStyle: PALETTE.h1Style }}>Tâches</span>
            </button>
            <div style={{ flex: 1 }} />
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
                width: 16, height: 16, borderRadius: PALETTE.radiusPill === "999px" ? "50%" : 2,
                background: `conic-gradient(${Object.values(THEMES).map((t) => t.swatch).join(",")})`,
              }} />
            </button>
            {themePickerOpen && (
              <>
                <div onClick={() => setThemePickerOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 55 }} />
                <div className="cl-rise" style={{
                  position: "absolute", top: 44, right: 0, zIndex: 60,
                  background: PALETTE.panel, border: cardBorder(), borderRadius: PALETTE.radiusCardLg,
                  boxShadow: "0 18px 44px rgba(0,0,0,0.18)", padding: 10, width: 268, maxWidth: "calc(100vw - 28px)",
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
                            padding: 8, borderRadius: PALETTE.radiusChip, textAlign: "left",
                            border: `2px solid ${active ? PALETTE.forest : PALETTE.lineSoft}`,
                            background: active ? PALETTE.canvasDeep : "transparent",
                            transition: "all 0.18s ease",
                          }}
                        >
                          {/* Aperçu miniature du thème */}
                          <span style={{
                            height: 30, borderRadius: t.radiusChip || 8, display: "block",
                            background: `linear-gradient(120deg, ${t.canvas || "#fff"} 0%, ${t.canvasDeep || "#eee"} 100%)`,
                            border: `1px solid ${t.line || "#ddd"}`, position: "relative", overflow: "hidden",
                          }}>
                            <span style={{ position: "absolute", left: 6, top: 8, width: 26, height: 5, borderRadius: 3, background: t.swatch }} />
                            <span style={{ position: "absolute", left: 6, top: 17, width: 40, height: 4, borderRadius: 3, background: t.line }} />
                            <span style={{ position: "absolute", right: 6, top: 8, width: 14, height: 14, borderRadius: t.checkboxShape === "square" ? 3 : "50%", background: t.swatch2 || t.swatch }} />
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
          <NavGroupLabel>{NAV_GROUPS.find((g) => g.id === "recurrences")?.label}</NavGroupLabel>
          <NavRow items={NAV_GROUPS.find((g) => g.id === "recurrences")?.items || []} view={view} dossierReturnView={dossierReturnView} onSelect={setView} />
          <div style={{ paddingBottom: 10 }}>
            <NavGroupLabel>{NAV_GROUPS.find((g) => g.id === "domaines")?.label}</NavGroupLabel>
            <NavRow items={NAV_GROUPS.find((g) => g.id === "domaines")?.items || []} view={view} dossierReturnView={dossierReturnView} onSelect={setView} />
          </div>
        </div>
      </div>

      <div className="clairiere-main">
        {confirmingReset && view === "tasks" && (
          <ConfirmBar
            label="Effacer toutes les tâches et dossiers ? Irréversible."
            confirmLabel="Tout effacer"
            onConfirm={confirmReset}
            onCancel={() => setConfirmingReset(false)}
          />
        )}

        {view === "tasks" && (
          <TasksView state={state} weekly={weekly} daily={daily} onToggleSimple={toggleSimpleTask} onDeleteSimple={deleteSimpleTask}
            onReorderTasks={reorderTasks} onResetOrder={resetTasksOrder} onRequestReset={() => setConfirmingReset(true)}
            onToggleWeeklyTask={toggleWeeklyTask} onToggleDailyTask={toggleDailyTask} themeId={themeId} />
        )}
        {view === "dossiers" && (
          <DossiersView dossiers={state.dossiers} onReorderDossiers={reorderDossiers} onOpenDossier={openDossier}
            onDeleteDossier={deleteDossier} onResetOrder={resetDossiersOrder} />
        )}
        {view === "dossier" && state.dossiers.find((d) => d.id === activeDossierId) && (
          <DossierDetailView dossier={state.dossiers.find((d) => d.id === activeDossierId)} onBack={backToMain}
            onToggleTask={toggleDossierTask} onDeleteTask={deleteDossierTask} onAddTask={addTaskToDossier}
            onAddSubtask={addSubtask} onToggleSubtask={toggleSubtask} onDeleteSubtask={deleteSubtask} />
        )}
        {view === "dashboard" && <DashboardView state={state} weekly={weekly} daily={daily} monthly={monthly} emailItems={emailItems} />}
        {view === "daily" && <DailyView daily={daily} onToggleTask={toggleDailyTask} />}
        {view === "week" && <WeekView weekly={weekly} onToggleTask={toggleWeeklyTask} />}
        {view === "monthly" && <MonthlyView monthly={monthly} onToggleTask={toggleMonthlyTask} />}
        {view === "email" && <EmailView items={emailItems} scanning={emailScanning} lastScan={emailLastScan} onScan={handleScanEmails} onDismiss={dismissEmail} />}
        {DOMAINES[view] && <DomainView domainId={view} />}
      </div>

      {/* Floating input bar */}
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
          placeholder="Ajoute une tâche ou un dossier..."
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
