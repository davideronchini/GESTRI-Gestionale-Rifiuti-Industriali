from typing import List, Optional
from ninja import Router, Schema
from django.shortcuts import get_object_or_404
from datetime import date
import helpers
from .models import Assenza
from controllers.utente_controller import UtenteController

router = Router()

class AssenzaSchema(Schema):
    id: int
    operatore_id: Optional[int] = None
    tipoAssenza: Optional[str] = None
    dataInizio: Optional[date] = None
    dataFine: Optional[date] = None
    # Campi vecchi inclusi per compatibilità
    utente_id: Optional[int] = None
    tipo: Optional[str] = None
    data_inizio: Optional[date] = None
    data_fine: Optional[date] = None

class AssenzaCreateSchema(Schema):
    operatore_id: int
    tipoAssenza: str
    dataInizio: date
    dataFine: date

class AssenzaUpdateSchema(Schema):
    tipoAssenza: Optional[str] = None
    dataInizio: Optional[date] = None
    dataFine: Optional[date] = None
    operatore_id: Optional[int] = None

# Endpoint per ottenere tutte le assenze
@router.get("/", response=List[AssenzaSchema], auth=helpers.api_auth_any_authenticated)
def list_assenze(request):
    """
    Ottiene tutte le assenze in base al ruolo dell'utente.
    - STAFF vede tutte le assenze
    - Gli utenti normali vedono solo le proprie assenze
    """
    return UtenteController.list_assenze(
        user_role=request.user.ruolo,
        user_id=request.user.id
    )

# Endpoint per ottenere un'assenza specifica
@router.get("/{assenza_id}", response=AssenzaSchema, auth=helpers.api_auth_any_authenticated)
def get_assenza(request, assenza_id: int):
    """
    Ottiene un'assenza specifica.
    - STAFF può vedere qualsiasi assenza
    - Gli utenti normali possono vedere solo le proprie assenze
    """
    assenza, error = UtenteController.get_assenza(
        assenza_id=assenza_id,
        user_role=request.user.ruolo,
        user_id=request.user.id
    )
    
    if error:
        return {"error": error}
    
    return assenza

# Endpoint per creare una nuova assenza
@router.post("/", response=AssenzaSchema, auth=helpers.api_auth_staff_only)
def create_assenza(request, payload: AssenzaCreateSchema):
    """
    Crea una nuova assenza.
    - STAFF può creare assenze per qualsiasi utente
    - Gli utenti normali possono creare assenze solo per sé stessi
    """
    assenza, error = UtenteController.create_assenza(
        payload=payload,
        user_role=request.user.ruolo,
        user_id=request.user.id
    )
    
    if error:
        return {"error": error}
    
    return assenza

# Endpoint per aggiornare un'assenza
@router.put("/{assenza_id}", response=AssenzaSchema, auth=helpers.api_auth_staff_only)
def update_assenza(request, assenza_id: int, payload: AssenzaUpdateSchema):
    """
    Aggiorna un'assenza esistente.
    - STAFF può aggiornare qualsiasi assenza
    - Gli utenti normali possono aggiornare solo le proprie assenze
    """
    assenza, error = UtenteController.update_assenza(
        assenza_id=assenza_id,
        payload=payload,
        user_role=request.user.ruolo,
        user_id=request.user.id
    )
    
    if error:
        return {"error": error}
    
    return assenza

# Endpoint per eliminare un'assenza
@router.delete("/{assenza_id}", auth=helpers.api_auth_staff_only)
def delete_assenza(request, assenza_id: int):
    """
    Elimina un'assenza.
    - STAFF può eliminare qualsiasi assenza
    - Gli utenti normali possono eliminare solo le proprie assenze
    """
    success, error = UtenteController.delete_assenza(
        assenza_id=assenza_id,
        user_role=request.user.ruolo,
        user_id=request.user.id
    )
    
    if not success:
        return {"error": error}
    
    return {"success": True}

# Endpoint per ottenere assenze per operatore
@router.get("/operatore/{operatore_id}", response=List[AssenzaSchema], auth=helpers.api_auth_any_authenticated)
def get_assenze_by_operatore(request, operatore_id: int):
    """
    Ottiene tutte le assenze per un operatore specifico.
    - STAFF può vedere le assenze di qualsiasi operatore
    - Gli utenti normali possono vedere solo le proprie assenze
    """
    assenze, error = UtenteController.get_assenze_by_operatore(
        operatore_id=operatore_id,
        user_role=request.user.ruolo,
        user_id=request.user.id
    )
    
    if error:
        return {"error": error}
    
    return assenze