"""
Package dei controller per la gestione della logica di business.

I controller sono classi che contengono metodi statici per gestire la logica di business
più complessa dell'applicazione, separando questa logica dai modelli e dalle API.

Pattern di utilizzo:
1. Creare un file controller_<nome_entità>.py per ogni entità
2. Implementare una classe <Nome>Controller con metodi statici
3. Utilizzare i controller nelle API per gestire operazioni complesse

Vantaggi:
- Separazione della logica di business dalle API e dai modelli
- Riutilizzo del codice in diverse parti dell'applicazione
- Possibilità di testare la logica di business in modo isolato
- Migliore organizzazione del codice e responsabilità ben definite

Controller disponibili:
- UtenteController: gestione utenti, operatori e assenze
- AttivitaController: gestione attività, disponibilità risorse
- MezzoController: gestione mezzi, rimorchi e disponibilità
- DocumentoController: gestione documenti, scadenze e validità
"""