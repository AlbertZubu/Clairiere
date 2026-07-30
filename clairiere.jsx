import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, ChevronDown, ChevronRight, ChevronLeft, Trash2, Circle,
  CheckCircle2, Loader2, GripVertical, Mic, ListChecks, CalendarDays,
  BarChart3, Zap, Languages, Music, Dumbbell, Mail, RotateCcw, X,
  TrendingUp, BookOpen, Brain, Heart, Gamepad2, Trophy, Phone, Plus, Waves,
  AlertTriangle, Check, Sparkles, Trees, Folder, CircleDot, CalendarRange, Wallet,
} from "lucide-react";

// ============================================================
// DESIGN SYSTEM — "Clairière"
// Une trouée de lumière en forêt : fond parchemin chaud, encre
// vert-forêt, éclat ambré. Cartes à coins organiques (faits main).
// ============================================================
const PALETTE = {
  canvas: "#F7F3E9",
  canvasDeep: "#EFE7D2",
  panel: "#FFFFFF",
  ink: "#1F2A1E",
  inkSoft: "#5C6B54",
  inkFaint: "#66735E",
  line: "#DFD5B8",
  lineSoft: "#EAE2CC",
  forest: "#2C4A32",
  forestSoft: "#4B6B44",
  amber: "#C68A3D",
  amberSoft: "#E0B679",
  clay: "#B5674A",
  sky: "#4E7789",
  sage: "#7C9473",
  berry: "#93516A",
  danger: "#B5453A",
  success: "#3F7A45",
  fontDisplay: "'Fraunces', serif",
  fontBody: "'Public Sans', sans-serif",
  radiusCard: "16px 8px 16px 8px",
  radiusCardLg: "18px 8px 18px 8px",
  radiusChip: "14px 6px 14px 6px",
  // ---- Tokens "éléments tâches" : forme, taille, typo des labels — pilotés par thème ----
  chipShape: "organic",          // identité visuelle du toggle Hebdo/Daily
  chipRadius: "14px 6px 14px 6px",
  chipSize: 34,                  // taille du bouton toggle Hebdo/Daily
  chipBorderWidth: 1.5,
  chipShadow: "0 2px 6px rgba(31,42,30,0.08)",
  missionRadius: "12px 5px 12px 5px",
  checkboxShape: "circle",       // "circle" | "square"
  labelCase: "uppercase",        // "uppercase" | "none"
  labelWeight: 700,
  labelTracking: 1,
};

// ---------- Style variants (mutate PALETTE in place, re-render triggered by state bump) ----------
const THEMES = {
  clairiere: {
    label: "Clairière", swatch: "#2C4A32",
    canvas: "#F7F3E9", canvasDeep: "#EFE7D2", panel: "#FFFFFF",
    ink: "#1F2A1E", inkSoft: "#5C6B54", inkFaint: "#66735E",
    line: "#DFD5B8", lineSoft: "#EAE2CC",
    forest: "#2C4A32", forestSoft: "#4B6B44",
    amber: "#C68A3D", amberSoft: "#E0B679",
    clay: "#B5674A", sky: "#4E7789", sage: "#7C9473", berry: "#93516A",
    danger: "#B5453A", success: "#3F7A45",
    fontDisplay: "'Fraunces', serif", fontBody: "'Public Sans', sans-serif",
    radiusCard: "16px 8px 16px 8px", radiusCardLg: "18px 8px 18px 8px", radiusChip: "14px 6px 14px 6px",
    chipShape: "organic", chipRadius: "14px 6px 14px 6px", chipSize: 34, chipBorderWidth: 1.5,
    chipShadow: "0 2px 6px rgba(31,42,30,0.08)", missionRadius: "12px 5px 12px 5px",
    checkboxShape: "circle", labelCase: "uppercase", labelWeight: 700, labelTracking: 1,
  },
  nike: {
    label: "Nike", swatch: "#111111",
    canvas: "#FFFFFF", canvasDeep: "#F2F2F2", panel: "#FFFFFF",
    ink: "#111111", inkSoft: "#4B4B4D", inkFaint: "#707072",
    line: "#CACACB", lineSoft: "#E5E5E5",
    forest: "#111111", forestSoft: "#39393B",
    amber: "#D30005", amberSoft: "#FF4D4F",
    clay: "#D30005", sky: "#111111", sage: "#4B4B4D", berry: "#D30005",
    danger: "#D30005", success: "#007D48",
    fontDisplay: "'Archivo', 'Helvetica Neue', Arial, sans-serif", fontBody: "'Archivo', 'Helvetica Neue', Arial, sans-serif",
    radiusCard: "2px", radiusCardLg: "2px", radiusChip: "2px",
    chipShape: "square", chipRadius: "2px", chipSize: 32, chipBorderWidth: 2.5,
    chipShadow: "3px 3px 0 rgba(17,17,17,1)", missionRadius: "2px",
    checkboxShape: "square", labelCase: "uppercase", labelWeight: 800, labelTracking: 1.6,
  },
  apple: {
    label: "Apple", swatch: "#0071E3",
    canvas: "#F5F5F7", canvasDeep: "#FFFFFF", panel: "#FFFFFF",
    ink: "#1D1D1F", inkSoft: "#6E6E73", inkFaint: "#6B6B72",
    line: "#E0E0E0", lineSoft: "#EFEFEF",
    forest: "#0071E3", forestSoft: "#0077ED",
    amber: "#0071E3", amberSoft: "#42A1EC",
    clay: "#0071E3", sky: "#0071E3", sage: "#34C759", berry: "#FF375F",
    danger: "#FF3B30", success: "#34C759",
    fontDisplay: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
    fontBody: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
    radiusCard: "14px", radiusCardLg: "16px", radiusChip: "12px",
    chipShape: "round", chipRadius: "11px", chipSize: 36, chipBorderWidth: 1,
    chipShadow: "0 1px 4px rgba(0,0,0,0.06)", missionRadius: "10px",
    checkboxShape: "circle", labelCase: "none", labelWeight: 600, labelTracking: 0,
  },
  claude: {
    label: "Claude", swatch: "#CC785C",
    canvas: "#FAF9F5", canvasDeep: "#F0ECE1", panel: "#FFFFFF",
    ink: "#141413", inkSoft: "#6C6A64", inkFaint: "#726E65",
    line: "#E6DFD8", lineSoft: "#EFE9E0",
    forest: "#CC785C", forestSoft: "#B5674A",
    amber: "#CC785C", amberSoft: "#E0A084",
    clay: "#B5674A", sky: "#8A8578", sage: "#5DB872", berry: "#CC785C",
    danger: "#C0392B", success: "#5DB872",
    fontDisplay: "'Lora', Georgia, serif", fontBody: "'Inter', sans-serif",
    radiusCard: "8px", radiusCardLg: "10px", radiusChip: "8px",
    chipShape: "pill", chipRadius: "999px", chipSize: 34, chipBorderWidth: 1.5,
    chipShadow: "0 3px 10px rgba(204,120,92,0.18)", missionRadius: "999px",
    checkboxShape: "circle", labelCase: "uppercase", labelWeight: 600, labelTracking: 0.5,
  },
};

function applyTheme(id) {
  const t = THEMES[id];
  if (!t) return;
  Object.assign(PALETTE, t);
}

const DOSSIER_COLORS = [PALETTE.amber, PALETTE.clay, PALETTE.sky, PALETTE.sage, PALETTE.berry, PALETTE.forestSoft];
function colorForIndex(i) {
  return DOSSIER_COLORS[i % DOSSIER_COLORS.length];
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
    link.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700;800&family=Archivo:wght@500;600;700;800&family=Lora:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

// ---------- Progress ring (cerne d'arbre) ----------
function ProgressRing({ pct, color, size = 34, thickness }) {
  const stroke = thickness || Math.max(3, size * 0.13);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke={PALETTE.lineSoft} strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
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
  const systemPrompt = `Tu es Clairière, un assistant de gestion de tâches. L'utilisateur te donne des instructions en langage naturel.
Actions disponibles : add_task, add_dossier, toggle_task, delete_task, delete_dossier, add_to_dossier.
Réponds UNIQUEMENT avec du JSON, pas de texte :
{"reply":"...(très court, 3-8 mots)","status":"ok|question|error","actions":[]}`;
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 500,
        system: systemPrompt,
        messages: [...messages, { role: "user", content: userInput }],
      }),
    });
    const data = await response.json();
    const textContent = data.content?.find((b) => b.type === "text")?.text || "";
    const parsed = JSON.parse(textContent.replace(/```json|```/g, "").trim());
    return { reply: parsed.reply || "Action effectuée.", status: parsed.status || "ok", actions: parsed.actions || [] };
  } catch (e) {
    console.error("claude call failed", e);
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
    if (!window.storage) return null;
    const res = await window.storage.get(key, false);
    return res ? JSON.parse(res.value) : null;
  } catch {
    return null;
  }
}
async function storageSet(key, value) {
  try {
    if (!window.storage) return false;
    await window.storage.set(key, JSON.stringify(value), false);
    return true;
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
    primary: { background: PALETTE.forest, color: "#fff" },
    amber: { background: PALETTE.amber, color: "#fff" },
    ghost: { background: PALETTE.canvasDeep, color: PALETTE.inkSoft },
    danger: { background: PALETTE.danger, color: "#fff" },
    dangerGhost: { background: `${PALETTE.danger}14`, color: PALETTE.danger },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant], padding: "7px 12px", fontSize: 12, fontWeight: 600,
        borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 6,
        cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1,
        fontFamily: PALETTE.fontBody, whiteSpace: "nowrap",
        transition: "all 0.15s ease", ...style,
      }}
    >
      {Icon && <Icon size={13} />}
      {children}
    </button>
  );
}

// Bouton icône circulaire — un seul standard réutilisé partout (34px, cible tactile confortable)
function IconButton({ icon: Icon, onClick, variant = "ghost", size = 34, iconSize = 15, title, color, style, disabled }) {
  const variants = {
    ghost: { background: PALETTE.canvasDeep, color: PALETTE.inkSoft },
    primary: { background: PALETTE.forest, color: "#fff" },
    amber: { background: PALETTE.amber, color: "#fff" },
    subtle: { background: "transparent", color: PALETTE.inkSoft },
  };
  const iconColor = color || variants[variant].color;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        ...variants[variant], width: size, height: size, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "all 0.15s ease", ...style,
      }}
    >
      <Icon size={iconSize} color={iconColor} />
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: PALETTE.labelWeight, letterSpacing: PALETTE.labelTracking, color: PALETTE.inkFaint,
      textTransform: PALETTE.labelCase, marginBottom: 10, display: "flex", alignItems: "center", gap: 6,
    }}>
      <span style={{ width: 14, height: 1.5, background: PALETTE.line, display: "inline-block" }} />
      {children}
    </div>
  );
}

// ---------- Refonte "page Tâches" — scoped à cette page uniquement, 3 thèmes seulement ----------
// Claude n'a volontairement pas d'entrée ici : sa page Tâches reste inchangée (pas de rebrand demandé).
const TASK_PAGE_REBRAND = {
  clairiere: (P) => ({
    wrapBg: `radial-gradient(120% 140% at 12% -25%, #FFFDF3 0%, transparent 55%), ${P.canvasDeep}`,
    wrapRadius: "20px 8px 20px 8px", wrapMargin: "-14px -14px 18px", wrapPadding: "22px 18px 20px",
    headingText: "La clairière du jour", headingColor: P.ink, headingSize: 21, headingWeight: 600,
    headingCase: "none", headingTracking: 0.2,
    subText: "Ce qui pousse, ce qui attend, ce qui est fait.", subColor: P.inkSoft,
    labelVariant: "standard",
  }),
  nike: (P) => ({
    wrapBg: "#111111",
    wrapRadius: "2px", wrapMargin: "-14px -14px 18px", wrapPadding: "24px 18px 22px",
    headingText: "TÂCHES DU JOUR", headingColor: "#FFFFFF", headingSize: 25, headingWeight: 800,
    headingCase: "uppercase", headingTracking: 1.4,
    subText: "NO DAYS OFF", subColor: P.amber,
    labelVariant: "block",
  }),
  apple: (P) => ({
    wrapBg: "transparent",
    wrapRadius: 0, wrapMargin: "0 0 20px", wrapPadding: "4px 0 0",
    headingText: "Aujourd'hui", headingColor: P.ink, headingSize: 28, headingWeight: 700,
    headingCase: "none", headingTracking: -0.3,
    subText: null, subColor: P.inkFaint,
    labelVariant: "minimal",
  }),
};

// Label de section utilisé DANS la page Tâches — variante selon le rebrand actif, sinon SectionLabel standard
function TaskSectionLabel({ children, variant }) {
  if (variant === "block") {
    return (
      <div style={{
        display: "inline-block", background: PALETTE.danger, color: "#fff",
        fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase",
        padding: "4px 10px", marginBottom: 10,
      }}>
        {children}
      </div>
    );
  }
  if (variant === "minimal") {
    return (
      <div style={{ fontSize: 13, fontWeight: 600, color: PALETTE.inkFaint, marginBottom: 10 }}>
        {children}
      </div>
    );
  }
  return <SectionLabel>{children}</SectionLabel>;
}

function EmptyState({ icon: Icon = Trees, title, subtitle }) {
  return (
    <div style={{
      textAlign: "center", padding: "40px 20px", color: PALETTE.inkFaint,
    }}>
      <Icon size={30} color={PALETTE.line} style={{ marginBottom: 10 }} />
      <div style={{ fontSize: 13.5, fontWeight: 600, color: PALETTE.inkSoft }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}

function DragHandle({ onPointerDown }) {
  return (
    <span onPointerDown={onPointerDown} style={{ touchAction: "none", cursor: "grab", padding: 4, display: "flex", alignItems: "center", flexShrink: 0 }}>
      <GripVertical size={13} color={PALETTE.line} />
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
      border: `1.5px solid ${PALETTE.danger}33`, borderRadius: 12, padding: "9px 12px", marginBottom: 14,
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
    <span style={{
      width: size, height: size, borderRadius: isSquare ? size * 0.2 : "50%", flexShrink: 0,
      border: `${isSquare ? 2 : 2}px solid ${done ? PALETTE.forest : PALETTE.line}`,
      background: done ? PALETTE.forest : "transparent",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.15s ease",
    }}>
      {done && <Check size={size * 0.62} color="#fff" strokeWidth={3} />}
    </span>
  );
}

// Badge icône coloré carré arrondi — ancre visuelle claire pour chaque élément
function IconBadge({ icon: Icon, color, size = 36 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: size * 0.32, flexShrink: 0,
      background: `${color}1c`, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={size * 0.5} color={color} strokeWidth={2.2} />
    </span>
  );
}

// Barre de progression fine sous un titre
function ProgressBar({ pct, color, height = 6 }) {
  return (
    <div style={{ height, background: PALETTE.canvasDeep, borderRadius: 99, overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.4s ease" }} />
    </div>
  );
}

function SimpleTaskCard({ item, onToggle, onDelete, onDragStart }) {
  return (
    <div
      style={{
        background: PALETTE.panel, border: `1.5px solid ${PALETTE.line}`,
        borderRadius: 14, padding: "12px 10px 12px 8px", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 10, minHeight: 54,
        transition: "border-color 0.15s ease",
      }}
      onClick={() => onToggle(item.id)}
    >
      <DragHandle onPointerDown={onDragStart} />
      <Checkbox done={item.done} size={21} />
      <span style={{
        fontSize: 14.5, fontWeight: 600, color: item.done ? PALETTE.inkFaint : PALETTE.ink,
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
      style={{
        position: "relative", background: item.done ? `${PALETTE.forest}12` : PALETTE.panel,
        border: `${PALETTE.chipBorderWidth}px solid ${item.done ? PALETTE.forest : PALETTE.line}`,
        borderRadius: PALETTE.missionRadius, padding: "7px 6px", cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        minHeight: 48, boxShadow: item.done ? "none" : PALETTE.chipShadow,
        transition: "all 0.15s ease",
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
          width: 15, height: 15, borderRadius: squareCheckbox ? 3 : "50%", background: PALETTE.danger,
          border: `1.5px solid ${PALETTE.canvas}`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <X size={9} color="#fff" strokeWidth={3} />
        </span>
      </button>
      <Checkbox done={item.done} size={13} />
      <span style={{
        fontSize: 9.5, fontWeight: 600, color: item.done ? PALETTE.inkFaint : PALETTE.ink,
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
    <button onClick={onClick} title={title} style={{
      background: done ? `${color}18` : PALETTE.panel,
      border: `${PALETTE.chipBorderWidth}px solid ${done ? color : PALETTE.line}`,
      borderRadius: PALETTE.chipRadius, padding: 0, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, width: PALETTE.chipSize, height: PALETTE.chipSize,
      boxShadow: done ? "none" : PALETTE.chipShadow,
      transition: "all 0.15s ease",
    }}>
      {done ? <CheckCircle2 size={15} color={color} /> : <Icon size={15} color={PALETTE.inkFaint} />}
    </button>
  );
}

function DossierCard({ dossier, index, onOpen, onDelete, onDragStart }) {
  const pct = dossierPct(dossier);
  const color = colorForIndex(index);
  const taskCount = dossier.tasks.reduce((a, t) => a + (t.subtasks?.length || 1), 0);
  return (
    <div
      style={{
        background: PALETTE.panel, border: `1.5px solid ${PALETTE.line}`,
        borderRadius: 16, padding: "12px 12px 12px 10px", cursor: "pointer",
        display: "flex", flexDirection: "column", gap: 10,
      }}
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
  const rebrand = TASK_PAGE_REBRAND[themeId] ? TASK_PAGE_REBRAND[themeId](PALETTE) : null;

  return (
    <div>
      {rebrand && (
        <div style={{ background: rebrand.wrapBg, borderRadius: rebrand.wrapRadius, margin: rebrand.wrapMargin, padding: rebrand.wrapPadding }}>
          <div style={{
            fontFamily: PALETTE.fontDisplay, fontSize: rebrand.headingSize, fontWeight: rebrand.headingWeight,
            color: rebrand.headingColor, textTransform: rebrand.headingCase, letterSpacing: rebrand.headingTracking,
          }}>
            {rebrand.headingText}
          </div>
          {rebrand.subText && (
            <div style={{ fontSize: 11.5, fontWeight: 600, color: rebrand.subColor, marginTop: 4, letterSpacing: rebrand.headingCase === "uppercase" ? 1 : 0 }}>
              {rebrand.subText}
            </div>
          )}
        </div>
      )}

      {/* ---- Hebdo (toggle icônes, groupée avec petites séparations) ---- */}
      <div style={{ marginBottom: 16 }}>
        <TaskSectionLabel variant={rebrand?.labelVariant}>Hebdo</TaskSectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 4, overflowX: "auto", padding: "2px 5px 5px 2px" }}>
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
      <div style={{ marginBottom: 16 }}>
        <TaskSectionLabel variant={rebrand?.labelVariant}>Daily</TaskSectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 4, overflowX: "auto", padding: "2px 5px 5px 2px" }}>
          {daily.groups.map((g, gi) => {
            const color = g.color || PALETTE.amber;
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
            <TaskSectionLabel variant={rebrand?.labelVariant}>Missions</TaskSectionLabel>
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
              gridStyle={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}
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
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
        <div>
          <h1 style={{ fontFamily: PALETTE.fontDisplay, fontSize: 24, fontWeight: 700, color: PALETTE.ink, margin: 0 }}>Dossiers</h1>
          <p style={{ fontSize: 12, color: PALETTE.inkFaint, margin: "3px 0 0" }}>{doneCount} / {dossiers.length} terminés</p>
        </div>
        <PillButton variant="ghost" icon={RotateCcw} onClick={onResetOrder}>Ordre A→Z</PillButton>
      </div>

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
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {Icon && <Icon size={14} color={color} />}
        <span style={{ fontSize: 11, fontWeight: 600, color: PALETTE.inkSoft, flex: 1 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{current}/{max}</span>
      </div>
      <div style={{ height: 6, background: PALETTE.canvasDeep, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.4s ease" }} />
      </div>
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

  const card = { background: PALETTE.panel, border: `1.5px solid ${PALETTE.line}`, borderRadius: 16, padding: 14 };

  return (
    <div>
      <h1 style={{ fontFamily: PALETTE.fontDisplay, fontSize: 24, fontWeight: 700, color: PALETTE.ink, margin: "0 0 16px" }}>Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div style={card}><BarRow label="Tâches" current={totalDone} max={totalCount || 1} color={PALETTE.amber} icon={ListChecks} /></div>
        <div style={card}><BarRow label="Hebdo" current={weekDone} max={weekTotal || 1} color={PALETTE.forest} icon={CalendarDays} /></div>
        <div style={card}><BarRow label="Daily" current={dailyDone} max={dailyTotal || 1} color={PALETTE.berry} icon={Zap} /></div>
        <div style={card}><BarRow label="Mensuelle" current={monthlyDone} max={monthlyTotal || 1} color={PALETTE.sky} icon={CalendarRange} /></div>
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Mail size={14} color={PALETTE.clay} />
            <span style={{ fontSize: 11, fontWeight: 600, color: PALETTE.inkSoft, flex: 1 }}>Email</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: PALETTE.clay }}>{emailTotal}</span>
          </div>
          <div style={{ fontSize: 10.5, color: PALETTE.inkFaint, marginTop: 4 }}>action{emailTotal > 1 ? "s" : ""} à traiter</div>
        </div>
      </div>

      {state.dossiers.length > 0 && (
        <div style={card}>
          <SectionLabel>Dossiers actifs</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: 8 }}>
            {state.dossiers.map((d, i) => {
              const pct = dossierPct(d);
              return (
                <div key={d.id} style={{ textAlign: "center" }}>
                  <ProgressRing pct={pct} color={colorForIndex(i)} size={38} />
                  <div style={{ fontSize: 10, fontWeight: 600, color: PALETTE.ink, marginTop: 5, wordBreak: "break-word" }}>{d.name}</div>
                  <div style={{ fontSize: 9, color: PALETTE.inkFaint }}>{pct}%</div>
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
      <h1 style={{ fontFamily: PALETTE.fontDisplay, fontSize: 24, fontWeight: 700, color: PALETTE.ink, margin: 0 }}>Quotidien</h1>
      <p style={{ fontSize: 12, color: PALETTE.inkFaint, margin: "3px 0 18px" }}>{done} / {total} · rituels du jour</p>
      {daily.groups.map((g) => {
        const Icon = getIcon(g.icon);
        const color = g.color || PALETTE.amber;
        return (
          <div key={g.id} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Icon size={14} color={color} />
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, color, textTransform: "uppercase" }}>{g.name}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 7 }}>
              {g.tasks.map((t) => {
                const TaskIcon = getIcon(t.icon);
                return (
                  <div key={t.id} onClick={() => onToggleTask(g.id, t.id)} style={{
                    background: t.done ? `${color}14` : PALETTE.panel,
                    border: `1.5px solid ${t.done ? color : PALETTE.line}`,
                    borderRadius: PALETTE.radiusChip, padding: "11px 8px", cursor: "pointer",
                    textAlign: "center", transition: "all 0.15s ease",
                  }}>
                    <TaskIcon size={17} color={t.done ? color : PALETTE.inkFaint} />
                    <div style={{ fontSize: 11, fontWeight: 600, color: t.done ? color : PALETTE.ink, marginTop: 5, textDecoration: t.done ? "line-through" : "none", wordBreak: "break-word" }}>{t.title}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
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
      <h1 style={{ fontFamily: PALETTE.fontDisplay, fontSize: 24, fontWeight: 700, color: PALETTE.ink, margin: 0 }}>Hebdo</h1>
      <p style={{ fontSize: 12, color: PALETTE.inkFaint, margin: "3px 0 18px" }}>{done} / {total} · lundi → dimanche</p>
      {weekly.groups.map((g) => {
        const GroupIcon = WEEK_ICONS[g.name] || Circle;
        const color = groupColors[g.name] || PALETTE.forest;
        return (
          <div key={g.id} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <GroupIcon size={14} color={color} />
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, color, textTransform: "uppercase" }}>{g.name}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: 7 }}>
              {g.tasks.map((t) => {
                const TaskIcon = getIcon(t.icon);
                return (
                  <div key={t.id} onClick={() => onToggleTask(g.id, t.id)} style={{
                    background: t.done ? `${color}14` : PALETTE.panel,
                    border: `1.5px solid ${t.done ? color : PALETTE.line}`,
                    borderRadius: PALETTE.radiusChip, padding: "12px 6px", cursor: "pointer",
                    textAlign: "center", transition: "all 0.15s ease",
                  }}>
                    {t.done ? <CheckCircle2 size={17} color={color} /> : <TaskIcon size={17} color={PALETTE.inkFaint} />}
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: t.done ? color : PALETTE.ink, marginTop: 5, textDecoration: t.done ? "line-through" : "none", wordBreak: "break-word" }}>{t.title}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SportView({ sport, onOpenDossier }) {
  return (
    <div>
      <h1 style={{ fontFamily: PALETTE.fontDisplay, fontSize: 24, fontWeight: 700, color: PALETTE.ink, margin: "0 0 16px" }}>Sport</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
        {sport.dossiers.map((d, i) => {
          const pct = dossierPct(d);
          const color = colorForIndex(i);
          return (
            <div key={d.id} onClick={() => onOpenDossier(d.id)} style={{
              background: PALETTE.panel, border: `1.5px solid ${color}40`, borderRadius: PALETTE.radiusCardLg,
              padding: "13px", cursor: "pointer",
            }}>
              <ProgressRing pct={pct} color={color} size={30} />
              <div style={{ fontFamily: PALETTE.fontDisplay, fontWeight: 600, fontSize: 15, color: PALETTE.ink, marginTop: 8 }}>{d.name}</div>
              <div style={{ fontSize: 11, color: PALETTE.inkFaint, marginTop: 2 }}>{d.tasks.length} tâches · {pct}%</div>
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
      <h1 style={{ fontFamily: PALETTE.fontDisplay, fontSize: 24, fontWeight: 700, color: PALETTE.ink, margin: 0 }}>Mensuelle</h1>
      <p style={{ fontSize: 12, color: PALETTE.inkFaint, margin: "3px 0 18px" }}>{done} / {total} · rituels du mois</p>
      {monthly.groups.map((g) => {
        const Icon = getIcon(g.icon);
        const color = g.color || PALETTE.amber;
        return (
          <div key={g.id} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Icon size={14} color={color} />
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, color, textTransform: "uppercase" }}>{g.name}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 7 }}>
              {g.tasks.map((t) => {
                const TaskIcon = getIcon(t.icon);
                return (
                  <div key={t.id} onClick={() => onToggleTask(g.id, t.id)} style={{
                    background: t.done ? `${color}14` : PALETTE.panel,
                    border: `1.5px solid ${t.done ? color : PALETTE.line}`,
                    borderRadius: PALETTE.radiusChip, padding: "11px 8px", cursor: "pointer",
                    textAlign: "center", transition: "all 0.15s ease",
                  }}>
                    <TaskIcon size={17} color={t.done ? color : PALETTE.inkFaint} />
                    <div style={{ fontSize: 11, fontWeight: 600, color: t.done ? color : PALETTE.ink, marginTop: 5, textDecoration: t.done ? "line-through" : "none", wordBreak: "break-word" }}>{t.title}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
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

function NavRow({ items, view, dossierReturnView, onSelect }) {
  return (
    <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 6 }}>
      {items.map(({ id, label, icon: Icon }) => {
        const active = view === id || (view === "dossier" && dossierReturnView === id);
        return (
          <button key={id} onClick={() => onSelect(id)} style={{
            background: active ? PALETTE.forest : "transparent",
            color: active ? "#fff" : PALETTE.inkSoft,
            padding: "7px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
            whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
            transition: "all 0.15s ease", flexShrink: 0,
          }}>
            <Icon size={13} />{label}
          </button>
        );
      })}
    </div>
  );
}

function DomainView({ domainId }) {
  const domain = DOMAINES[domainId];
  const [expandedUnivers, setExpandedUnivers] = useState({});
  const [objectifs, setObjectifs] = useState(domain ? domain.univers.map(u => ({ name: u.name, items: u.objectifs })) : []);

  if (!domain) return null;
  const Icon = domain.icon;

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
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <IconBadge icon={Icon} color={domain.color} size={40} />
        <h1 style={{ fontFamily: PALETTE.fontDisplay, fontSize: 24, fontWeight: 700, color: PALETTE.ink, margin: 0 }}>{domain.name}</h1>
      </div>
      <p style={{ fontSize: 12, color: PALETTE.inkFaint, margin: "0 0 18px" }}>Domaine de vie · {objectifs.length} univers</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {objectifs.map((u) => {
          const isExpanded = expandedUnivers[u.name];
          return (
            <div key={u.name}>
              <button
                onClick={() => toggleUnivers(u.name)}
                style={{
                  width: "100%", background: PALETTE.panel, border: `1.5px solid ${PALETTE.line}`, borderRadius: 14,
                  padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: domain.color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: PALETTE.ink, flex: 1, textAlign: "left" }}>{u.name}</span>
                <ChevronRight size={16} color={PALETTE.inkFaint} style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }} />
              </button>

              {isExpanded && (
                <div style={{ paddingLeft: 20, paddingTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {u.items.map((obj) => (
                    <div key={obj.id} style={{
                      background: PALETTE.canvasDeep, border: `1px solid ${PALETTE.line}`, borderRadius: 10,
                      padding: "10px 12px", fontSize: 13, color: PALETTE.ink,
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                    }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: domain.color, flexShrink: 0 }} />
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
      <div onClick={onToggle} style={{
        background: PALETTE.canvasDeep, border: `1px solid ${PALETTE.line}`, borderRadius: 10,
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
      <div onClick={onToggle} style={{
        background: PALETTE.panel, border: `${PALETTE.chipBorderWidth}px solid ${PALETTE.line}`, borderRadius: PALETTE.radiusCard,
        padding: "8px 8px 8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, minHeight: 52,
      }}>
        <Checkbox done={task.done} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: task.done ? PALETTE.inkFaint : PALETTE.ink, textDecoration: task.done ? "line-through" : "none", wordBreak: "break-word" }}>{task.title}</div>
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
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <IconButton icon={ChevronLeft} variant="ghost" size={36} iconSize={16} onClick={onBack} title="Retour" />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: PALETTE.fontDisplay, fontSize: 20, fontWeight: 700, color: PALETTE.ink, margin: 0 }}>{dossier.name}</h1>
          <p style={{ fontSize: 12, color: PALETTE.inkFaint, margin: "2px 0 0" }}>{done} / {total}</p>
        </div>
        <PillButton variant="primary" icon={Plus} onClick={() => onAddTask(dossier.id)}>Tâche</PillButton>
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
      <button onClick={() => setExpanded(!expanded)} style={{
        width: "100%", background: PALETTE.panel, border: `1.5px solid ${group.color}40`,
        borderRadius: 14, padding: "12px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", minHeight: 52,
      }}>
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
            <div key={it.id} style={{ background: `${group.color}0a`, border: `1px solid ${group.color}25`, borderRadius: 12, padding: "10px 6px 10px 12px", display: "flex", alignItems: "flex-start", gap: 6 }}>
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
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontFamily: PALETTE.fontDisplay, fontSize: 24, fontWeight: 700, color: PALETTE.ink, margin: 0 }}>Email</h1>
          <p style={{ fontSize: 11.5, color: PALETTE.inkFaint, margin: "3px 0 0" }}>
            {lastScan ? `Scanné ${new Date(lastScan).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}` : "Jamais scanné"}
          </p>
        </div>
        <PillButton variant="primary" icon={scanning ? Loader2 : Mail} onClick={onScan} disabled={scanning}>
          {scanning ? "Scan 30j..." : "Scanner 30j"}
        </PillButton>
      </div>
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
    name: "Vitalité", icon: Heart, color: PALETTE.sage,
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
    name: "Études", icon: BookOpen, color: PALETTE.sky,
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
    name: "Passions", icon: Sparkles, color: PALETTE.berry,
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
    name: "Modèles Économiques", icon: TrendingUp, color: PALETTE.clay,
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
    name: "Gestion", icon: Wallet, color: PALETTE.forest,
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
      if (th && THEMES[th]) { applyTheme(th); setThemeId(th); }
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
    <div style={{ background: PALETTE.canvas, fontFamily: PALETTE.fontBody, minHeight: "100vh" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: ${PALETTE.line}; border-radius: 6px; }
        .clairiere-main { width: 100%; min-height: 100vh; min-height: 100dvh; padding: 14px 14px 84px; overflow-y: auto; max-width: 760px; margin: 0 auto; }
        @media (min-width: 600px) { .clairiere-main { padding: 22px 22px 92px; } }
        button { font-family: inherit; border: none; background: none; cursor: pointer; }
        input:focus { outline: none; }
      `}</style>

      {/* Header + Nav */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: `${PALETTE.canvas}f2`, backdropFilter: "blur(8px)", borderBottom: `1px solid ${PALETTE.line}` }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "12px 14px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, position: "relative" }}>
            <button
              onClick={() => setView("dashboard")}
              style={{
                background: view === "dashboard" ? PALETTE.forest : "transparent",
                color: view === "dashboard" ? "#fff" : PALETTE.forest,
                padding: "7px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.15s ease", flexShrink: 0, border: "none", cursor: "pointer",
              }}
            >
              <Trees size={16} />
              <span style={{ fontFamily: PALETTE.fontDisplay, fontWeight: 600, fontSize: 15, letterSpacing: 0.2 }}>Clairière</span>
            </button>
            <button
              onClick={() => setView("tasks")}
              style={{
                background: view === "tasks" ? PALETTE.forest : "transparent",
                color: view === "tasks" ? "#fff" : PALETTE.forest,
                padding: "7px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.15s ease", flexShrink: 0, border: "none", cursor: "pointer",
              }}
            >
              <ListChecks size={16} />
              <span style={{ fontFamily: PALETTE.fontDisplay, fontWeight: 600, fontSize: 15, letterSpacing: 0.2 }}>Tâches</span>
            </button>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => setThemePickerOpen((o) => !o)}
              title="Changer le style visuel"
              style={{
                width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                border: `1.5px solid ${PALETTE.line}`, background: PALETTE.panel,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}
            >
              <span style={{ width: 14, height: 14, borderRadius: "50%", background: `conic-gradient(${THEMES.clairiere.swatch}, ${THEMES.nike.swatch}, ${THEMES.apple.swatch}, ${THEMES.claude.swatch})` }} />
            </button>
            {themePickerOpen && (
              <div style={{
                position: "absolute", top: 40, right: 0, zIndex: 60,
                background: PALETTE.panel, border: `1.5px solid ${PALETTE.line}`, borderRadius: 14,
                boxShadow: "0 14px 34px rgba(0,0,0,0.16)", padding: 8, minWidth: 180,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: PALETTE.inkFaint, textTransform: "uppercase", padding: "4px 8px 6px" }}>Style visuel</div>
                {Object.entries(THEMES).map(([id, t]) => (
                  <button
                    key={id}
                    onClick={() => changeTheme(id)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 9,
                      padding: "9px 8px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                      color: PALETTE.ink, background: themeId === id ? PALETTE.canvasDeep : "transparent",
                      textAlign: "left", minHeight: 38,
                    }}
                  >
                    <span style={{ width: 14, height: 14, borderRadius: "50%", background: t.swatch, flexShrink: 0, border: `1.5px solid ${PALETTE.line}` }} />
                    {t.label}
                    {themeId === id && <Check size={12} color={PALETTE.forest} style={{ marginLeft: "auto" }} />}
                  </button>
                ))}
              </div>
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
        background: PALETTE.panel, border: `1.5px solid ${PALETTE.line}`, borderRadius: 999,
        padding: "6px 6px 6px 8px", display: "flex", gap: 6, alignItems: "center", zIndex: 100,
        boxShadow: "0 10px 30px rgba(31,42,30,0.12)",
      }}>
        <button onClick={() => setChatOpen((o) => !o)} style={{ width: 36, height: 36, borderRadius: "50%", background: PALETTE.canvasDeep, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <StatusDot status={assistantStatus} />
        </button>
        <input
          value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ajoute une tâche ou un dossier..."
          style={{ flex: 1, border: "none", background: "transparent", fontSize: 14, color: PALETTE.ink, minWidth: 0 }}
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
        <div style={{
          position: "fixed", top: 70, right: 12, width: "min(300px, 88vw)", maxHeight: "55vh",
          background: PALETTE.panel, border: `1.5px solid ${PALETTE.line}`, borderRadius: 18,
          boxShadow: "0 22px 50px rgba(31,42,30,0.22)", zIndex: 200, display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ padding: "10px 10px 10px 14px", borderBottom: `1px solid ${PALETTE.line}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: PALETTE.canvasDeep }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: PALETTE.ink, display: "flex", alignItems: "center", gap: 6 }}>
              <StatusDot status={assistantStatus} /> Assistant
            </span>
            <IconButton icon={X} variant="subtle" size={30} iconSize={14} onClick={() => setChatOpen(false)} title="Fermer" />
          </div>
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 7 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%",
                background: m.role === "user" ? PALETTE.forest : PALETTE.canvasDeep,
                color: m.role === "user" ? "#fff" : PALETTE.ink,
                borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                padding: "8px 11px", fontSize: 12, lineHeight: 1.4,
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
