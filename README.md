# GESTRI — Gestionale Rifiuti Industriali 🗃️

[![Python](https://img.shields.io/badge/python-3.11%2B-blue)](https://www.python.org/)
[![Django](https://img.shields.io/badge/framework-Django-green)](https://www.djangoproject.com/)
[![Next.js](https://img.shields.io/badge/framework-Next.js-black)](https://nextjs.org/)

---

## 🎯 Panoramica

GESTRI è un gestionale per la tracciabilità e la gestione dei rifiuti industriali. Il progetto è composto da due parti principali:

- `django-nextjs-backend-api`: backend REST API (Django, Python). Gestisce il modello dati, autenticazione, API per utenti, mezzi, rimorchi, documenti e attività.
- `django-nextjs-frontend`: frontend moderno (Next.js + React). Interfaccia utente, autenticazione e integrazione con le API del backend.

Obiettivo: fornire un'app web completa per la gestione operativa e amministrativa del ciclo dei rifiuti: upload documenti, anagrafiche mezzi/utenti e workflow delle attività.

---

## 📦 Tecnologie principali

- Backend

  - Python 3.11+
  - Django (project: `gestri`)
  - SQLite (sviluppo, `dev/django-nextjs-backend-api/src/db.sqlite3`)
  - Dipendenze: `dev/django-nextjs-backend-api/requirements.txt`

- Frontend

  - Node.js (LTS consigliato)
  - Next.js + React
  - Tailwind / CSS Modules

- Tooling
  - `rav` (script wrapper) per comandi utili (es. `rav run dev`, `rav run test`)

---

## 📁 Struttura del repository (sommario)

```
GESTRI-Gestionale-Rifiuti-Industriali/
├── dev/
│   ├── django-nextjs-backend-api/
│   │   └── src/                 # Django app (manage.py, app folders, media/, db)
│   └── django-nextjs-frontend/   # Next.js app (src/, public/, package.json)
├── Tesina - LaTeX/               # Materiale di tesi e immagini
├── README.md                     # Questo file
└── ...
```

Per dettagli esplora `dev/django-nextjs-backend-api/src` e `dev/django-nextjs-frontend`.

---

## ⚙️ Installazione (TUTTI i comandi)

Di seguito trovi una sezione unica con tutti i comandi necessari per mettere in piedi l'ambiente di sviluppo.

### macOS (zsh) — INIZIO INSTALLAZIONE

Esegui i comandi in questa sequenza nel terminale (zsh):

```bash
# 1) Clona il repository e vai nella cartella dev
git clone https://github.com/davideronchini/GESTRI-Gestionale-Rifiuti-Industriali.git
cd GESTRI-Gestionale-Rifiuti-Industriali/dev

# 2) Prerequisiti (Homebrew, Python3, Node). Salta i comandi già installati.
# Installa Homebrew (se non presente)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# Installa Python 3.11 e Git
brew install python@3.11 git
# Installa Node.js (LTS)
brew install node

# 3) Backend: crea virtualenv, installa dipendenze e migrazioni
cd django-nextjs-backend-api/src
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r ../requirements.txt
python manage.py migrate
## (Opzionale) crea superuser:
# python manage.py createsuperuser

# 4) Frontend: installa dipendenze
cd ../../django-nextjs-frontend
npm install

# 5) Avvio (opzionale, per sviluppo)
# Backend
cd ../django-nextjs-backend-api/src
source .venv/bin/activate
python manage.py runserver
# Frontend (nuova shell)
cd ../../django-nextjs-frontend
npm run dev
```

### Windows (PowerShell) — INIZIO INSTALLAZIONE

Esegui in PowerShell (esegui come amministratore se necessario):

```powershell
# 1) Clona repository
git clone https://github.com/davideronchini/GESTRI-Gestionale-Rifiuti-Industriali.git
cd GESTRI-Gestionale-Rifiuti-Industriali\dev

# 2) Prerequisiti: installa Python e Node (se non li hai installati: https://www.python.org/ e https://nodejs.org/)

# 3) Backend: crea virtualenv e installa dipendenze
cd .\django-nextjs-backend-api\src
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r ..\requirements.txt
python manage.py migrate
# (Opzionale) python manage.py createsuperuser

# 4) Frontend
cd ..\..\django-nextjs-frontend
npm install

# 5) Avvio (opzionale)
# Backend (nuova shell):
cd ..\django-nextjs-backend-api\src
.\.venv\Scripts\Activate.ps1
python manage.py runserver
# Frontend (nuova shell):
cd ..\..\django-nextjs-frontend
npm run dev
```

## 🧪 Unit Tests (sezione separata)

Ecco i comandi dedicati esclusivamente all'esecuzione degli unit test per backend e frontend.

- Backend (Django)

```bash
cd dev/django-nextjs-backend-api/src
# attiva virtualenv
source .venv/bin/activate   # macOS / Linux
```

Note:

- `rav run test` è un wrapper presente nel repo, in alternativa puoi usare `python manage.py test`.

