from ninja import Router
from typing import List, Dict, Any
from datetime import datetime
from django.http import HttpRequest
from pydantic import BaseModel

from .schemas import AttivitaSchema, AttivitaDetailSchema
import helpers
from controllers.attivita_controller import AttivitaController

router = Router(tags=["attivita"])

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


@router.delete("/{attivita_id}", auth=helpers.api_auth_any_authenticated)
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


@router.get("/filter-by/{field}/{value}", response=List[AttivitaSchema], auth=helpers.api_auth_any_authenticated)
def filter_attivita(request: HttpRequest, field: str, value: str):
    """
    Generic filter endpoint. Tries to map common fields to controller methods
    (stato, tipo, utente, mezzo_rimorchio, data). Otherwise falls back to
    filtering the role-scoped activities by attribute contains (case-insensitive).
    """
    try:
        user_role = request.user.ruolo
        user_id = request.user.id

        # Se il valore è vuoto, restituisci tutte le attività
        if not value or value.strip() == '':
            base_qs = list(AttivitaController.list_attivita(user_role=user_role, user_id=user_id))
            return list(base_qs)

        # Normalize field
        f = field.lower()
        value = value.strip()

        # Map some known fields to controller helpers when available
        if f in ("stato", "statoattivita"):
            attivita = AttivitaController.list_attivita_by_stato(value, user_role, user_id)
            return list(attivita)

        if f in ("tipo",):
            attivita = AttivitaController.list_attivita_by_tipo(value, user_role, user_id)
            return list(attivita)

        if f in ("utente", "utente_id", "utenteid"):
            try:
                uid = int(value)
            except ValueError:
                return {"error": "utente id non valido"}
            attivita = AttivitaController.list_attivita_by_utente(uid, user_role, user_id)
            return list(attivita)

        if f in ("mezzo_rimorchio", "mezzo-rimorchio", "mezzo_rimorchio_id"):
            try:
                mrid = int(value)
            except ValueError:
                return {"error": "mezzo_rimorchio id non valido"}
            attivita = AttivitaController.list_attivita_by_mezzo_rimorchio(mrid, user_role, user_id)
            return list(attivita)

        if f in ("data", "date"):
            try:
                from datetime import datetime
                data_obj = datetime.strptime(value, "%Y-%m-%d").date()
            except ValueError:
                return {"error": "Formato data non valido. Usa YYYY-MM-DD"}
            attivita = AttivitaController.list_attivita_by_date(data_obj, user_role, user_id)
            return list(attivita)

        # Fallback: get the role-scoped activities and filter in Python by attribute contains
        base_qs = list(AttivitaController.list_attivita(user_role=user_role, user_id=user_id))
        value_lower = value.lower()
        filtered = []
        for a in base_qs:
            # safe getattr
            val = getattr(a, field, None)
            if val is None:
                # try with lowercase field name
                val = getattr(a, field.lower(), None)
            if val is None:
                continue
            try:
                s = str(val).lower()
            except Exception:
                continue
            if value_lower in s:
                filtered.append(a)

        return list(filtered)
    except Exception as e:
        return {"error": str(e)}


class FilterRequest(BaseModel):
    filters: List[str] = []

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