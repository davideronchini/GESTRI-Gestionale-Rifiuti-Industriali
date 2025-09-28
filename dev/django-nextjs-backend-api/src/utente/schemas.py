from typing import List, Any, Optional
from datetime import datetime, date
from ninja import Schema
from pydantic import EmailStr

class UtenteCreateSchema(Schema):
    """
    Schema for creating a new user.
    """
    email: EmailStr
    password: str
    nome: Optional[str] = None
    cognome: Optional[str] = None
    dataDiNascita: Optional[date] = None
    luogoDiNascita: Optional[str] = None
    residenza: Optional[str] = None
    ruolo: Optional[str] = None

class UtenteSchema(Schema):
    """
    Schema for user data representation in API responses.
    """
    id: int
    email: EmailStr
    nome: Optional[str] = None
    cognome: Optional[str] = None
    dataDiNascita: Optional[date] = None
    luogoDiNascita: Optional[str] = None
    residenza: Optional[str] = None
    ruolo: Optional[str] = None
    isAutenticato: bool
    date_joined: datetime
    last_login: Optional[datetime] = None

class UtenteDetailSchema(Schema):
    """
    Schema for detailed user information including relationships.
    """
    id: int
    email: EmailStr
    nome: Optional[str] = None
    cognome: Optional[str] = None
    dataDiNascita: Optional[date] = None
    luogoDiNascita: Optional[str] = None
    residenza: Optional[str] = None
    ruolo: Optional[str] = None
    isAutenticato: bool
    date_joined: datetime
    last_login: Optional[datetime] = None
    # These will be added when we implement the related models
    # assenze: List[AssenzaSchema] = []
    # attestati: List[DocumentoSchema] = []
    # attivita: List[AttivitaSchema] = []

class UtenteUpdateSchema(Schema):
    """
    Schema for updating user information (all fields optional).
    """
    email: Optional[EmailStr] = None
    nome: Optional[str] = None
    cognome: Optional[str] = None
    dataDiNascita: Optional[date] = None
    luogoDiNascita: Optional[str] = None
    residenza: Optional[str] = None
    ruolo: Optional[str] = None
    is_active: Optional[bool] = None

class PasswordChangeSchema(Schema):
    """
    Schema for password change.
    """
    current_password: str
    new_password: str
    confirm_password: str

class LoginSchema(Schema):
    """
    Schema for login.
    """
    email: EmailStr
    password: str

class TokenSchema(Schema):
    """
    Schema for JWT token.
    """
    access: str
    refresh: str

class ErrorUtenteCreateSchema(Schema):
    """
    Schema for user creation errors.
    """
    email: List[Any] = []
    password: List[Any] = []
    non_field_errors: List[Any] = []