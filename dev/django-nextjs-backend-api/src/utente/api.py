from typing import List, Dict, Any
from datetime import datetime, date
from ninja import Router, Schema
from django.contrib.auth import get_user_model, authenticate
from django.http import HttpRequest
from ninja.errors import ValidationError, HttpError
from ninja_jwt.tokens import RefreshToken
from .models import Utente, Ruolo
from .schemas import UtenteSchema, UtenteCreateSchema, UtenteUpdateSchema, UtenteDetailSchema, ErrorUtenteCreateSchema, LoginSchema, TokenSchema
from .schemas_controller import (
    DisponibilitaRequestSchema, DisponibilitaResponseSchema,
    AssenzaCreateSchema, AssegnaOperatoreRequestSchema,
    AssegnaOperatoreResponseSchema, OperatoriDisponibiliRequestSchema,
    OperatoriDisponibiliResponseSchema
)
import helpers.api_auth as helpers
# Importo il controller
from controllers.utente_controller import UtenteController

router = Router()

# Endpoint per il login che utilizza l'email (POST - consigliato per sicurezza)
@router.post("/login", response={200: TokenSchema, 400: dict}, auth=helpers.api_public)
def login_post(request, payload: LoginSchema):
    """
    Custom login endpoint that authenticates using email and password.
    Returns JWT tokens that can be used for authentication.
    """
    success, tokens, error_message = UtenteController.login(
        email=payload.email, 
        password=payload.password
    )
    
    if not success:
        return 400, {"detail": error_message}
    
    return 200, tokens

# Endpoint for getting the current user
@router.get("/me", response=UtenteSchema, auth=helpers.api_auth_any_authenticated)
def get_current_user(request):
    """
    Get the currently authenticated user
    """
    return UtenteController.get_current_user(request.user)

# Endpoint for registration (publicly accessible)
@router.post("/register", response={201: UtenteSchema, 400: ErrorUtenteCreateSchema}, auth=helpers.api_public)
def register_user(request: HttpRequest, payload: UtenteCreateSchema):
    """
    Register a new user with specified role.
    Public endpoint that doesn't require authentication.
    
    Rules:
    1. Unauthenticated users can only register as CLIENTE (default role)
    2. Only authenticated STAFF users can register users with OPERATORE or STAFF roles
    """
    print(f"Register endpoint called with payload: {payload.dict()}")  # Debug log
    
    # Determina se la richiesta è autenticata
    is_authenticated = hasattr(request, 'user') and request.user.is_authenticated
    user_role = request.user.ruolo if is_authenticated else None
    
    success, user, error_dict = UtenteController.register_user(
        payload=payload,
        is_authenticated=is_authenticated,
        user_role=user_role
    )
    
    if not success:
        print(f"Registration error: {str(error_dict)}")  # Log error for debugging
        return 400, error_dict
    
    return 201, user

# Endpoint for getting all users (staff/admin only)
@router.get("/", response=List[UtenteSchema], auth=helpers.api_auth_staff_only)
def list_utenti(request):
    """
    List all users - only accessible to STAFF users
    """
    return UtenteController.list_utenti()

# Endpoint for getting operators and staff, excluding the current user
@router.get("/staff-operatori", response=List[UtenteSchema], auth=helpers.api_auth_any_authenticated)
def list_staff_operatori(request):
    """
    List all users with STAFF or OPERATORE roles, excluding the current user.
    Accessible to any authenticated user.
    """
    return UtenteController.get_staff_operatori(user_id=request.user.id)

# Endpoint for getting a specific user
@router.get("/{utente_id}", response=UtenteDetailSchema, auth=helpers.api_auth_any_authenticated)
def get_utente(request, utente_id: int):
    """
    Get details of a specific user:
    - STAFF can see any user
    - Other users can only see themselves
    """
    utente, error = UtenteController.get_utente(
        utente_id=utente_id,
        user_role=request.user.ruolo,
        user_id=request.user.id
    )
    
    if error:
        return {"error": error}
    
    return utente

# Endpoint for creating a new user (staff/admin only)
@router.post("/", response=UtenteSchema, auth=helpers.api_auth_staff_only)
def create_utente(request, payload: UtenteCreateSchema):
    """
    Create a new user - only accessible to STAFF users
    """
    utente, error = UtenteController.create_utente(payload=payload)
    
    if error:
        return {"error": error}
    
    return utente

# Endpoint for updating a user
@router.put("/{utente_id}", response=UtenteSchema, auth=helpers.api_auth_any_authenticated)
def update_utente(request, utente_id: int, payload: UtenteUpdateSchema):
    """
    Update a user:
    - STAFF can modify STAFF and OPERATORE users but not CLIENTE users
    - Cannot modify passwords of other users
    - Users can only modify themselves
    """"""
    Update a user:
    - STAFF can update any user
    - Other users can only update themselves
    - Only STAFF can change role
    """
    utente, error = UtenteController.update_utente(
        utente_id=utente_id,
        payload=payload,
        user_role=request.user.ruolo,
        user_id=request.user.id
    )
    
    if error:
        return {"error": error}
    
    return utente

# Endpoint for deleting a user (staff/admin only)
@router.delete("/{utente_id}", auth=helpers.api_auth_staff_only)
def delete_utente(request, utente_id: int):
    """
    Delete a user - only accessible to STAFF users
    """
    success, error = UtenteController.delete_utente(utente_id=utente_id)
    
    if not success:
        return {"error": error}
    
    return {"success": True}

# NUOVI ENDPOINT CHE UTILIZZANO IL CONTROLLER

# Endpoint per verificare la disponibilità di un operatore
@router.post("/{operatore_id}/disponibilita", response=DisponibilitaResponseSchema, auth=helpers.api_auth_staff_only)
def verifica_disponibilita_operatore(request, operatore_id: int, payload: DisponibilitaRequestSchema):
    """
    Verifica la disponibilità di un operatore in un determinato periodo.
    Solo gli utenti STAFF possono utilizzare questa funzionalità.
    """
    try:
        # Utilizzo il controller per verificare la disponibilità
        risultato = UtenteController.controlla_disponibilita_operatore(
            operatore_id=operatore_id,
            data_inizio=payload.data_inizio,
            data_fine=payload.data_fine
        )
        
        # Preparo la risposta
        assenze = []
        for assenza in risultato['conflitti']['assenze']:
            assenze.append({
                'id': assenza.id,
                'tipo': assenza.tipo,
                'data_inizio': assenza.data_inizio,
                'data_fine': assenza.data_fine,
                'descrizione': assenza.descrizione
            })
            
        attivita = []
        for att in risultato['conflitti']['attivita']:
            attivita.append({
                'id': att.id,
                'titolo': att.titolo,
                'data': att.data,
                'luogo': att.luogo,
                'stato': att.statoAttivita
            })
        
        return DisponibilitaResponseSchema(
            disponibile=risultato['disponibile'],
            motivi_indisponibilita=risultato['motivi_indisponibilita'],
            assenze=assenze,
            attivita=attivita
        )
    except Exception as e:
        return DisponibilitaResponseSchema(
            disponibile=False,
            motivi_indisponibilita=[f"Errore nel controllare la disponibilità: {str(e)}"]
        )

# Endpoint per creare un'assenza
@router.post("/{utente_id}/assenze", response=Dict, auth=helpers.api_auth_staff_only)
def crea_assenza(request, utente_id: int, payload: AssenzaCreateSchema):
    """
    Crea un'assenza per un utente.
    Solo gli utenti STAFF possono utilizzare questa funzionalità.
    """
    try:
        # Utilizzo il controller per creare l'assenza
        assenza, creata = UtenteController.gestisci_assenza(
            utente_id=utente_id,
            data_inizio=payload.data_inizio,
            data_fine=payload.data_fine,
            tipo=payload.tipo,
            descrizione=payload.descrizione,
            approvata=payload.approvata,
            approvata_da_id=payload.approvata_da_id or request.user.id
        )
        
        # Preparo la risposta
        return {
            'successo': True,
            'messaggio': 'Assenza creata con successo' if creata else 'Assenza aggiornata con successo',
            'assenza': {
                'id': assenza.id,
                'utente_id': assenza.utente.id,
                'tipo': assenza.tipo,
                'data_inizio': assenza.data_inizio,
                'data_fine': assenza.data_fine,
                'descrizione': assenza.descrizione,
                'approvata': assenza.approvata
            }
        }
    except Exception as e:
        return {
            'successo': False,
            'messaggio': f"Errore nella gestione dell'assenza: {str(e)}"
        }

# Endpoint per assegnare un operatore a un'attività
@router.post("/{operatore_id}/assegna-attivita", response=AssegnaOperatoreResponseSchema, auth=helpers.api_auth_staff_only)
def assegna_operatore_attivita(request, operatore_id: int, payload: AssegnaOperatoreRequestSchema):
    """
    Assegna un operatore a un'attività, verificando opzionalmente la disponibilità.
    Solo gli utenti STAFF possono utilizzare questa funzionalità.
    """
    try:
        # Utilizzo il controller per assegnare l'operatore all'attività
        successo, messaggio, utente_attivita = UtenteController.assegna_operatore_a_attivita(
            operatore_id=operatore_id,
            attivita_id=payload.attivita_id,
            verifica_disponibilita=payload.verifica_disponibilita
        )
        
        # Preparo la risposta
        risultato = {
            'successo': successo,
            'messaggio': messaggio
        }
        
        if utente_attivita:
            risultato['utente_attivita'] = {
                'id': utente_attivita.id,
                'utente_id': utente_attivita.utente.id,
                'attivita_id': utente_attivita.attivita.id,
                'data_assegnazione': utente_attivita.data_assegnazione
            }
            
        return risultato
    except Exception as e:
        return {
            'successo': False,
            'messaggio': f"Errore nell'assegnazione dell'operatore all'attività: {str(e)}"
        }

# Endpoint per trovare operatori disponibili in una data
@router.post("/operatori-disponibili", response=OperatoriDisponibiliResponseSchema, auth=helpers.api_auth_staff_only)
def trova_operatori_disponibili(request, payload: OperatoriDisponibiliRequestSchema):
    """
    Trova tutti gli operatori disponibili in una data specifica.
    Solo gli utenti STAFF possono utilizzare questa funzionalità.
    """
    try:
        # Utilizzo il controller per trovare operatori disponibili
        operatori_disponibili = UtenteController.trova_operatori_disponibili(
            data=payload.data,
            luogo=payload.luogo
        )
        
        # Preparo la risposta
        operatori = []
        for operatore in operatori_disponibili:
            operatori.append({
                'id': operatore.id,
                'email': operatore.email,
                'nome': operatore.nome,
                'cognome': operatore.cognome
            })
            
        return OperatoriDisponibiliResponseSchema(operatori=operatori)
    except Exception as e:
        return OperatoriDisponibiliResponseSchema(operatori=[])