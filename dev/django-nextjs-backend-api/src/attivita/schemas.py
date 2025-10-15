from ninja import Schema
from typing import Optional, List
from datetime import datetime

class MezzoDetailSchema(Schema):
    """
    Schema for Mezzo detail in AttivitaDetailSchema
    """
    id: int
    targa: str
    statoMezzo: str
    immagine: Optional[str] = None
    
    class Config:
        from_attributes = True

class RimorchioDetailSchema(Schema):
    """
    Schema for Rimorchio detail in AttivitaDetailSchema
    """
    id: int
    nome: str
    tipoRimorchio: str
    
    class Config:
        from_attributes = True

class MezzoRimorchioDetailSchema(Schema):
    """
    Schema for MezzoRimorchio detail in AttivitaDetailSchema
    """
    id: int
    mezzo: MezzoDetailSchema
    rimorchio: RimorchioDetailSchema
    
    class Config:
        from_attributes = True

class UtenteDetailSchema(Schema):
    """
    Schema for Utente detail in AttivitaDetailSchema
    """
    id: int
    email: str
    nome: Optional[str] = None
    cognome: Optional[str] = None
    
    class Config:
        from_attributes = True

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
    # Comma-separated list of assigned operators (Nome Cognome). Added for by-date responses.
    operatori: Optional[str] = None
    utente_creatore_id: int
    mezzo_rimorchio_id: Optional[int] = None
    data_creazione: datetime
    data_modifica: datetime
    
    class Config:
        from_attributes = True

class AttivitaDetailSchema(Schema):
    """
    Schema for detailed Attivita response with related objects
    """
    id: int
    titolo: str
    descrizione: Optional[str] = None
    statoAttivita: str
    data: Optional[datetime] = None
    luogo: Optional[str] = None
    codiceCer: Optional[str] = None
    durata: Optional[int] = None
    utente_creatore: UtenteDetailSchema
    mezzo_rimorchio: Optional[MezzoRimorchioDetailSchema] = None
    operatori_assegnati: List[UtenteDetailSchema] = []
    data_creazione: datetime
    data_modifica: datetime
    
    class Config:
        from_attributes = True

class AttivitaUpdateSchema(Schema):
    """
    Schema for updating an Attivita
    """
    titolo: Optional[str] = None
    descrizione: Optional[str] = None
    statoAttivita: Optional[str] = None
    data: Optional[datetime] = None
    luogo: Optional[str] = None
    codiceCer: Optional[str] = None
    durata: Optional[int] = None

class AttivitaCreateSchema(Schema):
    """
    Schema for creating a new Attivita
    """
    titolo: str
    descrizione: Optional[str] = None
    statoAttivita: Optional[str] = 'PROGRAMMATA'
    data: Optional[datetime] = None
    luogo: Optional[str] = None
    codiceCer: Optional[str] = None
    durata: Optional[int] = None
    mezzo_rimorchio_id: Optional[int] = None
    utenti_assegnati_ids: Optional[List[int]] = []
    documenti_ids: Optional[List[int]] = []