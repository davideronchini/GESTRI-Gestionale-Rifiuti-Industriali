from ninja import Router
from typing import List
from django.shortcuts import get_object_or_404
from django.http import HttpRequest

from .models import Rimorchio
from .schemas import RimorchioSchema, RimorchioCreateSchema, RimorchioUpdateSchema
from controllers.mezzo_controller import MezzoController
import helpers

router = Router(tags=["rimorchios"])

@router.get("/", response=List[RimorchioSchema], auth=helpers.api_auth_any_authenticated)
def list_rimorchios(request: HttpRequest):
    """
    Get a list of all rimorchios
    """
    # Usa il controller per ottenere tutti i rimorchi
    return MezzoController.list_rimorchi()

@router.get("/{rimorchio_id}", response=RimorchioSchema, auth=helpers.api_auth_any_authenticated)
def get_rimorchio(request: HttpRequest, rimorchio_id: int):
    """
    Get details of a specific rimorchio by ID
    """
    # Usa il controller per ottenere un rimorchio specifico
    rimorchio, error = MezzoController.get_rimorchio(rimorchio_id)
    
    if error:
        return {"error": error}
    
    return rimorchio

@router.post("/", response=RimorchioSchema, auth=helpers.api_auth_staff_only)
def create_rimorchio(request: HttpRequest, payload: RimorchioCreateSchema):
    """
    Create a new rimorchio
    """
    # Usa il controller per creare un nuovo rimorchio
    rimorchio, error = MezzoController.create_rimorchio(payload)
    
    if error:
        return {"error": error}
    
    return rimorchio

@router.put("/{rimorchio_id}", response=RimorchioSchema, auth=helpers.api_auth_staff_only)
def update_rimorchio(request: HttpRequest, rimorchio_id: int, payload: RimorchioUpdateSchema):
    """
    Update an existing rimorchio
    """
    # Usa il controller per aggiornare un rimorchio esistente
    rimorchio, error = MezzoController.update_rimorchio(rimorchio_id, payload)
    
    if error:
        return {"error": error}
    
    return rimorchio

@router.delete("/{rimorchio_id}", auth=helpers.api_auth_staff_only)
def delete_rimorchio(request: HttpRequest, rimorchio_id: int):
    """
    Delete a rimorchio
    """
    # Usa il controller per eliminare un rimorchio
    success, error = MezzoController.delete_rimorchio(rimorchio_id)
    
    if error:
        return {"error": error}
    
    return {"success": success}