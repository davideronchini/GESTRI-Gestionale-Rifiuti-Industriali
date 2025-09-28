"""
Controller for managing transportation vehicles.
This module contains the business logic for operations on vehicles.
"""
from mezzo.models import Mezzo


class MezzoController:
    """
    Controller for managing transportation vehicles.
    """
    
    # ------ METHODS FOR MEZZO API ------
    
    @staticmethod
    def list_mezzi_by_stato(stato_mezzo):
        """
        Gets the list of vehicles filtered by status.
        
        Args:
            stato_mezzo (str): Vehicle status to filter results
            
        Returns:
            list: List of vehicles with the specified status
        """
        mezzi = Mezzo.objects.filter(statoMezzo=stato_mezzo)
        
        # Convert QuerySet to list of dictionaries with proper image handling
        result = []
        for mezzo in mezzi:
            mezzo_data = {
                'id': mezzo.id,
                'targa': mezzo.targa,
                'chilometraggio': mezzo.chilometraggio,
                'consumoCarburante': mezzo.consumoCarburante,
                'scadenzaRevisione': mezzo.scadenzaRevisione,
                'scadenzaAssicurazione': mezzo.scadenzaAssicurazione,
                'isDanneggiato': mezzo.isDanneggiato,
                'statoMezzo': mezzo.statoMezzo,
                'data_creazione': mezzo.data_creazione,
                'data_modifica': mezzo.data_modifica,
                'immagine': mezzo.immagine.name if mezzo.immagine and mezzo.immagine.name else None
            }
            result.append(mezzo_data)
        
        return result
