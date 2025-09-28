from ninja import Router
from typing import List
from django.http import HttpRequest

from .schemas import MezzoSchema
import helpers
from controllers.mezzo_controller import MezzoController

router = Router(tags=["mezzo"])

@router.get("/by-stato/{stato_mezzo}", auth=helpers.api_auth_any_authenticated)
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