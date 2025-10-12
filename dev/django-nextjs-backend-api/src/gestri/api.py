from ninja import NinjaAPI
from ninja.errors import HttpError
import traceback

from ninja_extra import NinjaExtraAPI
from ninja_jwt.authentication import JWTAuth

# Ninja JWT controller may import pydantic models at import-time which can raise
# errors (e.g. when versions mismatch) and break test collection/startup. Guard
# the import so tests can run even if the optional JWT controller is not
# available in the environment.
try:
  from ninja_jwt.controller import NinjaJWTDefaultController
except Exception as e:  # pragma: no cover - environment-dependent
  NinjaJWTDefaultController = None
  print("Warning: ninja_jwt.controller import failed; JWT controller not registered:", e)

import helpers
from utente.schemas import UtenteSchema, UtenteDetailSchema, UtenteUpdateSchema
from controllers.utente_controller import UtenteController
from django.db.models import Q
from assenza.models import Assenza
from django.utils import timezone

#default auth for all endpoints unless specified otherwise
api = NinjaExtraAPI()

# Register the default JWT controller only when import succeeded.
if NinjaJWTDefaultController is not None:
  api.register_controllers(NinjaJWTDefaultController)
api.add_router("/utenti/", "utente.api.router")
api.add_router("/documenti/", "documento.api.router")
api.add_router("/assenze/", "assenza.api.router")
api.add_router("/mezzi/", "mezzo.api.router")
api.add_router("/rimorchi/", "rimorchio.api.router")
api.add_router("/mezzi-rimorchi/", "mezzo_rimorchio.api.router")
api.add_router("/attivita/", "attivita.api.router")
api.add_router("/utente-attivita/", "utente_attivita.api.router")

@api.get("/whoami", response=UtenteSchema, auth=helpers.api_auth_any_authenticated)
def me(request):
  request.user.isAutenticato = request.user.is_authenticated
  return request.user


@api.get("/profile", response=UtenteDetailSchema, auth=helpers.api_auth_any_authenticated)
def profile_get(request):
  """Returns full profile of the authenticated user, including related entities."""
  try:
    user = request.user
    user.isAutenticato = user.is_authenticated

    # Assenze for both legacy fields (operatore/utente)
    assenze_qs = Assenza.objects.filter(Q(operatore_id=user.id) | Q(utente_id=user.id)).order_by('-dataInizio')
    assenze_list = []
    for a in assenze_qs:
      assenze_list.append({
        'id': a.id,
        'operatore_id': getattr(a, 'operatore_id', None),
        'utente_id': getattr(a, 'utente_id', None),
        'tipoAssenza': getattr(a, 'tipoAssenza', None) or getattr(a, 'tipo', None),
        'dataInizio': getattr(a, 'dataInizio', None) or getattr(a, 'data', None) or getattr(a, 'data_inizio', None),
        'dataFine': getattr(a, 'dataFine', None) or getattr(a, 'data_fine', None),
      })

    # Attività e attestati tramite controller helper
    attivita = []
    attestati = []
    try:
      helper_result, helper_err = UtenteController.get_attivita_e_documenti_per_utente(
        utente_id=user.id,
        requesting_user_role=getattr(request.user, 'ruolo', None),
        requesting_user_id=getattr(request.user, 'id', None),
      )
      if helper_err is None and helper_result is not None:
        attivita = helper_result.get('attivita', [])
        attestati = helper_result.get('attestati', [])
    except Exception:
      attivita = []
      attestati = []

    return {
      'id': user.id,
      'email': user.email,
      'nome': getattr(user, 'nome', None),
      'cognome': getattr(user, 'cognome', None),
      'dataDiNascita': getattr(user, 'dataDiNascita', None),
      'luogoDiNascita': getattr(user, 'luogoDiNascita', None),
      'residenza': getattr(user, 'residenza', None),
      'ruolo': getattr(user, 'ruolo', None),
      'isAutenticato': bool(getattr(user, 'is_authenticated', False)),
      'date_joined': getattr(user, 'date_joined', None),
      'last_login': getattr(user, 'last_login', None),
      'assenze': assenze_list,
      'attivita': attivita,
      'attestati': attestati,
    }
  except Exception as e:
    # Log full traceback for debugging on the server and raise a sanitized 500
    tb = traceback.format_exc()
    print(f"Unhandled exception in /profile GET: {tb}")
    raise HttpError(500, "Internal server error while building profile")


@api.put("/profile", response=UtenteDetailSchema, auth=helpers.api_auth_any_authenticated)
def profile_put(request, payload: UtenteUpdateSchema):
  """Updates the authenticated user's profile."""
  try:
    requesting_role = getattr(request.user, 'ruolo', None)
    requesting_id = getattr(request.user, 'id', None)

    user_obj, err = UtenteController.update_user(request.user.id, payload, requesting_user_role=requesting_role, requesting_user_id=requesting_id)
    if err is not None:
      # Return 403 if not authorized or validation failed
      raise HttpError(403, err)

    # Rebuild related data like in GET
    assenze_qs = Assenza.objects.filter(Q(operatore_id=user_obj.id) | Q(utente_id=user_obj.id)).order_by('-dataInizio')
    assenze_list = []
    for a in assenze_qs:
      assenze_list.append({
        'id': a.id,
        'operatore_id': getattr(a, 'operatore_id', None),
        'utente_id': getattr(a, 'utente_id', None),
        'tipoAssenza': getattr(a, 'tipoAssenza', None) or getattr(a, 'tipo', None),
        'dataInizio': getattr(a, 'dataInizio', None) or getattr(a, 'data', None) or getattr(a, 'data_inizio', None),
        'dataFine': getattr(a, 'dataFine', None) or getattr(a, 'data_fine', None),
      })

    attivita = []
    attestati = []
    try:
      helper_result, helper_err = UtenteController.get_attivita_e_documenti_per_utente(
        utente_id=user_obj.id,
        requesting_user_role=requesting_role,
        requesting_user_id=requesting_id,
      )
      if helper_err is None and helper_result is not None:
        attivita = helper_result.get('attivita', [])
        attestati = helper_result.get('attestati', [])
    except Exception:
      attivita = []
      attestati = []

    return {
      'id': user_obj.id,
      'email': user_obj.email,
      'nome': getattr(user_obj, 'nome', None),
      'cognome': getattr(user_obj, 'cognome', None),
      'dataDiNascita': getattr(user_obj, 'dataDiNascita', None),
      'luogoDiNascita': getattr(user_obj, 'luogoDiNascita', None),
      'residenza': getattr(user_obj, 'residenza', None),
      'ruolo': getattr(user_obj, 'ruolo', None),
      'isAutenticato': bool(getattr(user_obj, 'is_authenticated', False)),
      'date_joined': getattr(user_obj, 'date_joined', None),
      'last_login': getattr(user_obj, 'last_login', None),
      'assenze': assenze_list,
      'attivita': attivita,
      'attestati': attestati,
    }
  except HttpError:
    # re-raise HttpErrors as-is (403s, etc.)
    raise
  except Exception as e:
    tb = traceback.format_exc()
    print(f"Unhandled exception in /profile PUT: {tb}")
    raise HttpError(500, "Internal server error while updating profile")


@api.delete("/profile", auth=helpers.api_auth_any_authenticated)
def profile_delete(request):
  """Deletes the authenticated user's account."""
  try:
    u = request.user
    uid = u.id
    u.delete()
    return { 'success': True, 'message': 'Utente eliminato con successo', 'id': uid }
  except Exception as e:
    tb = traceback.format_exc()
    print(f"Unhandled exception in /profile DELETE: {tb}")
    # Return a sanitized error response
    return { 'success': False, 'error': 'Internal server error while deleting profile' }