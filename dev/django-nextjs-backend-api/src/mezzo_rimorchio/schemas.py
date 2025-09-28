from ninja import Schema
from typing import Optional
from datetime import datetime

class MezzoRimorchioBaseSchema(Schema):
    """
    Base schema for MezzoRimorchio with common fields
    """
    mezzo_id: int
    rimorchio_id: int
    attivo: bool = True

class MezzoRimorchioCreateSchema(MezzoRimorchioBaseSchema):
    """
    Schema for creating a MezzoRimorchio association
    """
    pass

class MezzoRimorchioUpdateSchema(Schema):
    """
    Schema for updating a MezzoRimorchio
    Only includes fields that can be updated
    """
    attivo: Optional[bool] = None
    data_dissociazione: Optional[datetime] = None

class MezzoRimorchioSchema(MezzoRimorchioBaseSchema):
    """
    Schema for retrieving a MezzoRimorchio
    Includes all fields plus id and metadata
    """
    id: int
    data_associazione: datetime
    data_dissociazione: Optional[datetime] = None
    data_creazione: datetime
    data_modifica: datetime