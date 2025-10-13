# GESTRI — Gestionale Rifiuti Industriali 🗃️

[![Python](https://img.shields.io/badge/python-3.11%2B-blue)](https://www.python.org/)
[![Django](https://img.shields.io/badge/framework-Django-green)](https://www.djangoproject.com/)
[![Next.js](https://img.shields.io/badge/framework-Next.js-black)](https://nextjs.org/)

---

## 🎯 Panoramica

**GESTRI** è un gestionale per la tracciabilità e la gestione dei rifiuti industriali.  
Il progetto è composto da due parti principali:

- **Backend:** `django-nextjs-backend-api` — REST API basata su Django (Python).  
- **Frontend:** `django-nextjs-frontend` — interfaccia basata su Next.js + React.

Obiettivo: fornire un'app web completa per la gestione operativa e amministrativa del ciclo dei rifiuti (upload documenti, anagrafiche, mezzi, utenti, workflow).

---

## ⚙️ Tecnologie principali

- **Backend**
  - Python 3.11+
  - Django (project: `gestri`)
  - Database: SQLite (sviluppo) — `dev/django-nextjs-backend-api/src/db.sqlite3`
  - Dipendenze: `dev/django-nextjs-backend-api/requirements.txt`

- **Frontend**
  - Node.js (LTS consigliato)
  - Next.js + React

- **Tooling**
  - `rav` — wrapper per comandi (`rav run server`, `rav run test`, ecc.)

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

## 🧩 Backend — Installazione e configurazione

### macOS / Linux (zsh)

```bash
# Verifica versione Python
python3 --version || python --version

# Clona il repository
git clone https://github.com/davideronchini/GESTRI-Gestionale-Rifiuti-Industriali.git
cd GESTRI-Gestionale-Rifiuti-Industriali/dev/django-nextjs-backend-api/src

# Aggiorna pip e installa le dipendenze (dal path src)
python3 -m pip install --upgrade pip
pip install -r ../requirements.txt

# Applica le migrazioni Django
python manage.py migrate

# (Opzionale) Crea un superuser
# python manage.py createsuperuser
````

### Windows (PowerShell)

```powershell
# Verifica versione Python
python --version

# Clona il repository
git clone https://github.com/davideronchini/GESTRI-Gestionale-Rifiuti-Industriali.git
cd GESTRI-Gestionale-Rifiuti-Industriali\dev\django-nextjs-backend-api\src

# Aggiorna pip e installa le dipendenze (dal path src)
python -m pip install --upgrade pip
pip install -r ..\requirements.txt

# Applica le migrazioni Django
python manage.py migrate

# (Opzionale) Crea un superuser
# python manage.py createsuperuser
```

---

## 🟢 Backend — Esecuzione (sviluppo)

### macOS / Linux (zsh)

```bash
# Attiva .venv (dal path dev/django-nextjs-backend-api/)
cd ../
source .venv/bin/activate

# Avvia con rav (se configurato)
rav run server

# Alternativa senza rav - avvio esplicito su porta 8001
cd src
python manage.py runserver 127.0.0.1:8001
```

### Windows (PowerShell)

```powershell
# Attiva .venv (dal path dev\django-nextjs-backend-api\)
cd ..\
.\.venv\Scripts\Activate.ps1

# Avvia con rav (se configurato)
rav run server

# Alternativa senza rav - avvio esplicito su porta 8001
cd src
python manage.py runserver 127.0.0.1:8001
```

Backend base URL: `http://127.0.0.1:8001`
Esempi utili (admin / API routes): `http://127.0.0.1:8000/admin` , `http://127.0.0.1:8000/api`

---

## 💻 Frontend — Installazione e configurazione

### macOS / Linux (zsh)

```bash
# Verifica versione Node.js e npm
node --version
npm --version

# Se Node.js non è installato (macOS Homebrew)
brew install node

# Vai nella cartella frontend e installa dipendenze
cd ../../../django-nextjs-frontend
npm install
```

### Windows (PowerShell)

```powershell
# Verifica versione Node.js e npm
node --version
npm --version

# Se Node.js non è installato (Windows, winget)
winget install OpenJS.NodeJS.LTS

# Vai nella cartella frontend e installa dipendenze
cd ..\..\django-nextjs-frontend
npm install
```

---

## ▶️ Frontend — Esecuzione (sviluppo)

### macOS / Windows

```bash
cd dev/django-nextjs-frontend
npm run dev
```

Apri il browser su `http://localhost:3000`.

---

## 🧪 Test

### Backend — macOS / Linux

```bash
cd dev/django-nextjs-backend-api/src
# Se vuoi usare .venv per esecuzione:
cd ../
source .venv/bin/activate
cd src

rav run test || python manage.py test
```

### Backend — Windows (PowerShell)

```powershell
cd dev\django-nextjs-backend-api\src
cd ..\
.\.venv\Scripts\Activate.ps1
cd src

rav run test || python manage.py test
```

### Frontend — macOS / Windows

```bash
cd dev/django-nextjs-frontend
npm test
```

---

## 🧱 Note

* Verificare che **Python 3.11+** e **Node.js LTS** siano installati e accessibili dal terminale.
* Il file `rav.yaml` contiene comandi predefiniti per avvio e test del backend.
* Per ambiente di produzione, sostituire SQLite con un database relazionale (es. PostgreSQL).
* Per configurare l’URL delle API e le variabili del frontend, usare `.env.local` nella directory `django-nextjs-frontend`.

---

## ✅ Fine installazione

* **Backend (base URL):** `http://127.0.0.1:8001`
* **Admin (esempio):** `http://127.0.0.1:8000/admin`
* **API (esempio):** `http://127.0.0.1:8000/api`
* **Frontend:** `http://localhost:3000`

GESTRI è ora attivo in modalità sviluppo.
