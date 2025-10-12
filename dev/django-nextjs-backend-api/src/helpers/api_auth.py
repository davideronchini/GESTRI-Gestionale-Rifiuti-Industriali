from ninja_jwt.authentication import JWTAuth
from typing import Callable, List
from utente.models import Ruolo


"""Helpers for API authentication and authorization.

This module exposes two kinds of utilities:

- simple checkers (functions that accept a Django `request` and return
  True/False) e.g. `require_staff_or_operatore`. Use these when you need to
  perform an authorization check inside controller logic or tests.

- Ninja auth stacks (lists) e.g. `api_auth_staff_or_operatore` that combine
  `JWTAuth()` with a role-checker and are intended to be passed to Ninja
  endpoints via `auth=`. These ensure the token is validated and then the
  role is checked.

Examples:
    @router.get('/x', auth=api_auth_user_required)
    def view(request):
        ...

    if not require_staff_or_operatore(request):
        raise PermissionDenied()

The `auth_with_roles` helper builds `[JWTAuth(), require_roles(...)]` stacks.
"""


def allow_anon(request) -> bool:
    """Allow anonymous access (used for public endpoints).

    This checker always returns True so Ninja treats the request as allowed
    by this particular auth backend. Useful for public endpoints or when
    you want optional token usage (see `api_auth_user_or_anon`).
    """
    return True


def require_authenticated(request) -> bool:
    """Require a logged-in user (any role)."""
    return getattr(request.user, "is_authenticated", False)


def require_roles(*roles) -> Callable:
    """Factory returning a request-check function that allows only users with
    one of the supplied roles.

    Usage:
        require_staff = require_roles(Ruolo.STAFF)
    """

    def checker(request) -> bool:
        try:
            return bool(request.user.is_authenticated and request.user.ruolo in roles)
        except Exception:
            return False

    return checker


# Backwards-compatible named checkers used by the codebase
require_staff = require_roles(Ruolo.STAFF)
require_staff_or_operatore = require_roles(Ruolo.STAFF, Ruolo.OPERATORE)
require_staff_or_cliente = require_roles(Ruolo.STAFF, Ruolo.CLIENTE)


# Ninja auth lists
api_auth_user_required: List[Callable] = [JWTAuth()]
api_auth_user_or_anon: List[Callable] = [JWTAuth(), allow_anon]
api_public: List[Callable] = [allow_anon]


def auth_with_roles(*roles) -> List[Callable]:
    """Return a Ninja auth list combining JWTAuth and the role checker."""
    return [JWTAuth(), require_roles(*roles)]


# Common stacks
api_auth_staff_only = auth_with_roles(Ruolo.STAFF)
api_auth_staff_or_operatore = auth_with_roles(Ruolo.STAFF, Ruolo.OPERATORE)
api_auth_staff_or_cliente = auth_with_roles(Ruolo.STAFF, Ruolo.CLIENTE)
api_auth_any_authenticated = auth_with_roles(Ruolo.STAFF, Ruolo.OPERATORE, Ruolo.CLIENTE)