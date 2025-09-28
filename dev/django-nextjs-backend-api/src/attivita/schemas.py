from ninja import Schema
from typing import Optional
from datetime import datetime

class AttivitaSchema(Schema):
    """
    Schema for Attivita response
    """
    id: int
    titolo: str
    descrizione: Optional[str] = None
    statoAttivita: str
    data: Optional[datetime] = None
    luogo: Optional[str] = None
    codiceCer: Optional[str] = None
    durata: Optional[int] = None
    utente_creatore_id: int
    mezzo_rimorchio_id: Optional[int] = None
    data_creazione: datetime
    data_modifica: datetime
    
    class Config:
        from_attributes = True