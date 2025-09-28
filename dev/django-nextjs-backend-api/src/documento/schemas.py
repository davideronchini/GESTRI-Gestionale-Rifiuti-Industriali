from ninja import Schema
from typing import Optional
from datetime import datetime, date

class DocumentoSchema(Schema):
    """
    Schema for document data representation in API responses.
    """
    id: int
    tipoDocumento: str
    dataInserimento: datetime
    dataScadenza: Optional[date] = None
    file: Optional[str] = None
    operatore_id: Optional[int] = None
    operatore_nome: Optional[str] = None