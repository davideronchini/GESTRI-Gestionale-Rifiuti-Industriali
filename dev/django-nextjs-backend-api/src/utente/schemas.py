from typing import List, Any, Optional
from datetime import datetime, date
from ninja import Schema
from pydantic import EmailStr


class AssenzaSchema(Schema):
    id: int
    operatore_id: Optional[int] = None
    tipoAssenza: Optional[str] = None
    dataInizio: Optional[date] = None
    dataFine: Optional[date] = None


class AttivitaSummarySchema(Schema):
    """
    Lightweight activity summary returned on user detail.
    """
    id: int
    titolo: Optional[str] = None
    statoAttivita: Optional[str] = None
    data: Optional[datetime] = None
    luogo: Optional[str] = None


class DocumentoSummarySchema(Schema):
    """
    Lightweight document summary for non-FIR documents.
    """
    id: int
    tipoDocumento: Optional[str] = None
    dataInserimento: Optional[datetime] = None
    dataScadenza: Optional[date] = None
    file: Optional[str] = None
    operatore_id: Optional[int] = None

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
    # Related entities
    assenze: List[AssenzaSchema] = []
    attivita: List[AttivitaSummarySchema] = []
    attestati: List[DocumentoSummarySchema] = []

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

class UtenteListSchema(Schema):
    """
    Schema for user list with computed status.
    Status values:
    - ASSENTE: User has an absence today (yellow/orange)
    - OCCUPATO: User is currently working on an activity (yellow/orange)
    - DISPONIBILE: User is available (green)
    """
    id: int
    nome: Optional[str] = None
    cognome: Optional[str] = None
    email: EmailStr
    stato: str  # ASSENTE, OCCUPATO, DISPONIBILE
    ruolo: Optional[str] = None
