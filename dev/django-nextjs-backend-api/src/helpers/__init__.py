"""helpers package exports

This file re-exports selected names from `api_auth.py` so callers can do
`from helpers import api_auth_staff_or_operatore`.

`__all__` lists the public symbols exported by the package.
"""

from .api_auth import (
    api_auth_user_required,
    api_auth_user_or_anon,
    api_public,
    api_auth_staff_only,
    api_auth_staff_or_operatore,
    api_auth_staff_or_cliente,
    api_auth_any_authenticated,
    require_staff,
    require_staff_or_operatore,
    require_staff_or_cliente,
    require_authenticated,
    # newly exposed helpers from the refactor
    allow_anon,
    require_roles,
    auth_with_roles,
)


__all__ = [
    "api_auth_user_required",
    "api_auth_user_or_anon",
    "api_public",
    "api_auth_staff_only",
    "api_auth_staff_or_operatore",
    "api_auth_staff_or_cliente",
    "api_auth_any_authenticated",
    "require_staff",
    "require_staff_or_operatore",
    "require_staff_or_cliente",
    "require_authenticated",
    # newly exported names
    "allow_anon",
    "require_roles",
    "auth_with_roles",
]