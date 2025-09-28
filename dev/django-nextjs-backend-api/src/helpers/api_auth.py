from ninja_jwt.authentication import JWTAuth
from typing import List, Callable, Optional, Any
from utente.models import Ruolo

def allow_anon(request):
    """
    Authentication function that allows anonymous access.
    Returns True to indicate the user is authenticated, even when they are not.
    This enables public endpoints that don't require authentication.
    """
    return True

def require_staff(request):
    """
    Richiede che l'utente sia autenticato e abbia ruolo STAFF.
    Usato per operazioni che solo gli amministratori possono eseguire.
    """
    return request.user.is_authenticated and request.user.ruolo == Ruolo.STAFF

def require_staff_or_operatore(request):
    """
    Richiede che l'utente sia autenticato e abbia ruolo STAFF o OPERATORE.
    Usato per operazioni che possono essere eseguite da amministratori o operatori.
    """
    return request.user.is_authenticated and request.user.ruolo in [Ruolo.STAFF, Ruolo.OPERATORE]

def require_staff_or_cliente(request):
    """
    Richiede che l'utente sia autenticato e abbia ruolo STAFF o CLIENTE.
    Usato per operazioni che possono essere eseguite da amministratori o clienti.
    """
    return request.user.is_authenticated and request.user.ruolo in [Ruolo.STAFF, Ruolo.CLIENTE]

def require_authenticated(request):
    """
    Richiede che l'utente sia autenticato (qualsiasi ruolo).
    Usato per operazioni che richiedono autenticazione, indipendentemente dal ruolo.
    """
    return request.user.is_authenticated

# Standard JWT authentication, requiring valid token
api_auth_user_required = [JWTAuth()]

# JWT auth or anonymous access both allowed
# First tries JWT, and if that fails, uses allow_anon which always succeeds
api_auth_user_or_anon = [JWTAuth(), allow_anon]

# No authentication required at all - public access
api_public = [allow_anon]

# Solo utenti con ruolo STAFF possono accedere
api_auth_staff_only = [JWTAuth(), require_staff]

# Solo utenti con ruolo STAFF o OPERATORE possono accedere
api_auth_staff_or_operatore = [JWTAuth(), require_staff_or_operatore]

# Solo utenti con ruolo STAFF o CLIENTE possono accedere
api_auth_staff_or_cliente = [JWTAuth(), require_staff_or_cliente]

# Qualsiasi utente autenticato può accedere (STAFF, OPERATORE, CLIENTE)
api_auth_any_authenticated = [JWTAuth(), require_authenticated]