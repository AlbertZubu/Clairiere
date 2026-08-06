// ============================================================
// Dictée vocale — capture micro + appels au backend
// ------------------------------------------------------------
// Logique pure, sans JSX : les composants visuels vivent dans
// Clairiere.jsx, où le thème (PALETTE) est disponible.
//
// Chaîne complète d'une dictée :
//   micro -> MediaRecorder (webm/opus) -> POST /api/transcribe
//   -> whisper.cpp local -> texte -> POST /api/structure
//   -> gemma3:4b local -> { title, subtasks }
// Rien ne sort du Pi.
// ============================================================
import { useCallback, useRef, useState } from "react";

// Les navigateurs n'ouvrent le micro que dans un « contexte sécurisé ».
// En http:// sur une IP, `navigator.mediaDevices` est carrément absent :
// il faut le dire clairement plutôt que d'échouer en silence.
export function micUnavailableReason() {
  if (typeof window === "undefined") return "unsupported";
  if (!window.isSecureContext) return "insecure";
  if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
  if (typeof MediaRecorder === "undefined") return "unsupported";
  return null;
}

export const MIC_HELP = {
  insecure: "Micro bloqué en http — touche « Passer en HTTPS » en haut de l'écran.",
  unsupported: "Ce navigateur ne permet pas d'enregistrer.",
  denied: "Micro refusé. Autorise-le dans les réglages du site.",
  failed: "L'enregistrement a échoué.",
};

// Même hôte, même page, mais en https — la seule chose qui débloque vraiment
// le micro. Depuis l'accès direct au port 4000 (Express, en clair), le chemin
// est `/` : on vise explicitement /clairiere/, servi par nginx qui porte le TLS.
export function httpsTarget() {
  const { hostname, pathname, search, hash } = window.location;
  const path = pathname.startsWith("/clairiere") ? pathname : "/clairiere/";
  return `https://${hostname}${path}${search}${hash}`;
}

function pickMimeType() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return candidates.find((t) => MediaRecorder.isTypeSupported?.(t)) || "";
}

// Enregistre tant que le bouton est maintenu ; `stop()` rend le blob audio.
export function useVoiceCapture() {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);

  // Rend null si l'enregistrement a démarré, sinon la cause de l'échec
  // (clé de MIC_HELP). Passer par l'état `error` ne marcherait pas : l'appelant
  // le relirait périmé, juste après l'await.
  const start = useCallback(async () => {
    const reason = micUnavailableReason();
    if (reason) { setError(reason); return reason; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      });
      const recorder = new MediaRecorder(stream, { mimeType: pickMimeType() || undefined });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data?.size) chunksRef.current.push(e.data); };
      recorder.start();
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setError(null);
      setRecording(true);
      return null;
    } catch (e) {
      const cause = e?.name === "NotAllowedError" ? "denied" : "failed";
      setError(cause);
      return cause;
    }
  }, []);

  // Rend le blob, ou null si l'appui a été trop bref pour contenir de la parole.
  const stop = useCallback(() => new Promise((resolve) => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") { setRecording(false); resolve(null); return; }
    const elapsed = Date.now() - startedAtRef.current;
    recorder.onstop = () => {
      recorder.stream.getTracks().forEach((t) => t.stop());
      recorderRef.current = null;
      setRecording(false);
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      chunksRef.current = [];
      resolve(elapsed < 350 || blob.size < 1200 ? null : blob);
    };
    recorder.stop();
  }), []);

  // Abandon explicite (doigt relâché hors du bouton) : on jette l'audio.
  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = () => recorder.stream.getTracks().forEach((t) => t.stop());
      recorder.stop();
    }
    recorderRef.current = null;
    chunksRef.current = [];
    setRecording(false);
  }, []);

  return { recording, error, setError, start, stop, cancel };
}

export async function transcribeAudio(blob) {
  const res = await fetch("/api/transcribe", {
    method: "POST",
    headers: { "Content-Type": blob.type || "audio/webm" },
    body: blob,
  });
  if (res.status === 503) throw new Error("whisper_unavailable");
  if (!res.ok) throw new Error(`transcribe_${res.status}`);
  const data = await res.json();
  return (data.text || "").trim();
}

// mode : "task" (titre + sous-tâches) ou "subtask" (sous-tâches seules).
// Le backend renvoie toujours quelque chose d'exploitable, même si le modèle
// local tombe : la dictée n'est jamais perdue.
export async function structureText(transcript, mode = "task", parentTitle = "") {
  const res = await fetch("/api/structure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript, mode, parentTitle }),
  });
  if (!res.ok) throw new Error(`structure_${res.status}`);
  return res.json();
}
