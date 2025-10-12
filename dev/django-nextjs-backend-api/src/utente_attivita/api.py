from ninja import Router
from typing import List, Dict, Any
from django.http import HttpRequest
from django.shortcuts import get_object_or_404

from .models import UtenteAttivita
from controllers.attivita_controller import AttivitaController
from django.shortcuts import get_object_or_404
from typing import Dict, Any
import helpers

router = Router(tags=["utente_attivita"])

@router.get("/", response=List[Dict[str, Any]], auth=helpers.api_auth_staff_only)
def list_utente_attivita(request: HttpRequest):
    """
    Get a list of all user-activity associations.
    Only STAFF users can access this endpoint.
    """
    # Use the model directly to list associations (controller helper may be absent)
    return [
        {
            "id": ua.id,
            "utente_id": ua.utente_id,
            "attivita_id": ua.attivita_id,
            "data_assegnazione": ua.data_assegnazione
        }
        for ua in UtenteAttivita.objects.all()
    ]

@router.get("/{utente_attivita_id}", response=Dict[str, Any], auth=helpers.api_auth_staff_only)
def get_utente_attivita(request: HttpRequest, utente_attivita_id: int):
    """
    Get a specific user-activity association by ID.
    Only STAFF users can access this endpoint.
    """
    # Use model directly
    try:
        ua = UtenteAttivita.objects.get(id=utente_attivita_id)
    except UtenteAttivita.DoesNotExist:
        return {"error": "Associazione non trovata"}

    return {
        "id": ua.id,
        "utente_id": ua.utente_id,
        "attivita_id": ua.attivita_id,
        "data_assegnazione": ua.data_assegnazione
    }

@router.post("/", response=Dict[str, Any], auth=helpers.api_auth_staff_only)
def create_utente_attivita(request: HttpRequest, utente_id: int, attivita_id: int):
    """
    Create a new user-activity association.
    Only STAFF users can access this endpoint.
    """
    # Create association directly via models for simplicity
    try:
        ua = UtenteAttivita.objects.create(utente_id=utente_id, attivita_id=attivita_id)
        return {
            "id": ua.id,
            "utente_id": ua.utente_id,
            "attivita_id": ua.attivita_id,
            "data_assegnazione": ua.data_assegnazione,
            "message": "Associazione utente-attività creata con successo"
        }
    except Exception as e:
        return {"error": str(e)}

@router.delete("/{utente_attivita_id}", response=Dict[str, Any], auth=helpers.api_auth_staff_only)
def delete_utente_attivita(request: HttpRequest, utente_attivita_id: int):
    """
    Delete a user-activity association.
    Only STAFF users can access this endpoint.
    """
    try:
        ua = UtenteAttivita.objects.get(id=utente_attivita_id)
        ua.delete()
        return {"success": True, "message": "Associazione utente-attività eliminata con successo"}
    except UtenteAttivita.DoesNotExist:
        return {"error": "Associazione non trovata"}
    except Exception as e:
        return {"error": str(e)}