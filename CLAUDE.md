# CLAUDE.md — Clairière

Projet perso, plusieurs heures/semaine depuis 2 semaines, multi-appareils
(PC Windows, Raspberry Pi via Claude Code, Android Galaxy Z Fold5).
Tous les appareils sont sur le même réseau Tailscale (meshnet NordVPN).

## Ce que c'est

App web de gestion personnelle des tâches (voir `README.md` pour le détail
fonctionnel complet : tâches, dossiers, hebdo, daily, sport, email, domaines
de vie, chat assistant).

## Où ça vit

- **Source réelle** : `/media/NAS-Partage/CLAUDE/clairiere/` sur le Pi
  (alias SSH `pi` / `nas`, IP Tailscale `100.96.55.59`)
- **Ce dossier EST le dépôt Git** : https://github.com/AlbertZubu/Clairiere
- **Ce n'est PAS un artifact Claude.ai.** L'app utilisait `window.storage` à
  l'origine (voir doc de specs), mais la version déployée ici a un vrai
  backend (voir plus bas). Le fichier `clairiere.jsx` visible dans le Claude
  Project est une ancienne version de référence (specs), pas le code qui
  tourne réellement — le vrai code source est `src/Clairiere.jsx` sur le Pi.

## Stack déployée

- **Frontend** : Vite + React → build dans `dist/`
- **Backend** : Express (`server/server.js`) — sert `dist/` + API `/api/storage/*`,
  `/api/chat`, `/api/transcribe`, `/api/structure` (tout en local, PAS l'API
  Anthropic)
- **Persistance** : `data/store.json` sur le Pi (non versionné, voir `.gitignore`)
- **Transcription** : whisper.cpp en service systemd (`whisper.service`),
  `/opt/whisper`, modèle `ggml-small.bin`, écoute sur `127.0.0.1:8081`
- **Process manager** : systemd, services `clairiere.service` et `whisper.service`
- **Reverse proxy** : nginx ports 80 **et 443**, config
  `/etc/nginx/sites-available/apps` + `/etc/nginx/snippets/apps-locations.conf`

## Accès web (depuis n'importe quel appareil, via le meshnet)

- **URL principale (à privilégier)** : `https://100.96.55.59/clairiere`
- **HTTP, toujours actif** : `http://100.96.55.59/clairiere`
- **Accès direct (fallback)** : `http://100.96.55.59:4000`
- **Page d'accueil listant les apps du Pi** : `http://100.96.55.59/`

### Pourquoi le HTTPS est nécessaire

Les navigateurs n'ouvrent le micro (`getUserMedia`) que dans un « contexte
sécurisé ». En `http://` sur une IP, `navigator.mediaDevices` est carrément
absent : **la dictée vocale ne marche qu'en `https://`**. C'est aussi pourquoi
le bouton micro de la barre de chat n'a jamais fonctionné sur le téléphone.

Le certificat est **auto-signé** (`/etc/nginx/ssl/clairiere.crt`, valable
10 ans, SAN sur `100.96.55.59`, `192.168.0.10`, `192.168.0.16`). Au premier
accès, Chrome affiche un avertissement : *Paramètres avancés → Continuer vers
le site*. Une fois accepté, c'est mémorisé pour cet appareil.

## Dictée vocale (page Tâches)

Le bouton « Ajouter une tâche » et le « + » de chaque tâche portent deux gestes :

- **appui court** → bandeau de saisie clavier, validation instantanée (aucun modèle)
- **appui long** → enregistrement tant que le doigt reste posé ; relâcher valide,
  glisser le doigt à côté annule

Chaîne complète d'une dictée, **entièrement sur le Pi** :

```
micro → MediaRecorder (webm/opus) → POST /api/transcribe
      → ffmpeg (WAV 16 kHz mono) → whisper.cpp (ggml-small, ~8 s)
      → POST /api/structure → gemma3:4b via Ollama (~15-25 s)
      → { title, subtasks[] }
```

La tâche s'affiche **immédiatement** en « Transcription… », puis se remplit avec
le texte brut dès qu'il arrive, puis est remplacée par le titre et les
sous-tâches. À aucun moment on n'attend devant un écran vide, et une panne du
modèle ne fait jamais perdre la dictée (repli sur le texte transcrit).

Choix du modèle de découpage (`OLLAMA_STRUCTURE_MODEL`, défaut = `OLLAMA_MODEL`) :
`gemma3:4b` a été retenu contre `qwen3.5:4b`. qwen est plus rapide (~16 s contre
~25 s) mais omet des étapes pourtant dictées ; gemma3 les reprend toutes. Les
deux tournent sur CPU à ~4 tok/s. Garder le même modèle que le chat évite
d'avoir deux 4B résidents et un rechargement de ~55 s en changeant de modèle.

### Commandes utiles

```bash
sudo systemctl status whisper          # état de la transcription
journalctl -u whisper -f               # logs whisper
curl -s localhost:4000/api/voice-status # whisper joignable ? quel modèle ?
```

## Commandes utiles (sur le Pi)

```bash
cd /media/NAS-Partage/CLAUDE/clairiere
npm run build                        # rebuild le frontend après modif
sudo systemctl restart clairiere     # relancer après un changement serveur
sudo systemctl status clairiere      # voir l'état
journalctl -u clairiere -f           # logs en direct
sudo nginx -t && sudo systemctl reload nginx   # après modif config nginx
```

## Point d'attention — chat IA & scan email

Le chat assistant et le scan Gmail utilisent des appels à l'API Anthropic
directement depuis le navigateur dans la version "spec" (`clairiere.jsx` du
Claude Project). **Ce n'est pas ce qui tourne en prod.** En prod, `/api/chat`
passe par un Ollama local (modèle `gemma3:4b`), pas par l'API Anthropic —
donc les réponses de l'assistant intégré à l'app seront moins bonnes qu'un
vrai Claude. Le scan Gmail MCP n'est probablement pas branché en prod non
plus (à vérifier avant de dire que ça marche).

## Convention pour ajouter un nouveau projet accessible en web

Même Pi, même IP, un chemin par projet (pas de nouveau port à retenir) :
1. Frontend : `base: "/nomprojet/"` dans `vite.config.js`
2. Backend Express : mount statique sous `/nomprojet` en plus de `/`
3. nginx : ajouter un bloc `location /nomprojet/ { proxy_pass http://127.0.0.1:PORT/nomprojet/; }`
   dans `/etc/nginx/sites-available/apps`
4. Ajouter le lien dans `/var/www/apps-index/index.html`

## Différence importante : Claude Code (ici) vs Claude Projects (claude.ai)

- **Claude Code**, lancé sur le Pi, lit ce fichier automatiquement au début
  de chaque session et voit l'état réel du dossier en direct.
- **Claude Projects** sur claude.ai/Android (le "Clairière" project) est une
  interface séparée : les fichiers qu'il connaît sont des copies uploadées
  manuellement dans la section Fichiers du projet, PAS une lecture directe
  du NAS. Il ne voit ni ce fichier ni les changements faits ici tant qu'on
  ne les re-uploade pas à la main dans l'UI. Penser à réuploader ce
  `CLAUDE.md` (et le README à jour) là-bas après des changements importants.

## Repères système

- Pi : Raspberry Pi, Debian 12 (bookworm), utilisateur `moi`
- Connexion SSH : `ssh pi` ou `ssh nas` depuis le PC (clé `pi_ssh`, sans passphrase)
- Autres projets sur ce Pi : voir `/media/NAS-Partage/CLAUDE/` (tuna, youtuber, guideConf, aiSwitchLocal, ficheExcursion)
