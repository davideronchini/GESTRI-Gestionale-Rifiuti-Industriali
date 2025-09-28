from ninja import Router
from typing import List
from django.shortcuts import get_object_or_404
from django.http import HttpRequest

from .models import MezzoRimorchio
from .schemas import MezzoRimorchioSchema, MezzoRimorchioCreateSchema, MezzoRimorchioUpdateSchema
from controllers.mezzo_controller import MezzoController
import helpers

router = Router(tags=["mezzo_rimorchios"])

@router.get("/", response=List[MezzoRimorchioSchema], auth=helpers.api_auth_any_authenticated)
def list_mezzo_rimorchios(request: HttpRequest):
    """
    Get a list of all mezzo-rimorchio associations
    """
    # Usa il controller per ottenere tutte le associazioni mezzo-rimorchio
    return MezzoController.list_mezzo_rimorchi()

@router.get("/active", response=List[MezzoRimorchioSchema], auth=helpers.api_auth_any_authenticated)
def list_active_mezzo_rimorchios(request: HttpRequest):
    """
    Get a list of all active mezzo-rimorchio associations
    """
    # Usa il controller per ottenere tutte le associazioni mezzo-rimorchio attive
    return MezzoController.list_active_mezzo_rimorchi()

@router.get("/by-stato/{stato}", response=List[MezzoRimorchioSchema], auth=helpers.api_auth_any_authenticated)
def list_mezzo_rimorchio_by_stato(request: HttpRequest, stato: str):
    """
    Get mezzo-rimorchio associations filtered by vehicle state (DISPONIBILE, OCCUPATO, MANUTENZIONE)
    """
    try:
        # Usa il controller per ottenere associazioni mezzo-rimorchio filtrate per stato
        return MezzoController.list_mezzo_rimorchio_by_stato(stato)
    except Exception as e:
        return {"error": str(e)}

@router.get("/mezzo/{mezzo_id}", response=List[MezzoRimorchioSchema], auth=helpers.api_auth_any_authenticated)
def get_mezzo_rimorchio_by_mezzo(request: HttpRequest, mezzo_id: int):
    """
    Get all rimorchio associations for a specific mezzo
    """
    # Usa il controller per ottenere tutte le associazioni rimorchio per un mezzo specifico
    return MezzoController.get_mezzo_rimorchio_by_mezzo(mezzo_id)

@router.get("/rimorchio/{rimorchio_id}", response=List[MezzoRimorchioSchema], auth=helpers.api_auth_any_authenticated)
def get_mezzo_rimorchio_by_rimorchio(request: HttpRequest, rimorchio_id: int):
    """
    Get all mezzo associations for a specific rimorchio
    """
    # Usa il controller per ottenere tutte le associazioni mezzo per un rimorchio specifico
    return MezzoController.get_mezzo_rimorchio_by_rimorchio(rimorchio_id)

@router.get("/{mezzo_rimorchio_id}", response=MezzoRimorchioSchema, auth=helpers.api_auth_any_authenticated)
def get_mezzo_rimorchio(request: HttpRequest, mezzo_rimorchio_id: int):
    """
    Get details of a specific mezzo-rimorchio association by ID
    """
    # Usa il controller per ottenere un'associazione mezzo-rimorchio specifica
    mezzo_rimorchio, error = MezzoController.get_mezzo_rimorchio(mezzo_rimorchio_id)
    
    if error:
        return {"error": error}
    
    return mezzo_rimorchio

@router.post("/", response=MezzoRimorchioSchema, auth=helpers.api_auth_staff_only)
def create_mezzo_rimorchio(request: HttpRequest, payload: MezzoRimorchioCreateSchema):
    """
    Create a new mezzo-rimorchio association
    """
    # Usa il controller per creare una nuova associazione mezzo-rimorchio
    mezzo_rimorchio, error = MezzoController.create_mezzo_rimorchio(payload)
    
    if error:
        return {"error": error}
    
    return mezzo_rimorchio

@router.put("/{mezzo_rimorchio_id}", response=MezzoRimorchioSchema, auth=helpers.api_auth_staff_only)
def update_mezzo_rimorchio(request: HttpRequest, mezzo_rimorchio_id: int, payload: MezzoRimorchioUpdateSchema):
    """
    Update an existing mezzo-rimorchio association
    """
    # Usa il controller per aggiornare un'associazione mezzo-rimorchio esistente
    mezzo_rimorchio, error = MezzoController.update_mezzo_rimorchio(mezzo_rimorchio_id, payload)
    
    if error:
        return {"error": error}
    
    return mezzo_rimorchio

@router.delete("/{mezzo_rimorchio_id}", auth=helpers.api_auth_staff_only)
def delete_mezzo_rimorchio(request: HttpRequest, mezzo_rimorchio_id: int):
    """
    Delete a mezzo-rimorchio association
    """
    # Usa il controller per eliminare un'associazione mezzo-rimorchio
    success, error = MezzoController.delete_mezzo_rimorchio(mezzo_rimorchio_id)
    
    if error:
        return {"error": error}
    
    return {"success": success}