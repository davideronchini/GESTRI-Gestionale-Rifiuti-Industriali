"""
Controller for document management.
This module contains the business logic for operations on documents.
"""
from documento.models import Documento


class DocumentoController:
    """
    Controller for document management.
    """
    
    # ------ METHODS FOR DOCUMENTO API ------
    
    @staticmethod
    def list_documenti():
        """
        Gets all documents.
        
        Returns:
            list: List of all documents
        """
        return Documento.objects.all()