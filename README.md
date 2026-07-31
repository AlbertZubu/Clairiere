# 🌳 Clairière

**Application web de gestion personnelle des tâches et obligations**

Une trouée de lumière en forêt pour organiser ta vie.

---

## 📋 Fonctionnalités

- ✅ **Tâches simples** — ponctuelles et réorganisables
- 📁 **Dossiers complexes** — projets avec arborescence multi-niveaux
- 📆 **Hebdomadaire** — rituels récurrents (lun→dim, reset auto lundi)
- 📅 **Quotidien** — tâches journalières (Ruisseau, Langue, Hobbies, Santé, Sport)
- 📧 **Email** — scan IA des 30 derniers jours (Gmail MCP)
- 🏋️ **Sport** — dossiers spécialisés (Jogging, Piscine, Rando, Voyage)
- 🎨 **Thèmes** — Clairière, Nike, Apple, Claude (design système complet)
- 🤖 **Assistant IA** — Claude Haiku intégré pour créer/gérer au naturel
- 🎙️ **Micro** — reconnaissance vocale fr-FR

---

## 🛠 Stack

- **Frontend** : React 18 (Hooks)
- **Stockage** : `window.storage` (persistant, clé-valeur)
- **IA** : Claude Haiku 4.5 (Anthropic API)
- **Email** : Gmail MCP (scan INBOX)
- **Icônes** : lucide-react (40+ icons)
- **Typo** : Google Fonts (Fraunces serif, Public Sans sans-serif)

---

## 📁 Structure

```
clairiere/
├── clairiere.jsx          # App React complète
├── package.json           # Dépendances
├── .gitignore            # Fichiers à ignorer
├── README.md             # Cette doc
└── .git/                 # Historique Git
```

---

## 🚀 Installation & Déploiement

### Cloner le repo
```bash
git clone https://github.com/AlbertZubu/clairiere.git
cd clairiere
```

### Installer les dépendances
```bash
npm install
```

### Lancer en dev
```bash
npm start
```

L'app s'ouvre sur `http://localhost:3000`

### Build production
```bash
npm build
```

---

## 💾 Persistance

Tous les données sont stockées localement :
- `clairiere:v4` — Tâches + Dossiers
- `clairiere:weekly` — Rituels hebdo (reset lundi 00:00)
- `clairiere:daily` — Rituels quotidiens
- `clairiere:sport` — Dossiers sport
- `clairiere:emails` — Cache emails (scan 30j)
- `clairiere:chat` — Historique assistant
- `clairiere:theme` — Thème actif

---

## 🎨 Design System

**Palette Clairière** (défaut) :
- Canvas : `#F7F3E9` (beige chaud)
- Forest : `#2C4A32` (vert-forêt)
- Amber : `#C68A3D` (or ambré)
- Accent couleurs : clay, sky, sage, berry

**Autres thèmes** : Nike (sport), Apple (minimaliste), Claude (chaleureux)

---

## 🔗 GitHub

📌 Repo : https://github.com/AlbertZubu/clairiere

---

## 📝 License

MIT

---

**Créé par** : AlbertZubu  
**Plateforme** : React Web, mobile (Android prioritaire)  
**Status** : En développement

---

## Déploiement (Pi)

L'app tourne en permanence sur le Raspberry Pi via un service systemd, accessible depuis le réseau NordVPN Meshnet.

**Accès** : `http://100.96.55.59:4000`

**Stockage** : plus de dépendance à `window.storage` (Artifacts Claude.ai). Un petit backend Express (`server/server.js`) sert de couche de persistance, avec les données stockées dans `data/store.json` sur le Pi (non versionné, voir `.gitignore`).

**Stack** :
- Frontend : Vite + React (build dans `dist/`)
- Backend : Express (sert `dist/` + API `/api/storage/*`)
- Process manager : systemd (`clairiere.service`) — redémarre automatiquement, démarre au boot

**Commandes utiles (sur le Pi)** :
```bash
npm run build          # build le frontend
sudo systemctl restart clairiere   # relancer le service après un changement
sudo systemctl status clairiere    # voir l'état
journalctl -u clairiere -f         # voir les logs en direct
```

**⚠️ Note** : l'assistant IA (chat) et le scan Gmail utilisent encore des appels directs à l'API Anthropic depuis le navigateur — ces fonctionnalités ne marcheront pas en dehors des Artifacts Claude.ai sans un backend proxy dédié avec une vraie clé API. C'est un chantier séparé (voir roadmap du projet).
