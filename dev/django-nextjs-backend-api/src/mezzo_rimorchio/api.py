from ninja import Router
from typing import List
from django.shortcuts import get_object_or_404
from django.http import HttpRequest
from pydantic import BaseModel

from .models import MezzoRimorchio
from .schemas import MezzoRimorchioSchema, MezzoRimorchioCreateSchema, MezzoRimorchioUpdateSchema
from controllers.mezzo_controller import MezzoController
import helpers
from django.http import JsonResponse

router = Router(tags=["mezzi_rimorchi"])


class FilterRequest(BaseModel):
    filters: List[str] = []


@router.get("/", response=List[MezzoRimorchioSchema], auth=helpers.api_auth_staff_or_operatore)
def list_mezzi_rimorchi(request: HttpRequest):
    """
    Get a list of all active mezzo-rimorchio associations
    """
    try:
        return MezzoController.list_mezzi_rimorchi()
    except Exception as e:
        print(f"Errore in list_mezzi_rimorchi: {str(e)}")
        return []


@router.post("/", response=MezzoRimorchioSchema, auth=helpers.api_auth_staff_only)
def create_mezzo_rimorchio(request: HttpRequest, payload: MezzoRimorchioCreateSchema):
    """
    Create a new mezzo-rimorchio association
    """
    try:
        result = MezzoController.create_mezzo_rimorchio(payload)
        return result
    except Exception as e:
        return JsonResponse({'detail': str(e)}, status=400)


@router.get("/disponibili/", response=List[MezzoRimorchioSchema], auth=helpers.api_auth_staff_or_operatore)
def list_disponibili_mezzo_rimorchi(request: HttpRequest):
    """
    Get a list of mezzo-rimorchio associations where the vehicle status is DISPONIBILE
    """
    try:
        # Debug log per verificare quale path arriva effettivamente
        try:
            path_info = getattr(request, 'path', None) or getattr(request, 'get_full_path', lambda: None)()
        except Exception:
            path_info = None
        print(f"[mezzo_rimorchio.disponibili] invoked; request.path={path_info}")

        # Usa il controller per ottenere le associazioni mezzo-rimorchio con mezzi disponibili
        try:
            return MezzoController.list_mezzo_rimorchio_disponibili()
        except Exception as e:
            print(f"Errore in list_disponibili_mezzo_rimorchi: {str(e)}")
            return []
    except Exception as e:
        print(f"Errore in list_disponibili_mezzo_rimorchi: {str(e)}")
        return []


@router.get("/{mezzo_rimorchio_id}", response=MezzoRimorchioSchema, auth=helpers.api_auth_staff_or_operatore)
def get_mezzo_rimorchio(request: HttpRequest, mezzo_rimorchio_id: int):
    """
    Get a specific mezzo-rimorchio association by ID
    """
    try:
        return MezzoController.get_mezzo_rimorchio(mezzo_rimorchio_id)
    except Exception as e:
        return JsonResponse({'detail': str(e)}, status=400)


@router.delete("/{mezzo_rimorchio_id}", auth=helpers.api_auth_staff_only)
def delete_mezzo_rimorchio(request: HttpRequest, mezzo_rimorchio_id: int):
    """
    Delete a mezzo-rimorchio association by setting it as inactive
    """
    try:
        return MezzoController.delete_mezzo_rimorchio(mezzo_rimorchio_id)
    except MezzoRimorchio.DoesNotExist:
        return JsonResponse({'detail': 'Mezzo-rimorchio non trovato'}, status=404)
    except Exception as e:
        return JsonResponse({'detail': str(e)}, status=400)


@router.get("/cerca/{term}", response=List[MezzoRimorchioSchema], auth=helpers.api_auth_staff_only)
def cerca_mezzo_rimorchi(request: HttpRequest, term: str):
    """
    Search endpoint: automatically searches by targa.
    If term is empty, returns all mezzo-rimorchio associations.
    """
    try:
        return MezzoController.cerca_mezzo_rimorchi(term)
    except Exception as e:
        print(f"Errore in cerca_mezzo_rimorchi: {str(e)}")
        return []


@router.post("/filter-by/{value}", response=List[MezzoRimorchioSchema], auth=helpers.api_auth_staff_only)
def filter_mezzo_rimorchi(request: HttpRequest, value: str, filter_data: FilterRequest):
    """
    Filter endpoint with multiple filters support.
    Accepts filters in the request body and applies them to search for the given value.
    """
    try:
        filters = filter_data.filters
        return MezzoController.filter_mezzo_rimorchi(value, filters)
    except Exception as e:
        print(f"Errore in filter_mezzi_rimorchi: {str(e)}")
        return []


@router.get("/disponibili/", response=List[MezzoRimorchioSchema], auth=helpers.api_auth_staff_or_operatore)
def list_disponibili_mezzo_rimorchi(request: HttpRequest):
    """
    Get a list of mezzo-rimorchio associations where the vehicle status is DISPONIBILE
    """
    try:
        # Debug log per verificare quale path arriva effettivamente
        try:
            path_info = getattr(request, 'path', None) or getattr(request, 'get_full_path', lambda: None)()
        except Exception:
            path_info = None
        print(f"[mezzo_rimorchio.disponibili] invoked; request.path={path_info}")

        # Usa il controller per ottenere le associazioni mezzo-rimorchio con mezzi disponibili
        return MezzoController.list_mezzo_rimorchio_disponibili()
    except Exception as e:
        print(f"Errore in list_disponibili_mezzo_rimorchi: {str(e)}")
        return []


@router.get("/by-stato/{stato}", response=List[MezzoRimorchioSchema], auth=helpers.api_auth_staff_or_operatore)
def list_mezzo_rimorchio_by_stato(request: HttpRequest, stato: str):
    """
    Get mezzo-rimorchio associations filtered by vehicle state (DISPONIBILE, OCCUPATO, MANUTENZIONE)
    """
    try:
        # Usa il controller per ottenere associazioni mezzo-rimorchio filtrate per stato
        return MezzoController.list_mezzo_rimorchio_by_stato(stato)
    except Exception as e:
        return {"error": str(e)}

