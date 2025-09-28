from ninja import Router
from typing import List
from django.http import HttpRequest
import helpers
from .schemas import DocumentoSchema
from .models import Documento

router = Router(tags=["documenti"])

@router.get("/", response=List[DocumentoSchema], auth=helpers.api_auth_any_authenticated)
def list_documenti(request: HttpRequest):
    """
    Get all documents accessible to the user.
    """
    try:
        # Get all documents and serialize them manually for consistent file handling
        documenti = Documento.objects.all()
        
        result = []
        for documento in documenti:
            documento_data = {
                'id': documento.id,
                'tipoDocumento': documento.tipoDocumento,
                'dataInserimento': documento.dataInserimento,
                'dataScadenza': documento.dataScadenza,
                'file': documento.file.name if documento.file and documento.file.name else None,
                'operatore_id': documento.operatore.id if documento.operatore else None,
                'operatore_nome': f"{documento.operatore.first_name} {documento.operatore.last_name}" if documento.operatore else None
            }
            result.append(documento_data)
        
        return result
            
    except Exception as e:
        return {"error": str(e)}