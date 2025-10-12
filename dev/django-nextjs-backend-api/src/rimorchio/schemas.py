from ninja import Schema
from typing import Optional
from datetime import datetime

class RimorchioBaseSchema(Schema):
    """
    Base schema for Rimorchio with common fields
    """
    nome: str
    capacitaDiCarico: float
    tipoRimorchio: str

class RimorchioCreateSchema(RimorchioBaseSchema):
    """
    Schema for creating a Rimorchio
    """
    pass

class RimorchioUpdateSchema(Schema):
    """
    Schema for updating a Rimorchio
    Only includes fields that can be updated
    """
    nome: Optional[str] = None
    capacitaDiCarico: Optional[float] = None
    tipoRimorchio: Optional[str] = None

class RimorchioSchema(RimorchioBaseSchema):
    """
    Schema for retrieving a Rimorchio
    Includes all fields plus id and metadata
    """
    id: int
    immagine: Optional[str] = None
    data_creazione: Optional[datetime] = None
    data_modifica: Optional[datetime] = None