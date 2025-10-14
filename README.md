# 🦺 GESTRI — Gestionale Rifiuti Industriali

**`Django + Next.js Fullstack App`**

[![Python](https://img.shields.io/badge/python-3.13.7-blue)](https://www.python.org/)
[![Django](https://img.shields.io/badge/framework-Django-orange)](https://www.djangoproject.com/)
[![Node.js](https://img.shields.io/badge/nodejs-22.19.0-green)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/framework-Next.js-brown)](https://nextjs.org/)  
[![SQLite](https://img.shields.io/badge/database-SQLite-lightgrey)](https://www.sqlite.org/)
[![JavaScript](https://img.shields.io/badge/lang-JavaScript-yellow)](https://developer.mozilla.org/docs/Web/JavaScript)
[![CSS](https://img.shields.io/badge/lang-CSS-blue)](https://developer.mozilla.org/docs/Web/CSS)
[![Tailwind](https://img.shields.io/badge/framework-Tailwind-blueviolet)](https://tailwindcss.com/)

---

## 🎯 Panoramica

**GESTRI** è un gestionale per la tracciabilità e la gestione dei rifiuti industriali.  
Il progetto è composto da due parti principali:

- **Backend:** `django-nextjs-backend-api` — REST API basata su Django (Python).
- **Frontend:** `django-nextjs-frontend` — interfaccia basata su Next.js + React.

L’obiettivo è fornire un’applicazione completa per la gestione del ciclo dei rifiuti: upload documenti, anagrafiche, mezzi, utenti e workflow operativi.

La **Tesina in formato PDF** offre una sintesi discorsiva della progettazione del sistema descrivendo i requisiti funzionali, l'architettura software, le principali scelte tecnologiche e i diagrammi chiave del progetto.

Puoi consultarla o scaricarla qui: [Tesina (PDF)](./Tesina%20-%20LaTeX/tesina.pdf)

---

## 🛠️ Tecnologie principali

- **Backend**

  - Python >= 3.13.7 <= 3.14 (non ancora compatibile)
  - Django >= 5.2.6
  - SQLite
  - Dipendenze: `dev/django-nextjs-backend-api/requirements.txt`

- **Frontend**

  - Node.js (LTS consigliato) >= 22.19.0
  - Npm >= 11.6.0
  - Next.js >= 13
  - Tailwind CSS

- **Tooling**
  - `rav` (wrapper opzionale per comandi: `rav run server`, `rav run test`, ecc.)

---

## 📁 Struttura del repository

GESTRI-Gestionale-Rifiuti-Industriali/
├── dev/
│   ├── django-nextjs-backend-api/
│   │   ├── src/
│   │   └── requirements.txt
│   └── django-nextjs-frontend/
│       ├── src/
│       ├── public/
│       └── package.json
├── Tesina - LaTeX/
└── README.md

---

## ⚙️ Installazione e Setup

### 🐍 Backend -- macOS / Linux (zsh)

```bash
# Verifica versione di Python
python3 --version
```

```bash
# Installa Python >= 3.13.7 <= 3.14 (non ancora compatibile) se non presente
sudo apt install python3 (Linux)
brew install python@3.13 (macOS)
```

```bash
# Clona il repository
git clone https://github.com/davideronchini/GESTRI-Gestionale-Rifiuti-Industriali.git
```

```bash
# Aggiorna pip e installa i requirements
python3 -m pip install --upgrade pip
```

```bash
# Spostati nella cartella django-nextjs-backend-api
cd GESTRI-Gestionale-Rifiuti-Industriali/dev/django-nextjs-backend-api
```

### 🐍 Backend -- Windows (PowerShell)

```bash
# Verifica versione di Python
python --version
```

```bash
# Installa Python >= 3.13.7 <= 3.14 (non ancora compatibile) se non presente
winget install Python.Python.3.13
```

```bash
# Clona il repository
git clone https://github.com/davideronchini/GESTRI-Gestionale-Rifiuti-Industriali.git
```

```bash
# Aggiorna pip e installa i requirements
python -m pip install --upgrade pip
```

```bash
# Spostati nella cartella django-nextjs-backend-api
cd GESTRI-Gestionale-Rifiuti-Industriali/dev/django-nextjs-backend-api
```

### 🌐 Frontend -- macOS / Linux (zsh)

```bash
# Verifica versione di Node.js
node --version
npm --version
```

```bash
# Installa Node.js LTS (per macOS)
brew install node
```

```bash
# Installa Node.js LTS (per Linux)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

```bash
# Vai nella cartella frontend e installa le dipendenze
cd GESTRI-Gestionale-Rifiuti-Industriali/dev/django-nextjs-frontend
```

```bash
npm install
```

### 🌐 Frontend -- Windows (PowerShell)

```powershell
# Verifica versione di Node.js
node --version
npm --version
```

```powershell
# Installa Node.js LTS con winget
winget install OpenJS.NodeJS.LTS
```

```powershell
# Vai nella cartella frontend e installa le dipendenze
cd GESTRI-Gestionale-Rifiuti-Industriali\dev\django-nextjs-frontend
```

```powershell
npm install
```

---

## 🚀 Esecuzione

### 🐍 Backend -- Windows (PowerShell, Cmd) / macOS / Linux (zsh)
Apri un terminale nella cartella del progetto e digita:

```bash
# Attiva l’ambiente virtuale e avvia il server
cd GESTRI-Gestionale-Rifiuti-Industriali/dev/django-nextjs-backend-api
```

```bash
# Se non esiste il file e non funziona il comando successivo
python -m venv venv
```

```powershell
# Per Windows (PowerShell)
venv\Scripts\Activate.ps1
```

```powershell
# Per Windows (Cmd)
venv\Scripts\activate.bat
```

```bash
# Per macOS / Linux (zsh)
source venv/bin/activate
```

```bash
# Installa i requisiti necessari a Django
python -m pip install -r requirements.txt
```

```bash
# Avvio con rav (se configurato)
rav run server
```

```bash
# Oppure avvio manuale (porta 8001)
cd src
python manage.py runserver 127.0.0.1:8001 || python3 manage.py runserver 127.0.0.1:8001
```

### 🌐 Frontend -- macOS / Windows / Linux

```bash
# Avvia l’applicazione Next.js in modalità sviluppo
cd GESTRI-Gestionale-Rifiuti-Industriali/dev/django-nextjs-frontend
```

```bash
npm run dev
```

Apri il browser su:
👉 http://localhost:3000

---

## 🧪 Test
### 🐍 Backend
Apri un terminale nella directory del backend:

```bash
cd GESTRI-Gestionale-Rifiuti-Industriali/dev/django-nextjs-backend-api
```

```powershell
# Per Windows (PowerShell)
venv\Scripts\Activate.ps1
```

```powershell
# Per Windows (Cmd)
venv\Scripts\activate.bat
```

```bash
# Per macOS / Linux (zsh)
source venv/bin/activate
```

```bash
rav run test || cd src && python manage.py test
```

## 🔗 Collegamenti utili (sviluppo)
- Backend (base URL): http://127.0.0.1:8001
- Pannello Admin: http://127.0.0.1:8000/admin
- API Routes: http://127.0.0.1:8000/api
- Frontend: http://localhost:3000

## 📎 Note finali
- Assicurati che Python 3.11+ e Node.js LTS siano installati e accessibili dal terminale.
- Installa sempre i requirements Python prima di eseguire i comandi del backend.
- rav è opzionale: puoi sempre avviare Django con python manage.py runserver.
- In produzione, si consiglia di sostituire SQLite con PostgreSQL o MySQL.
