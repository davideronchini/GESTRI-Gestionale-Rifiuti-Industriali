from ninja import Schema
from typing import Optional
from datetime import datetime, date

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

class MezzoNestedSchema(Schema):
    """
    Nested schema for Mezzo details in MezzoRimorchio
    """
    id: int
    targa: str
    statoMezzo: str
    chilometraggio: int
    scadenzaRevisione: Optional[date] = None
    scadenzaAssicurazione: Optional[date] = None
    isDanneggiato: bool
    immagine: Optional[str] = None

class RimorchioNestedSchema(Schema):
    """
    Nested schema for Rimorchio details in MezzoRimorchio
    """
    id: int
    nome: str
    tipoRimorchio: str
    capacitaDiCarico: float

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
    
    # Campi nested per i dettagli di mezzo e rimorchio
    mezzo: Optional[MezzoNestedSchema] = None
    rimorchio: Optional[RimorchioNestedSchema] = None
    
    class Config:
        # Permetti campi extra per compatibilità con il controller
        extra = "allow"
