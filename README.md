# GESTRI — Gestionale Rifiuti Industriali 🗃️

## Descrizione del progetto

GESTRI è un gestionale per la tracciabilità e gestione dei rifiuti industriali. Il progetto è composto da due parti:

- `django-nextjs-backend-api`: backend REST API sviluppato con Django (Python), responsabilità: modello dati, autenticazione, API per la gestione di utenti, mezzi, rimorchi, documenti e attività.
- `django-nextjs-frontend`: frontend web moderno sviluppato con Next.js + React, responsabile dell'interfaccia utente, autenticazione e integrazione con le API del backend.

L'obiettivo è offrire un'app web completa per la gestione operativa e amministrativa del ciclo dei rifiuti, con upload documentale, anagrafiche mezzi e utenti, e workflow per le attività.

---

## Implementazione e tecnologie usate

Architettura: separazione frontend/backend con API REST.

Principali tecnologie:

- Backend
  - Python 3.11+ (compatibile con le versioni recenti)
  - Django (project: `gestri`) per routing, ORM e admin
  - SQLite (di default in `src/db.sqlite3`) per sviluppo locale
  - PyPI packages elencati in `django-nextjs-backend-api/requirements.txt`
  - Struttura a app Django (es. `utente`, `mezzo`, `rimorchio`, `documento`, `attivita`, ecc.)

- Frontend
  - Node.js (16+ raccomandato) / npm
  - Next.js (React) per rendering lato server e routing
  - Tailwind / CSS modules (se presenti nella cartella `src/app` e `src/components`)

- Tooling e script
  - `rav` (script wrapper incluso nel repo) per comandi utili come `rav run test`, `rav run dev` — usa gli script definiti nei rispettivi `package.json` o wrapper Python per eseguire task comuni.

---

## Contratto minimo (inputs / outputs)

- Input: richieste HTTP al backend (JSON), upload file per documenti, credenziali utente.
- Output: API JSON, pagine web React, file media salvati in `src/media/`.
- Error modes: validazioni Django, 4xx/5xx sulle API, controllo autenticazione.

Edge cases principali:

- Database vuoto (prima migrazione)
- File upload grandi o mancanti
- Errori di autenticazione / permessi

---

## Come clonare e preparare l'ambiente (da zero)

Questa guida presume che l'utente non abbia installato nulla (né Python né Node). Fornisce comandi per macOS (zsh) e Windows (PowerShell/CMD). Scegli la sezione per il tuo OS.

### 1) Clona il repository

```bash
# macOS / Linux / Windows (Git must be installed)
git clone https://github.com/davideronchini/GESTRI-Gestionale-Rifiuti-Industriali.git
cd GESTRI-Gestionale-Rifiuti-Industriali/dev
```

Se non hai Git installato:
- macOS: installalo con Homebrew (vedi sotto) o scarica da https://git-scm.com
- Windows: installalo da https://git-scm.com o usa Git for Windows

---

## 2) Preparare il backend (Django / Python)

### macOS (zsh)

1. Installa Homebrew (se non presente):

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. Installa Python e strumenti base:

```bash
brew install python@3.11 git
python3 -m pip install --upgrade pip
```

3. Crea e attiva un virtual environment:

```bash
cd django-nextjs-backend-api/src
python3 -m venv .venv
source .venv/bin/activate
```

4. Installa i requirements:

```bash
pip install -r ../requirements.txt
```

> Nota: in questo progetto il file `requirements.txt` si trova nella root del backend `django-nextjs-backend-api/`.

5. Esegui migrazioni e crea un superuser (opzionale):

```bash
python manage.py migrate
python manage.py createsuperuser
```

6. Avvia il server di sviluppo Django:

```bash
python manage.py runserver
```

Oppure usa il wrapper `rav` (se presente):

```bash
# dalla root del backend
cd .. # assicurati di trovarti in django-nextjs-backend-api
rav run dev
```

### Windows (PowerShell)

1. Installa Python: scarica l'installer da https://www.python.org/downloads/ e assicurati di spuntare "Add Python to PATH" durante l'installazione.

2. Apri PowerShell e vai nella cartella del backend:

```powershell
cd .\django-nextjs-backend-api\src
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r ..\requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Se PowerShell blocca l'esecuzione degli script, esegui come amministratore:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 3) Preparare il frontend (Next.js / Node)

### macOS (zsh)

1. Installa Node.js (consigliato tramite Homebrew o nvm):

```bash
# con Homebrew (installa Node LTS)
brew install node
# oppure con nvm (consigliato se gestisci più versioni)
# curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
# source ~/.zshrc
# nvm install --lts
```

2. Installa le dipendenze e avvia il dev server:

```bash
cd ../../django-nextjs-frontend
npm install
npm run dev
```

Questo avvia il sito Next.js (solitamente su http://localhost:3000).

### Windows (PowerShell / CMD)

1. Installa Node.js: scarica l'installer da https://nodejs.org (scegli LTS) e installalo.

2. Apri PowerShell/CMD:

```powershell
cd .\django-nextjs-frontend
npm install
npm run dev
```

---

## 4) Uso del wrapper `rav` (se presente)

Il repository include un file `rav.yaml` e alcuni script helper. Esempi comuni:

- Eseguire i test:

```bash
# dalla root del backend (django-nextjs-backend-api)
rav run test
```

- Avviare il backend in dev (se definito in rav):

```bash
rav run dev
```

Se `rav` non è riconosciuto, può trattarsi di uno script Python interno: esegui `python rav` o controlla `rav.yaml` per gli script definiti.

---

## 5) Eseguire i test

### Backend

```bash
cd django-nextjs-backend-api/src
# con venv attivo
rav run test
# oppure
python manage.py test
```

### Frontend

I test frontend (se presenti) possono essere eseguiti con:

```bash
cd django-nextjs-frontend
npm test
```

---

## 6) File media e storage

I file caricati dall'app vengono salvati nella cartella `django-nextjs-backend-api/src/media/` (sotto cartelle `documenti`, `mezzi`, `rimorchi`). Per produzione configura uno storage esterno (S3, Azure Blob, ecc.).

---

## 7) Suggerimenti e miglioramenti futuri

- Sostituire SQLite con PostgreSQL per produzione
- Aggiungere Dockerfile e docker-compose per sviluppo e CI
- Introdurre autenticazione token JWT con refresh token e rate-limiting
- Implementare test E2E per workflow critici

---

## Licenza e autore

- Autore: Davide Ronchini
- Repository: https://github.com/davideronchini/GESTRI-Gestionale-Rifiuti-Industriali

---

## Note finali

Ho creato questo README come punto d'ingresso rapido per chi parte da zero. Se vuoi, posso:

- aggiungere una sezione Docker + docker-compose
- generare script di setup automatico per macOS/Windows
- aggiungere istruzioni per deploy su servizi cloud (VPS, Render, Vercel)

Dimmi quale preferisci e procedo con le modifiche.