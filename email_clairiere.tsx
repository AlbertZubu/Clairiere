import React, { useState } from "react";
import { ChevronDown, ChevronRight, X, Mail, Loader2, Sparkles, Plus } from "lucide-react";

const PALETTE = {
  canvas: "#F7F3E9",
  panel: "#FFFFFF",
  ink: "#1F2A1E",
  inkSoft: "#5C6B54",
  inkFaint: "#66735E",
  line: "#DFD5B8",
  lineSoft: "#EAE2CC",
  forest: "#2C4A32",
  amber: "#C68A3D",
  clay: "#B5674A",
  sky: "#4E7789",
  sage: "#7C9473",
  berry: "#93516A",
  fontDisplay: "'Fraunces', serif",
  fontBody: "'Public Sans', sans-serif",
};

function IconButton({ icon: Icon, onClick, variant = "ghost", size = 34, iconSize = 13, title }) {
  const variants = {
    ghost: { background: "#EFE7D2", color: PALETTE.inkSoft },
    subtle: { background: "transparent", color: PALETTE.inkSoft },
  };
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        ...variants[variant],
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "all 0.15s ease",
        border: "none",
        cursor: "pointer",
      }}
    >
      <Icon size={iconSize} color={variants[variant].color} />
    </button>
  );
}

function NavBarButton({ label, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        fontSize: 11,
        fontWeight: 600,
        borderRadius: 6,
        background: PALETTE.forest,
        color: "#fff",
        border: "none",
        cursor: "pointer",
        fontFamily: PALETTE.fontBody,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        transition: "all 0.15s ease",
      }}
    >
      {Icon && <Icon size={11} />}
      {label}
    </button>
  );
}

function PlanningBadge({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 8px",
        fontSize: 9,
        fontWeight: 600,
        borderRadius: 16,
        border: `1px solid ${active ? PALETTE.forest : PALETTE.line}`,
        background: active ? PALETTE.forest : "transparent",
        color: active ? "#fff" : PALETTE.inkSoft,
        cursor: "pointer",
        fontFamily: PALETTE.fontBody,
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
        minWidth: 28,
      }}
    >
      {label}
    </button>
  );
}

function EmptyState({ icon: Icon = Sparkles, title, subtitle }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: PALETTE.inkFaint }}>
      <Icon size={30} color={PALETTE.line} style={{ marginBottom: 10 }} />
      <div style={{ fontSize: 13.5, fontWeight: 600, color: PALETTE.inkSoft }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}

function TaskItem({ task, group, onDismiss, onToggleSubtask, onSetPlanning, onAddSubtask }) {
  const [expanded, setExpanded] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState("");
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  const handleAddSubtask = () => {
    if (newSubtaskText.trim()) {
      onAddSubtask(task.id, newSubtaskText);
      setNewSubtaskText("");
    }
  };

  const planningLabel = {
    this_week: "Sem.",
    next_week: "Proch.",
    one_month: "Mois",
  };

  return (
    <div style={{ marginBottom: 6 }}>
      <div
        style={{
          background: PALETTE.panel,
          border: `1px solid ${group.color}30`,
          borderRadius: 8,
          padding: "6px 8px",
          transition: "all 0.15s ease",
          display: "flex",
          alignItems: "center",
          gap: 8,
          minHeight: 32,
        }}
      >
        <input
          type="checkbox"
          style={{ cursor: "pointer", width: 14, height: 14, flexShrink: 0 }}
          onChange={() => onToggleSubtask(task.id, "main")}
          checked={task.completed}
        />
        <div
          style={{
            fontWeight: 600,
            fontSize: 12,
            color: task.completed ? PALETTE.inkFaint : PALETTE.ink,
            textDecoration: task.completed ? "line-through" : "none",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {task.title}
        </div>

        {/* Infos compactes */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          {hasSubtasks && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "2px 4px",
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                color: PALETTE.inkFaint,
                fontSize: 10,
                fontWeight: 600,
                minWidth: "fit-content",
              }}
            >
              {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              {task.subtasks.length}
            </button>
          )}
          <button
            onClick={() => setExpanded(true)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "2px 4px",
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
              color: PALETTE.sky,
              fontSize: 10,
              fontWeight: 600,
              minWidth: "fit-content",
            }}
          >
            <Plus size={10} />
          </button>
        </div>

        {/* Planning badges compressés */}
        <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
          <PlanningBadge
            label="S"
            active={task.planning === "this_week"}
            onClick={() => onSetPlanning(task.id, task.planning === "this_week" ? null : "this_week")}
          />
          <PlanningBadge
            label="P"
            active={task.planning === "next_week"}
            onClick={() => onSetPlanning(task.id, task.planning === "next_week" ? null : "next_week")}
          />
          <PlanningBadge
            label="M"
            active={task.planning === "one_month"}
            onClick={() => onSetPlanning(task.id, task.planning === "one_month" ? null : "one_month")}
          />
        </div>

        <IconButton
          icon={X}
          variant="subtle"
          size={24}
          iconSize={11}
          onClick={() => onDismiss(task.id)}
          title="Ignorer"
        />
      </div>

      {hasSubtasks && expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 6, marginTop: 4, borderLeft: `2px solid ${group.color}` }}>
          {task.subtasks.map((sub, idx) => (
            <div
              key={idx}
              style={{
                background: `${group.color}08`,
                border: `1px solid ${group.color}20`,
                borderRadius: 6,
                padding: "4px 6px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                minHeight: 26,
              }}
            >
              <input
                type="checkbox"
                style={{ cursor: "pointer", width: 12, height: 12, flexShrink: 0 }}
                onChange={() => onToggleSubtask(task.id, idx)}
                checked={sub.completed}
              />
              <div
                style={{
                  flex: 1,
                  fontSize: 11,
                  color: sub.completed ? PALETTE.inkFaint : PALETTE.ink,
                  textDecoration: sub.completed ? "line-through" : "none",
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {sub.title}
              </div>
            </div>
          ))}

          {/* Input nouvelle sous-tâche */}
          <div style={{ display: "flex", gap: 4, paddingTop: 4 }}>
            <input
              type="text"
              placeholder="Sous..."
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddSubtask()}
              style={{
                flex: 1,
                padding: "3px 6px",
                fontSize: 11,
                border: `1px solid ${group.color}30`,
                borderRadius: 6,
                fontFamily: PALETTE.fontBody,
                color: PALETTE.ink,
                minHeight: 24,
              }}
            />
            <button
              onClick={handleAddSubtask}
              style={{
                padding: "3px 8px",
                fontSize: 10,
                fontWeight: 600,
                background: group.color,
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: PALETTE.fontBody,
                whiteSpace: "nowrap",
              }}
            >
              Ok
            </button>
          </div>
        </div>
      )}

      {!hasSubtasks && expanded && (
        <div style={{ display: "flex", gap: 4, paddingLeft: 6, marginTop: 4, borderLeft: `2px solid ${group.color}` }}>
          <input
            type="text"
            placeholder="Sous..."
            value={newSubtaskText}
            onChange={(e) => setNewSubtaskText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddSubtask()}
            style={{
              flex: 1,
              padding: "3px 6px",
              fontSize: 11,
              border: `1px solid ${group.color}30`,
              borderRadius: 6,
              fontFamily: PALETTE.fontBody,
              color: PALETTE.ink,
              minHeight: 24,
            }}
          />
          <button
            onClick={handleAddSubtask}
            style={{
              padding: "3px 8px",
              fontSize: 10,
              fontWeight: 600,
              background: group.color,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontFamily: PALETTE.fontBody,
              whiteSpace: "nowrap",
            }}
          >
            Ok
          </button>
        </div>
      )}
    </div>
  );
}

function SenderGroup({ group, tasks, onDismiss, onToggleSubtask, onSetPlanning, onAddSubtask }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          background: PALETTE.panel,
          border: `1px solid ${group.color}30`,
          borderRadius: 8,
          padding: "6px 8px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          minHeight: 36,
          transition: "all 0.15s ease",
        }}
      >
        <Mail size={13} color={group.color} />
        <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: PALETTE.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {group.sender}
          </div>
          <div style={{ fontSize: 9.5, color: PALETTE.inkFaint }}>
            {tasks.length} tâche{tasks.length > 1 ? "s" : ""}
          </div>
        </div>
        {expanded ? (
          <ChevronDown size={13} color={PALETTE.inkFaint} />
        ) : (
          <ChevronRight size={13} color={PALETTE.inkFaint} />
        )}
      </button>

      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 6, marginTop: 4 }}>
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              group={group}
              onDismiss={onDismiss}
              onToggleSubtask={onToggleSubtask}
              onSetPlanning={onSetPlanning}
              onAddSubtask={onAddSubtask}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClairierEmailInbox() {
  const [tasks, setTasks] = useState([
    {
      id: "task_1",
      title: "Payer Sonderzuführung WEG Urbanstraße 126€",
      sender: "Residea",
      color: "#9B59B6",
      completed: false,
      planning: null,
      subtasks: [],
    },
    {
      id: "task_2",
      title: "Examiner appel de fond travaux 12 Moustier",
      sender: "Hussénot Arnaud",
      color: "#E74C3C",
      completed: false,
      planning: null,
      subtasks: [],
    },
    {
      id: "task_3",
      title: "Préparer déclaration impôts 2025 (Deadline 31/07)",
      sender: "Revolut",
      color: "#F39C12",
      completed: false,
      planning: "this_week",
      subtasks: [],
    },
    {
      id: "task_4",
      title: "Vérifier et mettre à jour compte Airbnb",
      sender: "Airbnb",
      color: "#3498DB",
      completed: false,
      planning: null,
      subtasks: [],
    },
    {
      id: "task_5",
      title: "Désigner plateforme réception factures électroniques",
      sender: "Trésor Public",
      color: "#E67E22",
      completed: false,
      planning: "this_week",
      subtasks: [],
    },
    {
      id: "task_6",
      title: "Consulter protocole AG WEG Urbanstraße 02/06",
      sender: "Residea",
      color: "#9B59B6",
      completed: false,
      planning: null,
      subtasks: [],
    },
    {
      id: "task_7",
      title: "Étudier autorisations construction Gewerbefläche TE 27",
      sender: "Residea",
      color: "#9B59B6",
      completed: false,
      planning: "one_month",
      subtasks: [],
    },
    {
      id: "task_8",
      title: "Valider itinéraire Provence 14-15 novembre",
      sender: "Héloïse Daniel (CEA)",
      color: "#27AE60",
      completed: false,
      planning: "one_month",
      subtasks: [],
    },
    {
      id: "task_9",
      title: "Confirmer accès musée impressionnistes Giverny 28 mai",
      sender: "Héloïse Daniel (CEA)",
      color: "#27AE60",
      completed: false,
      planning: null,
      subtasks: [],
    },
    {
      id: "task_10",
      title: "Confirmer détails Chantilly daytrip samedi 6 juin",
      sender: "CEA CAPA Staff",
      color: "#27AE60",
      completed: false,
      planning: "this_week",
      subtasks: [],
    },
    {
      id: "task_11",
      title: "Vérifier réception vouchers VSP PFNN60608",
      sender: "Back-Roads",
      color: "#1ABC9C",
      completed: false,
      planning: "this_week",
      subtasks: [],
    },
    {
      id: "task_12",
      title: "Consulter Performance Management reviews",
      sender: "Back-Roads",
      color: "#1ABC9C",
      completed: false,
      planning: "next_week",
      subtasks: [],
    },
    {
      id: "task_13",
      title: "Étudier assurance immeuble 12 Moustier",
      sender: "Hussénot Arnaud",
      color: "#E74C3C",
      completed: false,
      planning: null,
      subtasks: [],
    },
    {
      id: "task_14",
      title: "Participer AG extraordinaire WEG Urbanstraße 07/07",
      sender: "Residea",
      color: "#9B59B6",
      completed: false,
      planning: "this_week",
      subtasks: [],
    },
  ]);

  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(new Date().toISOString());

  // Grouper les tâches par expéditeur
  const groupedTasks = tasks.reduce((acc, task) => {
    const existing = acc.find((g) => g.sender === task.sender);
    if (existing) {
      existing.tasks.push(task);
    } else {
      acc.push({ sender: task.sender, color: task.color, tasks: [task] });
    }
    return acc;
  }, []);

  const handleScan = async () => {
    setScanning(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLastScan(new Date().toISOString());
    setScanning(false);
  };

  const dismissTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleSubtask = (taskId, subtaskIdx) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          if (subtaskIdx === "main") {
            return { ...t, completed: !t.completed };
          } else {
            return {
              ...t,
              subtasks: t.subtasks.map((sub, idx) =>
                idx === subtaskIdx ? { ...sub, completed: !sub.completed } : sub
              ),
            };
          }
        }
        return t;
      })
    );
  };

  const setPlanning = (taskId, planning) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, planning } : t))
    );
  };

  const addSubtask = (taskId, subtaskText) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, subtasks: [...t.subtasks, { title: subtaskText, completed: false }] } : t
      )
    );
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;

  return (
    <div style={{ background: PALETTE.canvas, fontFamily: PALETTE.fontBody, minHeight: "100vh" }}>
      {/* Navigation bar */}
      <div style={{ background: PALETTE.panel, borderBottom: `1px solid ${PALETTE.line}`, padding: "8px 16px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <h1 style={{ fontFamily: PALETTE.fontDisplay, fontSize: 16, fontWeight: 700, color: PALETTE.ink, margin: 0 }}>
            Email
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <NavBarButton
              label="Scanner emails"
              icon={scanning ? Loader2 : Mail}
              onClick={handleScan}
            />
            <NavBarButton
              label="Ajouter tâche"
              icon={Plus}
              onClick={() => {
                const title = prompt("Titre de la tâche :");
                if (title) {
                  setTasks([
                    ...tasks,
                    {
                      id: `task_${Date.now()}`,
                      title,
                      sender: prompt("Expéditeur :") || "Manuel",
                      color: "#34495E",
                      completed: false,
                      planning: null,
                      subtasks: [],
                    },
                  ]);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "12px 16px", maxWidth: 760, margin: "0 auto" }}>
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 10, color: PALETTE.inkFaint, margin: "0 0 2px" }}>
            {completedTasks}/{totalTasks} tâches complétées
          </p>
          <p style={{ fontSize: 9, color: PALETTE.inkFaint, margin: 0 }}>
            {lastScan
              ? `Scanné ${new Date(lastScan).toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Jamais scanné"}
          </p>
        </div>

        {groupedTasks.length === 0 && <EmptyState icon={Sparkles} title="Inbox propre" subtitle="Aucune tâche en attente" />}

        {groupedTasks.map((group) => (
          <SenderGroup
            key={group.sender}
            group={group}
            tasks={group.tasks}
            onDismiss={dismissTask}
            onToggleSubtask={toggleSubtask}
            onSetPlanning={setPlanning}
            onAddSubtask={addSubtask}
          />
        ))}
      </div>
    </div>
  );
}
