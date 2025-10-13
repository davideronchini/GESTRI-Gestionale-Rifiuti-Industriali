# GESTRI — Gestionale Rifiuti Industriali 🗃️

[![Python](https://img.shields.io/badge/python-3.11%2B-blue)](https://www.python.org/)
[![Django](https://img.shields.io/badge/framework-Django-green)](https://www.djangoproject.com/)
[![Next.js](https://img.shields.io/badge/framework-Next.js-black)](https://nextjs.org/)

---

## 🎯 Panoramica

GESTRI è un gestionale per la tracciabilità e la gestione dei rifiuti industriali. Il progetto è composto da due parti principali:

- `django-nextjs-backend-api`: backend REST API (Django, Python).
- `django-nextjs-frontend`: frontend moderno (Next.js + React).

Obiettivo: fornire un'app web completa per la gestione operativa e amministrativa del ciclo dei rifiuti: upload documenti, anagrafiche mezzi/utenti e workflow delle attività.

---

## 📦 Tecnologie principali

- Backend

  - Python 3.11+
  - Django (project: `gestri`)
  - SQLite (sviluppo: `dev/django-nextjs-backend-api/src/db.sqlite3`)
  - Dipendenze: `dev/django-nextjs-backend-api/requirements.txt`

- Frontend

  - Node.js (LTS consigliato)
  - Next.js + React

- Tooling
  - `rav` (wrapper per comandi: `rav run server`, `rav run test`, ecc.)

---

## 📁 Struttura del repository (sommario)

```
GESTRI-Gestionale-Rifiuti-Industriali/
├── dev/
│   ├── django-nextjs-backend-api/
│   │   └── src/                 # Django app (manage.py, app folders, media/, db)
│   └── django-nextjs-frontend/   # Next.js app (src/, public/, package.json)
├── Tesina - LaTeX/
└── README.md
```

---

## Installazione: panoramica

Di seguito trovi blocchi di comandi separati, pronti da copiare e incollare, organizzati per backend/frontend e per sistema operativo (macOS zsh / Windows PowerShell). Ogni blocco ha una brevissima descrizione sopra e sotto il codice.

---

## Backend — macOS (zsh)

Descrizione: clona il repo, crea e attiva il virtualenv, installa dipendenze e applica le migrazioni.

```bash
# Clona il repository e vai nella cartella del backend
git clone https://github.com/davideronchini/GESTRI-Gestionale-Rifiuti-Industriali.git
cd GESTRI-Gestionale-Rifiuti-Industriali/dev/django-nextjs-backend-api/src

# Crea virtualenv e attivalo
python3 -m venv .venv
source .venv/bin/activate

# Aggiorna pip e installa le dipendenze
python -m pip install --upgrade pip
pip install -r ../requirements.txt

# Applica migrazioni Django
python manage.py migrate

# (Opzionale) crea superuser:
# python manage.py createsuperuser
```

Eseguiti questi passaggi, il backend è pronto per essere avviato (vedi sezione Esecuzione).

---

## Backend — Windows (PowerShell)

Descrizione: passaggi equivalenti per Windows PowerShell.

```powershell
# Clona repository e vai nella cartella del backend
git clone https://github.com/davideronchini/GESTRI-Gestionale-Rifiuti-Industriali.git
cd GESTRI-Gestionale-Rifiuti-Industriali\dev\django-nextjs-backend-api\src

# Crea virtualenv e attiva (PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Aggiorna pip e installa le dipendenze
python -m pip install --upgrade pip
pip install -r ..\requirements.txt

# Applica migrazioni Django
python manage.py migrate

# (Opzionale) crea superuser:
# python manage.py createsuperuser
```

Una volta completato, il backend è pronto per l'esecuzione locale.

---

## Frontend — macOS (zsh)

Descrizione: entra nella cartella frontend e installa le dipendenze Node.

```bash
# Vai nella cartella del frontend
cd ../../../django-nextjs-frontend

# Installa le dipendenze Node
npm install
```

Questo comando prepara il frontend (Next.js) per l'esecuzione.

---

## Frontend — Windows (PowerShell)

Descrizione: equivalente Windows per installare le dipendenze del frontend.

```powershell
# Vai nella cartella del frontend
cd ..\..\django-nextjs-frontend

# Installa le dipendenze
npm install
```

Dopo l'installazione, il frontend è pronto per essere avviato.

---

## Script utili (macOS)

Descrizione: se vuoi usare lo script di setup fornito, rendilo eseguibile ed eseguilo.

```bash
# Dalla root del repo
cd ../../
chmod +x scripts/setup-macos.sh
./scripts/setup-macos.sh
```

Lo script esegue una serie di passaggi automatici per creare virtualenv e installare dipendenze.

---

## Script utili (Windows PowerShell)

Descrizione: esegui lo script PowerShell di setup (se fornito) dopo aver impostato la policy di esecuzione.

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\setup-windows.ps1
```

Questo script automatizza la preparazione dell'ambiente su Windows.

---

## 🧾 Test (blocchi separati)

Descrizione: comandi per eseguire i test backend e frontend.

### Backend — esegui test (macOS / Linux)

```bash
cd dev/django-nextjs-backend-api/src
# attiva virtualenv
source .venv/bin/activate
# Esegui i test (usa rav se disponibile)
rav run test || python manage.py test
```

### Backend — esegui test (Windows PowerShell)

```powershell
cd dev\django-nextjs-backend-api\src
.\.venv\Scripts\Activate.ps1
rav run test || python manage.py test
```

### Frontend — esegui test (macOS / Windows)

```bash
cd dev/django-nextjs-frontend
npm test
```

---

## 🔍 Note su dipendenze

Se non hai già installato Python/Node o Homebrew su macOS, segui i comandi di sistema appropriati (sono riportati nello script di setup fornito). Assicurati di usare Python 3.11+ come indicato nella panoramica del progetto.

---

## Esecuzione (sviluppo)

Descrizione: per il corretto funzionamento locale, sia il backend che il frontend devono essere in esecuzione contemporaneamente. Questa sezione presume che l'installazione sia stata completata seguendo le istruzioni sopra.

### Backend — avviare con rav (macOS / Linux)

Descrizione: attiva il virtualenv e usa il comando `rav` definito in `rav.yaml` per avviare il server o eseguire i test.

```bash
cd dev/django-nextjs-backend-api/src
source .venv/bin/activate

# Avvia il server (usa il comando definito in rav.yaml)
rav run server

# Esegui i test
rav run test
```

Se `rav` non è disponibile, puoi avviare manualmente con:

```bash
python manage.py runserver
```

### Backend — avviare con rav (Windows PowerShell)

```powershell
cd dev\django-nextjs-backend-api\src
.\.venv\Scripts\Activate.ps1

# Avvia il server
rav run server

# Esegui i test
rav run test
```

Nota: su PowerShell i comandi `rav` rimangono gli stessi se lo script è eseguibile sulla tua macchina.

### Frontend — avviare (macOS / Windows)

Descrizione: usa npm (o lo script specifico del progetto) per avviare Next.js.

```bash
cd dev/django-nextjs-frontend
npm run dev
```

Dopo aver avviato entrambi (backend e frontend), apri il browser sulla porta indicata dal frontend (di solito http://localhost:3000) per usare l'app in sviluppo.

---

## Comandi rapidi (ricapitolazione)

Descrizione: alcuni comandi utili riassunti.

```bash
# Backend: attiva venv e avvia con rav
cd dev/django-nextjs-backend-api/src && source .venv/bin/activate && rav run server

# Frontend: avvia Next.js
cd dev/django-nextjs-frontend && npm run dev

# Esegui i test backend
cd dev/django-nextjs-backend-api/src && source .venv/bin/activate && rav run test

# Esegui i test frontend
cd dev/django-nextjs-frontend && npm test
```

---

## Contatti e note finali

Per domande o contributi apri una issue o invia una pull request sul repository GitHub.
