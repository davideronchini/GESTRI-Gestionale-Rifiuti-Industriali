from ninja import Router, File
from ninja.files import UploadedFile
from typing import List
from django.shortcuts import get_object_or_404
from django.http import HttpRequest

from .models import Rimorchio
from .schemas import RimorchioSchema, RimorchioCreateSchema, RimorchioUpdateSchema
from controllers.mezzo_controller import MezzoController
import helpers

router = Router(tags=["rimorchi"])

@router.get("/", response=List[RimorchioSchema], auth=helpers.api_auth_staff_or_operatore)
def list_rimorchi(request: HttpRequest):
    """
    Get a list of all rimorchi
    """
    # Usa il controller per ottenere tutti i rimorchi
    return MezzoController.list_rimorchi()

@router.get("/{rimorchio_id}", response=RimorchioSchema, auth=helpers.api_auth_staff_or_operatore)
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

@router.post("/{rimorchio_id}/upload-image", auth=helpers.api_auth_staff_only)
def upload_rimorchio_image(request: HttpRequest, rimorchio_id: int, immagine: UploadedFile = File(...)):
    """
    Upload an image for a rimorchio.
    """
    try:
        # Get the rimorchio
        rimorchio = Rimorchio.objects.get(id=rimorchio_id)
        
        # Delete old image if exists
        if rimorchio.immagine:
            rimorchio.immagine.delete(save=False)
        
        # Save the new image
        rimorchio.immagine = immagine
        rimorchio.save()
        
        return {
            "success": True,
            "immagine": rimorchio.immagine.name if rimorchio.immagine else None
        }
    except Rimorchio.DoesNotExist:
        return {"error": "Rimorchio non trovato"}
    except Exception as e:
        return {"error": str(e)}