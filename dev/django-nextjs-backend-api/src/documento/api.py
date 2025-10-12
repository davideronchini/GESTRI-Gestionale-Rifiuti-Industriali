from ninja import Router, File, Form
from ninja.files import UploadedFile
from typing import List
from django.http import HttpRequest, JsonResponse
from pydantic import BaseModel
import helpers
from .schemas import DocumentoSchema
from .models import Documento
from controllers.documento_controller import DocumentoController
from django.http import JsonResponse
from django.core.exceptions import PermissionDenied
from django.http import Http404

router = Router(tags=["documenti"])


class FilterRequest(BaseModel):
    filters: List[str] = []


@router.get("/", response=List[DocumentoSchema], auth=helpers.api_auth_staff_or_operatore)
def list_documenti(request: HttpRequest):
    """
    Get all documents accessible to the user.
    """
    # Delegate to controller
    try:
        result = DocumentoController.list_documenti(request)
        return result
    except PermissionDenied as e:
        return JsonResponse({'detail': str(e)}, status=403)
    except Http404 as e:
        return JsonResponse({'detail': str(e)}, status=404)
    except Exception as e:
        print(f"Errore in list_documenti: {str(e)}")
        return JsonResponse({'detail': 'Internal server error'}, status=500)


@router.post("/", auth=helpers.api_auth_staff_only)
def create_documento(request: HttpRequest):
    """
    Upload a new document.
    """
    try:
        return DocumentoController.create_documento(request)
    except PermissionDenied as e:
        return JsonResponse({'detail': str(e)}, status=403)
    except Http404 as e:
        return JsonResponse({'detail': str(e)}, status=404)
    except ValueError as e:
        return JsonResponse({'detail': str(e)}, status=400)
    except Exception as e:
        import traceback
        print(f"Error in create_documento: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return JsonResponse({'detail': 'Internal server error'}, status=500)


@router.get("/{documento_id}", response=DocumentoSchema, auth=helpers.api_auth_staff_or_operatore)
def get_documento(request: HttpRequest, documento_id: int):
    """
    Get a specific document by ID.
    """
    try:
        result = DocumentoController.get_documento(request, documento_id)
        return result
    except PermissionDenied as e:
        return JsonResponse({'detail': str(e)}, status=403)
    except Http404 as e:
        return JsonResponse({'detail': str(e)}, status=404)
    except Exception as e:
        return JsonResponse({'detail': 'Internal server error'}, status=500)


@router.delete("/{documento_id}", auth=helpers.api_auth_staff_only)
def delete_documento(request: HttpRequest, documento_id: int):
    """
    Delete a specific document by ID. Only the operatore who owns the document or an admin-like user may delete it.
    Performs file cleanup on disk if a file is associated.
    """
    try:
        return DocumentoController.delete_documento(request, documento_id)
    except PermissionDenied as e:
        return JsonResponse({'detail': str(e)}, status=403)
    except Http404 as e:
        return JsonResponse({'detail': str(e)}, status=404)
    except Exception as e:
        return JsonResponse({'detail': 'Internal server error'}, status=500)


@router.put("/{documento_id}", auth=helpers.api_auth_staff_only)
def update_documento(
    request: HttpRequest,
    documento_id: int,
    file: UploadedFile = File(None),         # file opzionale
    tipoDocumento: str = Form(None),         # form field opzionale
):
    """
    Update an existing document with a new file using PUT method.
    """
    try:
        return DocumentoController.update_documento(request, documento_id, file=file, tipoDocumento=tipoDocumento)
    except PermissionDenied as e:
        return JsonResponse({'detail': str(e)}, status=403)
    except Http404 as e:
        return JsonResponse({'detail': str(e)}, status=404)
    except ValueError as e:
        return JsonResponse({'detail': str(e)}, status=400)
    except Exception as e:
        import traceback
        print(f"Error in update_documento: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return JsonResponse({'detail': 'Internal server error'}, status=500)


@router.patch("/{documento_id}", auth=helpers.api_auth_staff_only)
def patch_documento(
    request: HttpRequest,
    documento_id: int,
    file: UploadedFile = File(None),         # file opzionale
    tipoDocumento: str = Form(None),         # form field opzionale
):
    """
    Update an existing document with a new file using PATCH method (more compatible with multipart).
    """
    try:
        return DocumentoController.update_documento(request, documento_id, file=file, tipoDocumento=tipoDocumento)
    except PermissionDenied as e:
        return JsonResponse({'detail': str(e)}, status=403)
    except Http404 as e:
        return JsonResponse({'detail': str(e)}, status=404)
    except ValueError as e:
        return JsonResponse({'detail': str(e)}, status=400)
    except Exception as e:
        import traceback
        print(f"Error in patch_documento: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return JsonResponse({'detail': 'Internal server error'}, status=500)


@router.get("/cerca/{term}", response=List[DocumentoSchema], auth=helpers.api_auth_staff_only)
def cerca_documenti(request: HttpRequest, term: str):
    """
    Search endpoint: automatically searches by tipo documento.
    If term is empty, returns all documents.
    """
    try:
        return DocumentoController.cerca_documenti(request, term)
    except Exception as e:
        print(f"Errore in cerca_documenti: {str(e)}")
        return []


@router.post("/filter-by/{value}", response=List[DocumentoSchema], auth=helpers.api_auth_staff_only)
def filter_documenti(request: HttpRequest, value: str, filter_data: FilterRequest):
    """
    Filter endpoint with multiple filters support.
    Accepts filters in the request body and applies them to search for the given value.
    """
    try:
        filters = filter_data.filters
        return DocumentoController.filter_documenti(request, value, filters)
    except Exception as e:
        print(f"Errore in filter_documenti: {str(e)}")
        return []

