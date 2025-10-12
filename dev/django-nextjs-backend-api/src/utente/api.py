from typing import List, Dict, Any
from datetime import datetime, date, timedelta
from django.utils import timezone
from ninja import Router, Schema
from django.contrib.auth import get_user_model, authenticate
from django.http import HttpRequest
from ninja.errors import ValidationError, HttpError
from ninja_jwt.tokens import RefreshToken
from .models import Utente, Ruolo
from .schemas import (
    UtenteSchema, UtenteCreateSchema, ErrorUtenteCreateSchema, 
    LoginSchema, TokenSchema, UtenteListSchema, UtenteDetailSchema
)
from .schemas import UtenteUpdateSchema
from django.db.models import Q
from assenza.models import Assenza
from utente_attivita.models import UtenteAttivita
from attivita.models import Attivita
from documento.models import Documento
import helpers.api_auth as helpers
# Importo il controller
from controllers.utente_controller import UtenteController
from pydantic import BaseModel

router = Router()


class FilterRequest(BaseModel):
    filters: List[str] = []


def calcola_stato_utente(utente):
    """
    Calcola lo stato dell'utente basandosi su assenze e attività.
    
    Logica:
    1. ASSENTE (giallo/arancione): ha un'assenza nella data odierna
    2. OCCUPATO (giallo/arancione): sta lavorando in un'attività in questo momento
       (data attività + durata >= ora corrente)
    3. DISPONIBILE (verde): tutti gli altri casi
    
    Returns:
        str: 'ASSENTE', 'OCCUPATO', or 'DISPONIBILE'
    """
    from django.db.models import Q
    now = timezone.now()
    today = now.date()
    
    # 1. Controlla se ha assenze oggi
    from assenza.models import Assenza
    
    # Controlla sia il campo operatore che utente (per compatibilità)
    assenze_oggi = Assenza.objects.filter(
        Q(operatore=utente) | Q(utente=utente),
        dataInizio__lte=today,
        dataFine__gte=today
    ).exists()
    
    if assenze_oggi:
        return 'ASSENTE'
    
    # 2. Controlla se sta lavorando in un'attività ora
    from utente_attivita.models import UtenteAttivita
    from attivita.models import Attivita
    
    # Ottieni le attività assegnate all'utente
    utente_attivita = UtenteAttivita.objects.filter(
        utente=utente
    ).select_related('attivita')
    
    for ua in utente_attivita:
        attivita = ua.attivita
        
        # Salta se l'attività non ha data o durata
        if not attivita.data or not attivita.durata:
            continue
        
        # Calcola la data/ora di fine dell'attività
        data_inizio = attivita.data
        durata_minuti = attivita.durata
        data_fine = data_inizio + timedelta(minutes=durata_minuti)
        
        # Controlla se l'utente sta lavorando ora
        if data_inizio <= now <= data_fine:
            return 'OCCUPATO'
    
    # 3. Altrimenti è disponibile
    return 'DISPONIBILE'

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


# Authenticated create user endpoint (for backoffice use)
@router.post("/", response={201: UtenteSchema, 400: ErrorUtenteCreateSchema}, auth=helpers.api_auth_any_authenticated)
def create_user(request: HttpRequest, payload: UtenteCreateSchema):
    """
    Create a new user (authenticated). Uses the same controller logic as public register,
    but requires authentication and honors role constraints for assigning roles.
    """
    try:
        is_authenticated = True
        user_role = getattr(request.user, 'ruolo', None)

        success, user, error_dict = UtenteController.register_user(
            payload=payload,
            is_authenticated=is_authenticated,
            user_role=user_role
        )

        if not success:
            return 400, error_dict

        return 201, user
    except Exception as e:
        return 400, {"detail": str(e)}


# ========== CRUD Endpoints for Utenti ==========

@router.get("/", response=List[UtenteListSchema], auth=helpers.api_auth_any_authenticated)
def list_utenti(request: HttpRequest):
    """
    Get all users with computed status.
    Status is calculated based on absences and current activities.
    """
    try:
        # Mostra solo utenti con ruolo OPERATORE o STAFF (escludi CLIENTE)
        utenti = Utente.objects.filter(ruolo__in=[Ruolo.OPERATORE, Ruolo.STAFF])

        result = []
        for utente in utenti:
            stato = calcola_stato_utente(utente)
            
            utente_data = {
                'id': utente.id,
                'nome': utente.nome,
                'cognome': utente.cognome,
                'email': utente.email,
                'stato': stato,
                'ruolo': utente.ruolo,
            }
            result.append(utente_data)
        
        return result
    except Exception as e:
        print(f"Errore in list_utenti: {str(e)}")
        return []


@router.get("/{utente_id}", response=UtenteDetailSchema, auth=helpers.api_auth_any_authenticated)
def get_utente(request: HttpRequest, utente_id: int):
    """
    Get a single user by ID with computed status.
    """
    try:
        utente = Utente.objects.get(id=utente_id)
        stato = calcola_stato_utente(utente)

        # Recupera le assenze associate all'utente (sia campo operatore che utente per compatibilità)
        assenze_qs = Assenza.objects.filter(Q(operatore_id=utente_id) | Q(utente_id=utente_id)).order_by('-dataInizio')
        assenze_list = []
        for a in assenze_qs:
            assenze_list.append({
                'id': a.id,
                'operatore_id': a.operatore_id,
                'utente_id': getattr(a, 'utente_id', None),
                'tipoAssenza': getattr(a, 'tipoAssenza', None) or getattr(a, 'tipo', None),
                'dataInizio': getattr(a, 'dataInizio', None) or getattr(a, 'data', None) or getattr(a, 'data_inizio', None),
                'dataFine': getattr(a, 'dataFine', None) or getattr(a, 'data_fine', None),
            })

        # Usa l'helper del controller per ottenere attività e documenti
        attivita = []
        attivita = []
        attestati = []
        try:
            helper_result, helper_err = UtenteController.get_attivita_e_documenti_per_utente(
                utente_id=utente_id,
                requesting_user_role=getattr(request.user, 'ruolo', None) if hasattr(request, 'user') else None,
                requesting_user_id=getattr(request.user, 'id', None) if hasattr(request, 'user') else None,
            )
            if helper_err is None and helper_result is not None:
                attivita = helper_result.get('attivita', [])
                attestati = helper_result.get('attestati', [])
        except Exception:
            attivita_assigned = []
            attivita_create = []
            documenti_non_fir = []

        return {
            'id': utente.id,
            'nome': utente.nome,
            'cognome': utente.cognome,
            'dataDiNascita': getattr(utente, 'dataDiNascita', None),
            'luogoDiNascita': getattr(utente, 'luogoDiNascita', None),
            'residenza': getattr(utente, 'residenza', None),
            'email': utente.email,
            'stato': stato,
            'ruolo': utente.ruolo,
            'isAutenticato': getattr(utente, 'isAutenticato', bool(getattr(utente, 'is_authenticated', False))),
            'date_joined': getattr(utente, 'date_joined', None),
            'last_login': getattr(utente, 'last_login', None),
            'assenze': assenze_list,
            'attivita': attivita,
            'attestati': attestati,
        }
    except Utente.DoesNotExist:
        raise HttpError(404, "Utente non trovato")
    except Exception as e:
        print(f"Errore in get_utente: {str(e)}")
        raise HttpError(500, str(e))


@router.put("/{utente_id}", response=UtenteDetailSchema, auth=helpers.api_auth_any_authenticated)
def update_utente(request: HttpRequest, utente_id: int, payload: UtenteUpdateSchema):
    """
    Aggiorna i dettagli di un utente.
    STAFF può aggiornare qualsiasi utente; gli utenti normali possono aggiornare solo se stessi.
    """
    try:
        requesting_role = getattr(request.user, 'ruolo', None) if hasattr(request, 'user') else None
        requesting_id = getattr(request.user, 'id', None) if hasattr(request, 'user') else None

        user_obj, err = UtenteController.update_user(utente_id, payload, requesting_user_role=requesting_role, requesting_user_id=requesting_id)

        if err is not None:
            raise HttpError(403, err)

        # Ricalcola stato
        stato = calcola_stato_utente(user_obj)

        # Recupera assenze e attività come in get_utente
        assenze_qs = Assenza.objects.filter(Q(operatore_id=utente_id) | Q(utente_id=utente_id)).order_by('-dataInizio')
        assenze_list = []
        for a in assenze_qs:
            assenze_list.append({
                'id': a.id,
                'operatore_id': a.operatore_id,
                'utente_id': getattr(a, 'utente_id', None),
                'tipoAssenza': getattr(a, 'tipoAssenza', None) or getattr(a, 'tipo', None),
                'dataInizio': getattr(a, 'dataInizio', None) or getattr(a, 'data', None) or getattr(a, 'data_inizio', None),
                'dataFine': getattr(a, 'dataFine', None) or getattr(a, 'data_fine', None),
            })

        # Ottieni attivita e attestati tramite controller helper
        attivita = []
        attestati = []
        try:
            helper_result, helper_err = UtenteController.get_attivita_e_documenti_per_utente(
                utente_id=utente_id,
                requesting_user_role=requesting_role,
                requesting_user_id=requesting_id,
            )
            if helper_err is None and helper_result is not None:
                attivita = helper_result.get('attivita', [])
                attestati = helper_result.get('attestati', [])
        except Exception:
            attivita = []
            attestati = []

        return {
            'id': user_obj.id,
            'nome': user_obj.nome,
            'cognome': user_obj.cognome,
            'dataDiNascita': getattr(user_obj, 'dataDiNascita', None),
            'luogoDiNascita': getattr(user_obj, 'luogoDiNascita', None),
            'residenza': getattr(user_obj, 'residenza', None),
            'email': user_obj.email,
            'stato': stato,
            'ruolo': user_obj.ruolo,
            'isAutenticato': getattr(user_obj, 'isAutenticato', bool(getattr(user_obj, 'is_authenticated', False))),
            'date_joined': getattr(user_obj, 'date_joined', None),
            'last_login': getattr(user_obj, 'last_login', None),
            'assenze': assenze_list,
            'attivita': attivita,
            'attestati': attestati,
        }
    except HttpError as he:
        raise he
    except Exception as e:
        print(f"Errore in update_utente: {str(e)}")
        raise HttpError(500, str(e))


@router.delete("/{utente_id}", auth=helpers.api_auth_any_authenticated)
def delete_utente(request: HttpRequest, utente_id: int):
    """
    Delete a user.
    """
    try:
        utente = Utente.objects.get(id=utente_id)
        utente.delete()
        return {"success": True, "message": "Utente eliminato con successo"}
    except Utente.DoesNotExist:
        return {"error": "Utente non trovato"}
    except Exception as e:
        print(f"Errore in delete_utente: {str(e)}")
        return {"error": str(e)}


@router.get("/cerca/{term}", response=List[UtenteListSchema], auth=helpers.api_auth_any_authenticated)
def cerca_utenti(request: HttpRequest, term: str):
    """
    Search endpoint: searches by nome + cognome (concatenated) when no filters are active.
    If term is empty, returns all users.
    """
    try:
        # Cerca solo tra OPERATORE e STAFF
        utenti = Utente.objects.filter(ruolo__in=[Ruolo.OPERATORE, Ruolo.STAFF])

        # Converti in lista di dict con stato calcolato
        base_list = []
        for utente in utenti:
            stato = calcola_stato_utente(utente)
            utente_data = {
                'id': utente.id,
                'nome': utente.nome,
                'cognome': utente.cognome,
                'email': utente.email,
                'stato': stato,
                'ruolo': utente.ruolo,
            }
            base_list.append(utente_data)
        
        # Se il termine è vuoto, restituisci tutti gli utenti
        if not term or term.strip() == '':
            return base_list
        
        term_lower = term.strip().lower()
        results = []

        for u in base_list:
            # Cerca in nome + cognome concatenati
            # Gestisci None/null convertendo in stringa vuota
            try:
                nome = u.get('nome') or ''
                cognome = u.get('cognome') or ''
                nome_completo = f"{nome} {cognome}".strip().lower()
                
                # Se nome_completo è vuoto (entrambi None), non matchare
                # Altrimenti cerca il termine
                if nome_completo and term_lower in nome_completo:
                    results.append(u)
            except Exception:
                pass

        return results
    except Exception as e:
        print(f"Errore in cerca_utenti: {str(e)}")
        return []


@router.post("/filter-by/{value}", response=List[UtenteListSchema], auth=helpers.api_auth_any_authenticated)
def filter_utenti(request: HttpRequest, value: str, filter_data: FilterRequest):
    """
    Filter endpoint with multiple filters support.
    Accepts filters in the request body and applies them to search for the given value.
    """
    try:
        filters = filter_data.filters

        # Filtra solo tra utenti OPERATORE e STAFF
        utenti = Utente.objects.filter(ruolo__in=[Ruolo.OPERATORE, Ruolo.STAFF])

        # Converti in lista di dict con stato calcolato
        base_list = []
        for utente in utenti:
            stato = calcola_stato_utente(utente)
            utente_data = {
                'id': utente.id,
                'nome': utente.nome,
                'cognome': utente.cognome,
                'email': utente.email,
                'stato': stato,
                'ruolo': utente.ruolo,
            }
            base_list.append(utente_data)
        
        # Se non ci sono filtri o il valore è vuoto, restituisci tutti gli utenti
        if not filters or not value or value.strip() == '':
            return base_list
        
        value_lower = value.strip().lower()
        results = []
        
        for u in base_list:
            matched = False
            
            for field in filters:
                f = field.lower()
                
                if f in ("id",):
                    try:
                        id_str = str(u.get('id', '')).lower()
                        if value_lower == id_str or value_lower in id_str:
                            matched = True
                            break
                    except Exception:
                        pass
                elif f in ("nome",):
                    if u.get('nome') and value_lower in u['nome'].lower():
                        matched = True
                        break
                elif f in ("cognome",):
                    if u.get('cognome') and value_lower in u['cognome'].lower():
                        matched = True
                        break
                elif f in ("email",):
                    if u.get('email') and value_lower in u['email'].lower():
                        matched = True
                        break
                elif f in ("stato",):
                    if u.get('stato') and value_lower in u['stato'].lower():
                        matched = True
                        break
                elif f in ("ruolo",):
                    if u.get('ruolo') and value_lower in u['ruolo'].lower():
                        matched = True
                        break
            
            if matched:
                results.append(u)
        
        return results
    except Exception as e:
        print(f"Errore in filter_utenti: {str(e)}")
        return []
