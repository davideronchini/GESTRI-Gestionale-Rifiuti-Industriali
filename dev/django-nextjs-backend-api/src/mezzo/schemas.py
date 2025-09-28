from typing import List, Any, Optional
from datetime import datetime, date
from ninja import Schema

class MezzoBaseSchema(Schema):
    """
    Base schema for Mezzo with common fields
    """
    targa: str
    chilometraggio: int = 0
    consumoCarburante: Optional[float] = None
    scadenzaRevisione: Optional[date] = None
    scadenzaAssicurazione: Optional[date] = None
    isDanneggiato: bool = False
    statoMezzo: str

class MezzoCreateSchema(MezzoBaseSchema):
    """
    Schema for creating a new vehicle.
    """
    pass

class MezzoUpdateSchema(Schema):
    """
    Schema for updating vehicle information (all fields optional).
    """
    targa: Optional[str] = None
    chilometraggio: Optional[int] = None
    consumoCarburante: Optional[float] = None
    scadenzaRevisione: Optional[date] = None
    scadenzaAssicurazione: Optional[date] = None
    isDanneggiato: Optional[bool] = None
    statoMezzo: Optional[str] = None

class MezzoSchema(MezzoBaseSchema):
    """
    Schema for vehicle data representation in API responses.
    """
    id: int
    data_creazione: datetime
    data_modifica: datetime
    immagine: Optional[str] = None
    
    @staticmethod
    def resolve_immagine(obj):
        """
        Custom resolver for immagine field to handle FileField serialization
        """
        if obj.immagine and hasattr(obj.immagine, 'name') and obj.immagine.name:
            return obj.immagine.name
        return None

class ErrorMezzoCreateSchema(Schema):
    """
    Schema for vehicle creation errors.
    """
    targa: List[Any] = []
    non_field_errors: List[Any] = []