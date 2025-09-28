from ninja import Router
from typing import List, Dict, Any
from django.http import HttpRequest
from django.shortcuts import get_object_or_404

from .models import UtenteAttivita
from controllers.attivita_controller import AttivitaController
import helpers

router = Router(tags=["utente_attivita"])

@router.get("/", response=List[Dict[str, Any]], auth=helpers.api_auth_staff_only)
def list_utente_attivita(request: HttpRequest):
    """
    Get a list of all user-activity associations.
    Only STAFF users can access this endpoint.
    """
    # Usa il controller per ottenere tutte le associazioni utente-attività
    return [
        {
            "id": ua.id,
            "utente_id": ua.utente_id,
            "attivita_id": ua.attivita_id,
            "data_assegnazione": ua.data_assegnazione
        }
        for ua in AttivitaController.list_utente_attivita()
    ]

@router.get("/{utente_attivita_id}", response=Dict[str, Any], auth=helpers.api_auth_staff_only)
def get_utente_attivita(request: HttpRequest, utente_attivita_id: int):
    """
    Get a specific user-activity association by ID.
    Only STAFF users can access this endpoint.
    """
    # Usa il controller per ottenere un'associazione utente-attività specifica
    utente_attivita, error = AttivitaController.get_utente_attivita(utente_attivita_id)
    
    if error:
        return {"error": error}
    
    return {
        "id": utente_attivita.id,
        "utente_id": utente_attivita.utente_id,
        "attivita_id": utente_attivita.attivita_id,
        "data_assegnazione": utente_attivita.data_assegnazione
    }

@router.post("/", response=Dict[str, Any], auth=helpers.api_auth_staff_only)
def create_utente_attivita(request: HttpRequest, utente_id: int, attivita_id: int):
    """
    Create a new user-activity association.
    Only STAFF users can access this endpoint.
    """
    # Usa il controller per creare una nuova associazione utente-attività
    utente_attivita, error = AttivitaController.create_utente_attivita(utente_id, attivita_id)
    
    if error:
        return {"error": error}
    
    return {
        "id": utente_attivita.id,
        "utente_id": utente_attivita.utente_id,
        "attivita_id": utente_attivita.attivita_id,
        "data_assegnazione": utente_attivita.data_assegnazione,
        "message": "Associazione utente-attività creata con successo"
    }

@router.delete("/{utente_attivita_id}", response=Dict[str, Any], auth=helpers.api_auth_staff_only)
def delete_utente_attivita(request: HttpRequest, utente_attivita_id: int):
    """
    Delete a user-activity association.
    Only STAFF users can access this endpoint.
    """
    # Usa il controller per eliminare un'associazione utente-attività
    success, error = AttivitaController.delete_utente_attivita(utente_attivita_id)
    
    if error:
        return {"error": error}
    
    return {"success": success, "message": "Associazione utente-attività eliminata con successo"}