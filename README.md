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
- 🎨 **Styles** — 8 univers visuels complets (fond, formes, ombres, typo, nav)
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

Un seul objet `PALETTE` muté en place par `applyTheme(id)`. Chaque thème
hérite de `BASE_TOKENS` puis surcharge ce qu'il veut : couleurs, mais aussi
fond de page (dégradés), calque décoratif, forme et ombre des cartes, style
de nav, échelle typographique, forme des cases à cocher.

Les 8 styles, tous sur fond clair :

| Style | Univers |
|---|---|
| **Clairière** | papier chaud, encre forêt, coins organiques (défaut) |
| **Élan** | brutalisme sportif — noir/rouge, angles vifs, ombres dures |
| **Studio** | minimalisme — aucune bordure, grands rayons, ombres douces |
| **Claude** | chaleureux — terracotta, serif Lora, pilules |
| **Aurore** | verre dépoli, dégradés pastel, halos colorés |
| **Encre** | éditorial — grand serif, filets fins, papier réglé |
| **Pop** | électrique — violet/cyan/rose, cartes épaisses, ombres portées |
| **Sumi** | japandi — papier de riz, trait fin, un seul vermillon |

Helpers partagés : `cardStyle()`, `cardBorder()`, `accentFill()`,
`titleStyle()`, `PageHeader`, `SectionLabel`, `HeroBanner`, `RitualTile`.
Anciens ids stockés (`nike`, `apple`) migrés automatiquement vers `elan` / `studio`.

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
