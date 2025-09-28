from typing import List, Dict, Any, Optional
from datetime import date
from ninja import Schema
from pydantic import Field

class DisponibilitaRequestSchema(Schema):
    """
    Schema per richiedere la disponibilità di un operatore in una determinata data.
    """
    data_inizio: date = Field(..., description="Data di inizio per verificare la disponibilità")
    data_fine: Optional[date] = Field(None, description="Data di fine per verificare la disponibilità. Se non specificata, viene usata la data di inizio.")

class DisponibilitaResponseSchema(Schema):
    """
    Schema per la risposta alla richiesta di disponibilità di un operatore.
    """
    disponibile: bool
    motivi_indisponibilita: List[str] = []
    assenze: List[Dict[str, Any]] = []
    attivita: List[Dict[str, Any]] = []

class AssenzaCreateSchema(Schema):
    """
    Schema per la creazione di un'assenza.
    """
    data_inizio: date
    data_fine: date
    tipo: str
    descrizione: Optional[str] = None
    approvata: bool = False
    approvata_da_id: Optional[int] = None

class AssegnaOperatoreRequestSchema(Schema):
    """
    Schema per assegnare un operatore a un'attività.
    """
    attivita_id: int
    verifica_disponibilita: bool = True

class AssegnaOperatoreResponseSchema(Schema):
    """
    Schema per la risposta all'assegnazione di un operatore a un'attività.
    """
    successo: bool
    messaggio: str
    utente_attivita: Optional[Dict[str, Any]] = None

class OperatoriDisponibiliRequestSchema(Schema):
    """
    Schema per richiedere gli operatori disponibili in una determinata data.
    """
    data: date
    luogo: Optional[str] = None

class OperatoriDisponibiliResponseSchema(Schema):
    """
    Schema per la risposta alla richiesta di operatori disponibili.
    """
    operatori: List[Dict[str, Any]]