# GESTRI — Gestionale Rifiuti Industriali 🗃️

[![Python](https://img.shields.io/badge/python-3.11%2B-blue)](https://www.python.org/) [![Django](https://img.shields.io/badge/framework-Django-green)](https://www.djangoproject.com/) [![Next.js](https://img.shields.io/badge/framework-Next.js-black)](https://nextjs.org/)  
[![SQLite](https://img.shields.io/badge/database-SQLite-lightgrey)](https://www.sqlite.org/) [![JavaScript](https://img.shields.io/badge/lang-JavaScript-yellow)](https://developer.mozilla.org/docs/Web/JavaScript) [![CSS](https://img.shields.io/badge/lang-CSS-blue)](https://developer.mozilla.org/docs/Web/CSS) [![Tailwind](https://img.shields.io/badge/framework-Tailwind-blueviolet)](https://tailwindcss.com/)

---

## 🎯 Panoramica

**GESTRI** è un gestionale per la tracciabilità e la gestione dei rifiuti industriali.  
Il progetto è composto da due parti principali:

- **Backend:** `django-nextjs-backend-api` — REST API basata su Django (Python).  
- **Frontend:** `django-nextjs-frontend` — interfaccia basata su Next.js + React.

L’obiettivo è fornire un’applicazione completa per la gestione del ciclo dei rifiuti: upload documenti, anagrafiche, mezzi, utenti e workflow operativi.

---

## 🛠️ Tecnologie principali

- **Backend**
  - Python 3.11+
  - Django
  - SQLite
  - Dipendenze: `dev/django-nextjs-backend-api/requirements.txt`

- **Frontend**
  - Node.js (LTS consigliato)
  - Next.js + React
  - Tailwind CSS

- **Tooling**
  - `rav` (wrapper opzionale per comandi: `rav run server`, `rav run test`, ecc.)

---

## 📁 Struttura del repository

```

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

````

---

# ⚙️ Installazione e Setup



## 🐍 Backend

### macOS / Linux (zsh)

```bash
# Verifica versione di Python
if command -v python3 >/dev/null 2>&1; then
  python3 --version
else
  # Installa Python 3.11 se non presente
  if command -v brew >/dev/null 2>&1; then
    brew install python@3.11
  else
    sudo apt update
    sudo apt install -y python3.11 python3.11-venv python3-pip
  fi
fi

# Clona il repository
git clone https://github.com/davideronchini/GESTRI-Gestionale-Rifiuti-Industriali.git
cd GESTRI-Gestionale-Rifiuti-Industriali/dev/django-nextjs-backend-api/src

# Aggiorna pip e installa i requirements
python3 -m pip install --upgrade pip
pip install -r ../requirements.txt
````

### Windows (PowerShell)

```powershell
# Verifica versione di Python
if (Get-Command python -ErrorAction SilentlyContinue) {
  python --version
} else {
  # Installa Python 3.11 con winget
  winget install -e --id Python.Python.3.11
}

# Clona il repository
git clone https://github.com/davideronchini/GESTRI-Gestionale-Rifiuti-Industriali.git
cd GESTRI-Gestionale-Rifiuti-Industriali\dev\django-nextjs-backend-api\src

# Aggiorna pip e installa i requirements
python -m pip install --upgrade pip
pip install -r ..\requirements.txt
```

---

## 🌐 Frontend

### macOS / Linux (zsh)

```bash
# Verifica versione di Node.js
if command -v node >/dev/null 2>&1; then
  node --version
  npm --version
else
  # Installa Node.js LTS
  if command -v brew >/dev/null 2>&1; then
    brew install node
  else
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi
fi

# Vai nella cartella frontend e installa le dipendenze
cd /path/to/GESTRI-Gestionale-Rifiuti-Industriali/dev/django-nextjs-frontend
npm install
```

### Windows (PowerShell)

```powershell
# Verifica versione di Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
  node --version
  npm --version
} else {
  # Installa Node.js LTS con winget
  winget install OpenJS.NodeJS.LTS
}

# Vai nella cartella frontend e installa le dipendenze
cd C:\path\to\GESTRI-Gestionale-Rifiuti-Industriali\dev\django-nextjs-frontend
npm install
```

---

# 🚀 Esecuzione



## 🐍 Backend

### macOS / Linux (zsh)

```bash
# Attiva l’ambiente virtuale e avvia il server
cd /path/to/GESTRI-Gestionale-Rifiuti-Industriali/dev/django-nextjs-backend-api
source .venv/bin/activate

# Avvio con rav (se configurato)
rav run server

# Oppure avvio manuale (porta 8001)
cd src
python manage.py runserver 127.0.0.1:8001
```

### Windows (PowerShell)

```powershell
# Attiva l’ambiente virtuale e avvia il server
cd C:\path\to\GESTRI-Gestionale-Rifiuti-Industriali\dev\django-nextjs-backend-api
.\.venv\Scripts\Activate.ps1

# Avvio con rav (se configurato)
rav run server

# Oppure avvio manuale (porta 8001)
cd src
python manage.py runserver 127.0.0.1:8001
```

---

## 🌐 Frontend

### macOS / Windows

```bash
# Avvia l’applicazione Next.js in modalità sviluppo
cd /path/to/GESTRI-Gestionale-Rifiuti-Industriali/dev/django-nextjs-frontend
npm run dev
```

Apri il browser su:
👉 [http://localhost:3000](http://localhost:3000)

---

# 🧪 Test

## Backend

```bash
cd /path/to/GESTRI-Gestionale-Rifiuti-Industriali/dev/django-nextjs-backend-api
source .venv/bin/activate
cd src
rav run test || python manage.py test
```

## Frontend

```bash
cd /path/to/GESTRI-Gestionale-Rifiuti-Industriali/dev/django-nextjs-frontend
npm test
```

---

# 🔗 Collegamenti utili (sviluppo)

* **Backend (base URL):** [http://127.0.0.1:8001](http://127.0.0.1:8001)
* **Pannello Admin:** [http://127.0.0.1:8000/admin](http://127.0.0.1:8000/admin)
* **API Routes:** [http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)
* **Frontend:** [http://localhost:3000](http://localhost:3000)

---

# 📎 Note finali

* Assicurati che **Python 3.11+** e **Node.js LTS** siano installati e accessibili dal terminale.
* Installa sempre i **requirements Python** prima di eseguire i comandi del backend.
* `rav` è opzionale: puoi sempre avviare Django con `python manage.py runserver`.
* In produzione, si consiglia di sostituire **SQLite** con **PostgreSQL** o **MySQL**.

```
