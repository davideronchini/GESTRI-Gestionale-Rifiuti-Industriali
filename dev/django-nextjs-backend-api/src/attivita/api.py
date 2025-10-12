from ninja import Router
from typing import List, Dict, Any
from datetime import datetime
from django.http import HttpRequest
from pydantic import BaseModel

from .schemas import AttivitaSchema, AttivitaDetailSchema, AttivitaUpdateSchema, AttivitaCreateSchema
import helpers
from controllers.attivita_controller import AttivitaController
from django.http import JsonResponse
from django.core.exceptions import PermissionDenied
from django.http import Http404

router = Router(tags=["attivita"])


class FilterRequest(BaseModel):
    filters: List[str] = []


@router.get("/", response=List[AttivitaSchema], auth=helpers.api_auth_any_authenticated)
def list_attivita(request: HttpRequest):
    """
    Get all activities based on user role.
    """
    try:
        user_role = getattr(request.user, 'ruolo', None)
        user_id = getattr(request.user, 'id', None)

        # Controllo di sicurezza per l'autenticazione
        if not user_role or not user_id:
            return []

        # Usa il controller per ottenere tutte le attività filtrate per ruolo
        attivita = AttivitaController.list_attivita(
            user_role=user_role,
            user_id=user_id
        )
        return list(attivita)
    except Exception as e:
        # In caso di errore, restituisci una lista vuota invece di rompere il frontend
        print(f"Errore in list_attivita: {str(e)}")
        return []

@router.get("/{attivita_id}", response=AttivitaDetailSchema, auth=helpers.api_auth_any_authenticated)
def get_attivita(request: HttpRequest, attivita_id: int):
    """
    Get details of a specific activity with related objects based on user role.
    Returns complete activity data including associated users and vehicles.
    """
    try:
        attivita_detail, error = AttivitaController.get_attivita_detail(
            attivita_id=attivita_id,
            user_role=request.user.ruolo,
            user_id=request.user.id
        )
        
        if error:
            return {"error": error}
        
        return attivita_detail
    except Exception as e:
        return {"error": str(e)}


@router.post("/", response=AttivitaDetailSchema, auth=helpers.api_auth_staff_only)
def create_attivita(request: HttpRequest, payload: AttivitaCreateSchema):
    """
    Create a new activity.
    All authenticated users can create activities.
    """
    try:
        attivita, error = AttivitaController.create_attivita(
            payload=payload,
            user_role=request.user.ruolo,
            user_id=request.user.id
        )
        
        if error:
            return {"error": error}
        
        # Return detailed activity data
        attivita_detail, detail_error = AttivitaController.get_attivita_detail(
            attivita_id=attivita.id,
            user_role=request.user.ruolo,
            user_id=request.user.id
        )
        
        if detail_error:
            return {"error": detail_error}
            
        return attivita_detail
    except Exception as e:
        return {"error": str(e)}




@router.delete("/{attivita_id}", auth=helpers.api_auth_staff_or_cliente)
def delete_attivita(request: HttpRequest, attivita_id: int):
    """
    Delete an activity by ID.
    """
    try:
        success, error = AttivitaController.delete_attivita(
            attivita_id=attivita_id,
            user_role=request.user.ruolo,
            user_id=request.user.id
        )

        if error:
            return {"error": error}

        return {"success": success}
    except Exception as e:
        return {"error": str(e)}


@router.put("/{attivita_id}", response=AttivitaDetailSchema, auth=helpers.api_auth_staff_or_cliente)
def update_attivita(request: HttpRequest, attivita_id: int, payload: AttivitaUpdateSchema):
    """
    Update an activity by ID.
    Only STAFF and the creator (CLIENTE) can update the activity.
    """
    try:
        # Convert payload to dict, excluding None values
        update_data = payload.dict(exclude_unset=True)
        
        attivita_detail, error = AttivitaController.update_attivita(
            attivita_id=attivita_id,
            user_role=request.user.ruolo,
            user_id=request.user.id,
            update_data=update_data
        )
        
        if error:
            return {"error": error}
        
        return attivita_detail
    except Exception as e:
        return {"error": str(e)}


@router.post("/filter-by/{value}", response=List[AttivitaSchema], auth=helpers.api_auth_any_authenticated)
def filter_attivita_multiple(request: HttpRequest, value: str, filter_data: FilterRequest):
    """
    Filter endpoint with multiple filters support.
    Accepts filters in the request body and applies them to search for the given value.
    """
    try:
        user_role = getattr(request.user, 'ruolo', None)
        user_id = getattr(request.user, 'id', None)

        # Controllo di sicurezza per l'autenticazione
        if not user_role or not user_id:
            return []
        
        # Get filters from the request body schema
        filters = filter_data.filters
        
        # Ottieni le attività base filtrate per ruolo
        base_qs = list(AttivitaController.list_attivita(user_role=user_role, user_id=user_id))
        
        # Se non ci sono filtri specificati O il valore è vuoto, restituisci tutte le attività
        if not filters or not value or value.strip() == '':
            return list(base_qs)
        
        value_lower = value.strip().lower()
        results = []
        
        for a in base_qs:
            matched = False
            
            # Controlla se il valore di ricerca corrisponde a uno dei campi filtrati
            for field in filters:
                f = field.lower()
                
                # Mappa i campi ai controller specifici quando disponibili
                if f in ("stato", "statoattivita"):
                    if hasattr(a, 'statoAttivita') and a.statoAttivita:
                        if value_lower in a.statoAttivita.lower():
                            matched = True
                            break
                elif f in ("tipo", "titolo"):
                    if hasattr(a, 'titolo') and a.titolo:
                        if value_lower in a.titolo.lower():
                            matched = True
                            break
                elif f in ("luogo",):
                    if hasattr(a, 'luogo') and a.luogo:
                        if value_lower in a.luogo.lower():
                            matched = True
                            break
                elif f in ("codiceCer", "codice_cer", "codicecer"):
                    if hasattr(a, 'codiceCer') and a.codiceCer:
                        if value_lower in a.codiceCer.lower():
                            matched = True
                            break
                elif f in ("data", "date"):
                    if hasattr(a, 'data') and a.data:
                        try:
                            date_str = a.data.strftime("%Y-%m-%d") if hasattr(a.data, 'strftime') else str(a.data)
                            if value_lower in date_str.lower():
                                matched = True
                                break
                        except Exception:
                            pass
                elif f in ("id",):
                    try:
                        # Per ID, controlla sia match esatto che contenimento case insensitive
                        id_str = str(a.id).lower()
                        if value_lower == id_str or value_lower in id_str:
                            matched = True
                            break
                    except Exception:
                        pass
                else:
                    # Fallback: prova a cercare nel campo generico
                    val = getattr(a, field, None)
                    if val is None:
                        val = getattr(a, field.lower(), None)
                    if val is not None:
                        try:
                            s = str(val).lower()
                            if value_lower in s:
                                matched = True
                                break
                        except Exception:
                            continue
            
            if matched:
                results.append(a)
        
        return list(results)
    except Exception as e:
        # In caso di errore, restituisci una lista vuota invece di rompere il frontend
        print(f"Errore in filter_attivita_multiple: {str(e)}")
        return []


@router.get("/cerca/{term}", response=List[AttivitaSchema], auth=helpers.api_auth_any_authenticated)
def cerca_attivita(request: HttpRequest, term: str):
    """
    Search endpoint: automatically searches by titolo.
    If term is empty, returns all activities.
    Results are limited to the activities visible to the requesting user (role-scoped).
    """
    try:
        user_role = getattr(request.user, 'ruolo', None)
        user_id = getattr(request.user, 'id', None)

        # Controllo di sicurezza per l'autenticazione
        if not user_role or not user_id:
            return []

        base_qs = list(AttivitaController.list_attivita(user_role=user_role, user_id=user_id))
        
        # Se il termine è vuoto, nullo, o contiene solo spazi, restituisci tutte le attività
        if not term or term.strip() == '':
            return list(base_qs)
        
        term_lower = term.strip().lower()
        results = []

        for a in base_qs:
            # match solo nel titolo
            try:
                if a.titolo and term_lower in a.titolo.lower():
                    results.append(a)
            except Exception:
                pass

        return list(results)
    except Exception as e:
        # In caso di errore, restituisci una lista vuota invece di rompere il frontend
        print(f"Errore in cerca_attivita: {str(e)}")
        return []
    

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

        # Ensure the request has an authenticated user with role and id
        user_role = getattr(request.user, 'ruolo', None)
        user_id = getattr(request.user, 'id', None)

        if not user_role or not user_id:
            # If user is not authenticated or missing role/id, return empty list
            # (keeps behavior consistent with other list endpoints)
            return []

        # Use the controller to obtain activities filtered by date and role
        attivita = AttivitaController.list_attivita_by_date(
            data=data_obj,
            user_role=user_role,
            user_id=user_id
        )

        return list(attivita)
            
    except ValueError:
        return JsonResponse({"detail": "Formato data non valido. Usa YYYY-MM-DD"}, status=400)
    except PermissionDenied as e:
        return JsonResponse({'detail': str(e)}, status=403)
    except Http404 as e:
        return JsonResponse({'detail': str(e)}, status=404)
    except Exception as e:
        return JsonResponse({'detail': 'Internal server error'}, status=500)
    
@router.get("/{attivita_id}/documento", auth=helpers.api_auth_staff_or_operatore)
def get_documento_by_attivita(request: HttpRequest, attivita_id: int):
    """
    Get document associated with a specific activity.
    """
    try:
        # Uses the controller to get document for the activity (with authorization)
        documento = AttivitaController.get_documento_by_attivita(
            attivita_id=attivita_id,
            user_role=request.user.ruolo,
            user_id=request.user.id
        )
        return documento
            
    except PermissionDenied as e:
        return JsonResponse({'detail': str(e)}, status=403)
    except Http404 as e:
        return JsonResponse({'detail': str(e)}, status=404)
    except Exception as e:
        return JsonResponse({'detail': 'Internal server error'}, status=500)


class AssociaMezzoRequest(BaseModel):
    mezzo_rimorchio_id: int


@router.post("/{attivita_id}/associa-mezzo", auth=helpers.api_auth_staff_only)
def associa_mezzo_attivita(request: HttpRequest, attivita_id: int, payload: AssociaMezzoRequest):
    """
    Associate a mezzo-rimorchio to an activity.
    If a mezzo is already associated, it will be replaced.
    """
    try:
        success, error = AttivitaController.associa_mezzo_rimorchio(
            attivita_id=attivita_id,
            mezzo_rimorchio_id=payload.mezzo_rimorchio_id,
            user_role=request.user.ruolo,
            user_id=request.user.id
        )
        
        if error:
            return {"error": error}
        
        return {"success": success, "message": "Mezzo associato con successo"}
    except Exception as e:
        return {"error": str(e)}


@router.delete("/{attivita_id}/dissocia-mezzo", auth=helpers.api_auth_staff_only)
def dissocia_mezzo_attivita(request: HttpRequest, attivita_id: int):
    """
    Dissociate mezzo-rimorchio from an activity.
    """
    try:
        success, error = AttivitaController.dissocia_mezzo_rimorchio(
            attivita_id=attivita_id,
            user_role=request.user.ruolo,
            user_id=request.user.id
        )
        
        if error:
            return {"error": error}
        
        return {"success": success, "message": "Mezzo dissociato con successo"}
    except Exception as e:
        return {"error": str(e)}


@router.get("/{attivita_id}/operatori/disponibili", response=List[Dict[str, Any]], auth=helpers.api_auth_staff_only)
def list_operatori_disponibili(request: HttpRequest, attivita_id: int):
    """
    Get a list of available operators (OPERATORE role) that can be assigned to an activity.
    Returns all active operators regardless of current assignments.
    """
    try:
        operatori = AttivitaController.list_operatori_disponibili(attivita_id=attivita_id)
        return operatori
    except Exception as e:
        return {"error": str(e)}


@router.get("/operatore/{operatore_id}", response=List[AttivitaSchema], auth=helpers.api_auth_staff_only)
def list_attivita_by_operatore(request: HttpRequest, operatore_id: int):
    """
    Return activities where the given user is assigned or is the creator.
    This is used by the frontend 'utenti' page to show activities related to a specific user.
    """
    try:
        user_role = getattr(request.user, 'ruolo', None)
        user_id = getattr(request.user, 'id', None)

        # Use controller to get activities for operator. Controller will handle permissions.
        attivita = AttivitaController.list_attivita_for_operatore(
            operatore_id=operatore_id,
            requesting_user_role=user_role,
            requesting_user_id=user_id
        )

        # The controller is expected to return an iterable of Attivita-like objects or dicts
        return list(attivita)
    except Exception as e:
        print(f"Errore in list_attivita_by_operatore: {str(e)}")
        return []


class AssociaOperatoreRequest(BaseModel):
    operatore_id: int


@router.post("/{attivita_id}/associa-operatore", auth=helpers.api_auth_staff_only)
def associa_operatore_attivita(request: HttpRequest, attivita_id: int, payload: AssociaOperatoreRequest):
    """
    Associate an operator to an activity.
    """
    try:
        success, error = AttivitaController.associa_operatore(
            attivita_id=attivita_id,
            operatore_id=payload.operatore_id,
            user_role=request.user.ruolo,
            user_id=request.user.id
        )
        
        if error:
            return {"error": error}
        
        return {"success": success, "message": "Operatore associato con successo"}
    except Exception as e:
        return {"error": str(e)}


@router.delete("/{attivita_id}/dissocia-operatore/{operatore_id}", auth=helpers.api_auth_staff_only)
def dissocia_operatore_attivita(request: HttpRequest, attivita_id: int, operatore_id: int):
    """
    Dissociate an operator from an activity.
    """
    try:
        success, error = AttivitaController.dissocia_operatore(
            attivita_id=attivita_id,
            operatore_id=operatore_id,
            user_role=request.user.ruolo,
            user_id=request.user.id
        )
        
        if error:
            return {"error": error}
        
        return {"success": success, "message": "Operatore dissociato con successo"}
    except Exception as e:
        return {"error": str(e)}