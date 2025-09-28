from ninja import Router
from typing import List
from datetime import datetime
from django.http import HttpRequest

from .schemas import AttivitaSchema
import helpers
from controllers.attivita_controller import AttivitaController

router = Router(tags=["attivita"])

@router.get("/by-date/{data}", response=List[AttivitaSchema], auth=helpers.api_auth_any_authenticated)
def list_attivita_by_date(request: HttpRequest, data: str):
    """
    Get activities scheduled for a specific date based on user role.
    Date format: YYYY-MM-DD
    Filters by the 'data' field (activity scheduled date).
    """
    try:
        from datetime import datetime, date
        data_obj = datetime.strptime(data, "%Y-%m-%d").date()
        
        # Usa il controller per ottenere le attività filtrate per la data di svolgimento
        attivita = AttivitaController.list_attivita_by_date(
            data=data_obj,
            user_role=request.user.ruolo,
            user_id=request.user.id
        )

        return list(attivita)
            
    except ValueError:
        return {"error": "Formato data non valido. Usa YYYY-MM-DD"}
    except Exception as e:
        return {"error": str(e)}

@router.get("/{attivita_id}/documento", auth=helpers.api_auth_any_authenticated)
def get_documento_by_attivita(request: HttpRequest, attivita_id: int):
    """
    Get document associated with a specific activity.
    """
    try:
        # Uses the controller to get document for the activity
        documento = AttivitaController.get_documento_by_attivita(attivita_id=attivita_id)
        return documento
            
    except Exception as e:
        return {"error": str(e)}