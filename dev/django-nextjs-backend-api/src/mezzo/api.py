from ninja import Router, File
from ninja.files import UploadedFile
from typing import List
from django.http import HttpRequest

from .schemas import MezzoSchema, MezzoUpdateSchema, MezzoCreateSchema
import helpers
from controllers.mezzo_controller import MezzoController

router = Router(tags=["mezzo"])

@router.get("/by-targa/{targa}", auth=helpers.api_auth_staff_or_operatore)
def get_mezzo_by_targa(request: HttpRequest, targa: str):
    """
    Get a specific mezzo by targa (license plate).
    """
    try:
        mezzo_data, error = MezzoController.get_mezzo_by_targa(targa)
        
        if error:
            return {"error": error}
        
        return mezzo_data
            
    except Exception as e:
        return {"error": str(e)}

@router.post("/", auth=helpers.api_auth_staff_only)
def create_mezzo(request: HttpRequest, payload: MezzoCreateSchema):
    """
    Create a new mezzo.
    """
    try:
        mezzo_data, error = MezzoController.create_mezzo(payload)
        
        if error:
            return {"error": error}
        
        return mezzo_data
            
    except Exception as e:
        return {"error": str(e)}

@router.get("/{mezzo_id}", auth=helpers.api_auth_staff_or_operatore)
def get_mezzo(request: HttpRequest, mezzo_id: int):
    """
    Get a specific mezzo by ID.
    """
    try:
        mezzo_data, error = MezzoController.get_mezzo(mezzo_id)
        
        if error:
            return {"error": error}
        
        return mezzo_data
            
    except Exception as e:
        return {"error": str(e)}

@router.put("/{mezzo_id}", auth=helpers.api_auth_staff_only)
def update_mezzo(request: HttpRequest, mezzo_id: int, payload: MezzoUpdateSchema):
    """
    Update an existing mezzo.
    """
    try:
        mezzo_data, error = MezzoController.update_mezzo(mezzo_id, payload)
        
        if error:
            return {"error": error}
        
        return mezzo_data
            
    except Exception as e:
        return {"error": str(e)}

@router.get("/by-stato/{stato_mezzo}", auth=helpers.api_auth_staff_or_operatore)
def list_mezzi_by_stato(request: HttpRequest, stato_mezzo: str):
    """
    Get vehicles filtered by status.
    Status values: DISPONIBILE, OCCUPATO, MANUTENZIONE
    """
    # Validate stato_mezzo
    valid_states = ['DISPONIBILE', 'OCCUPATO', 'MANUTENZIONE']
    if stato_mezzo not in valid_states:
        return {"error": f"Invalid state. Valid states are: {', '.join(valid_states)}"}
    
    try:
        # Uses the controller to get vehicles filtered by status
        mezzi = MezzoController.list_mezzi_by_stato(stato_mezzo=stato_mezzo)
        return mezzi
            
    except Exception as e:
        return {"error": str(e)}

@router.post("/{mezzo_id}/upload-image", auth=helpers.api_auth_staff_only)
def upload_mezzo_image(request: HttpRequest, mezzo_id: int, immagine: UploadedFile = File(...)):
    """
    Upload an image for a mezzo.
    """
    try:
        from mezzo.models import Mezzo
        
        # Get the mezzo
        mezzo = Mezzo.objects.get(id=mezzo_id)
        
        # Delete old image if exists
        if mezzo.immagine:
            mezzo.immagine.delete(save=False)
        
        # Save the new image
        mezzo.immagine = immagine
        mezzo.save()
        
        return {
            "success": True,
            "immagine": mezzo.immagine.name if mezzo.immagine else None
        }
    except Mezzo.DoesNotExist:
        return {"error": "Mezzo non trovato"}
    except Exception as e:
        return {"error": str(e)}