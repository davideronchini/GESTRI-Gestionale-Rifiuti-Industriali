# 🚀 Django + Next.js Fullstack App

Un progetto fullstack moderno che combina **Django (backend)** e **Next.js (frontend)** per un'applicazione web ad alte prestazioni e scalabile.

---

## 🧩 Tecnologie

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DBFB?style=for-the-badge&logo=react&logoColor=black)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS](https://img.shields.io/badge/CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

---

## ⚙️ Installazione e Setup

### 🖥️ Backend (Django)

```bash
# Controlla la versione di Python
python3 --version

# Installa Python se non è presente (macOS / Linux)
sudo apt update && sudo apt install python3 python3-venv python3-pip -y

# Installa Python se non è presente (Windows - PowerShell come Admin)
winget install Python.Python.3.12

# Entra nella directory del backend
cd dev/django-nextjs-backend-api/src

# Installa i pacchetti richiesti
pip install -r requirements.txt
````

---

### 💻 Frontend (Next.js)

```bash
# Controlla la versione di Node.js
node -v

# Installa Node.js se non è presente (macOS / Linux)
sudo apt install nodejs npm -y

# Installa Node.js se non è presente (Windows - PowerShell come Admin)
winget install OpenJS.NodeJS

# Entra nella directory del frontend
cd dev/django-nextjs-frontend

# Installa le dipendenze
npm install
```

---

## ▶️ Esecuzione

### 🖥️ Backend (Django)

```bash
# Vai alla directory del backend
cd dev/django-nextjs-backend-api/

# Attiva .venv (solo per esecuzione)
source .venv/bin/activate

# Avvia il server di sviluppo
cd src
python manage.py runserver 8001
```

Il backend sarà disponibile su:

* 🌐 **API** → [http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)
* 🔐 **Admin Panel** → [http://127.0.0.1:8000/admin](http://127.0.0.1:8000/admin)

---

### 💫 Frontend (Next.js)

```bash
# Vai alla directory del frontend
cd dev/django-nextjs-frontend

# Avvia il server di sviluppo Next.js
npm run dev
```

Il frontend sarà disponibile su:

* 🧭 [http://localhost:3000](http://localhost:3000)

---

## 🧠 Note

Assicurati che entrambi i server (backend e frontend) siano in esecuzione per utilizzare tutte le funzionalità dell’applicazione.
