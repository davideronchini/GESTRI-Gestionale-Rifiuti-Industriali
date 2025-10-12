"""
Controller for managing transportation vehicles.
This module contains the business logic for operations on vehicles.
"""
from mezzo.models import Mezzo, StatoMezzo
from mezzo_rimorchio.models import MezzoRimorchio
from rimorchio.models import Rimorchio


class MezzoController:
    """
    Controller for managing transportation vehicles.
    """
    
    # ------ METHODS FOR MEZZO API ------
    
    @staticmethod
    def get_mezzo(mezzo_id):
        """
        Get a specific mezzo by ID.
        
        Args:
            mezzo_id (int): ID of the mezzo to retrieve
            
        Returns:
            tuple: (mezzo_data, error) where error is None if successful
        """
        try:
            mezzo = Mezzo.objects.get(id=mezzo_id)
            mezzo_data = {
                'id': mezzo.id,
                'targa': mezzo.targa,
                'chilometraggio': mezzo.chilometraggio,
                'consumoCarburante': mezzo.consumoCarburante,
                'scadenzaRevisione': mezzo.scadenzaRevisione.isoformat() if mezzo.scadenzaRevisione else None,
                'scadenzaAssicurazione': mezzo.scadenzaAssicurazione.isoformat() if mezzo.scadenzaAssicurazione else None,
                'isDanneggiato': mezzo.isDanneggiato,
                'statoMezzo': mezzo.statoMezzo,
                'data_creazione': mezzo.data_creazione.isoformat() if mezzo.data_creazione else None,
                'data_modifica': mezzo.data_modifica.isoformat() if mezzo.data_modifica else None,
                'immagine': mezzo.immagine.name if mezzo.immagine and mezzo.immagine.name else None
            }
            return mezzo_data, None
        except Mezzo.DoesNotExist:
            return None, "Mezzo non trovato"
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def get_mezzo_by_targa(targa):
        """
        Get a specific mezzo by targa (license plate).
        
        Args:
            targa (str): License plate of the mezzo to retrieve
            
        Returns:
            tuple: (mezzo_data, error) where error is None if successful
        """
        try:
            mezzo = Mezzo.objects.get(targa=targa)
            mezzo_data = {
                'id': mezzo.id,
                'targa': mezzo.targa,
                'chilometraggio': mezzo.chilometraggio,
                'consumoCarburante': mezzo.consumoCarburante,
                'scadenzaRevisione': mezzo.scadenzaRevisione.isoformat() if mezzo.scadenzaRevisione else None,
                'scadenzaAssicurazione': mezzo.scadenzaAssicurazione.isoformat() if mezzo.scadenzaAssicurazione else None,
                'isDanneggiato': mezzo.isDanneggiato,
                'statoMezzo': mezzo.statoMezzo,
                'data_creazione': mezzo.data_creazione.isoformat() if mezzo.data_creazione else None,
                'data_modifica': mezzo.data_modifica.isoformat() if mezzo.data_modifica else None,
                'immagine': mezzo.immagine.name if mezzo.immagine and mezzo.immagine.name else None
            }
            return mezzo_data, None
        except Mezzo.DoesNotExist:
            return None, "Mezzo non trovato"
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def create_mezzo(payload):
        """
        Create a new mezzo.
        
        Args:
            payload: Data for creating the mezzo
            
        Returns:
            tuple: (mezzo_data, error) where error is None if successful
        """
        try:
            mezzo = Mezzo.objects.create(
                targa=payload.targa,
                chilometraggio=payload.chilometraggio if hasattr(payload, 'chilometraggio') else 0,
                consumoCarburante=payload.consumoCarburante if hasattr(payload, 'consumoCarburante') else None,
                scadenzaRevisione=payload.scadenzaRevisione if hasattr(payload, 'scadenzaRevisione') else None,
                scadenzaAssicurazione=payload.scadenzaAssicurazione if hasattr(payload, 'scadenzaAssicurazione') else None,
                isDanneggiato=payload.isDanneggiato if hasattr(payload, 'isDanneggiato') else False,
                statoMezzo=payload.statoMezzo.upper() if hasattr(payload, 'statoMezzo') and payload.statoMezzo else 'DISPONIBILE'  # Converti in maiuscolo
            )
            
            mezzo_data = {
                'id': mezzo.id,
                'targa': mezzo.targa,
                'chilometraggio': mezzo.chilometraggio,
                'consumoCarburante': mezzo.consumoCarburante,
                'scadenzaRevisione': mezzo.scadenzaRevisione.isoformat() if mezzo.scadenzaRevisione else None,
                'scadenzaAssicurazione': mezzo.scadenzaAssicurazione.isoformat() if mezzo.scadenzaAssicurazione else None,
                'isDanneggiato': mezzo.isDanneggiato,
                'statoMezzo': mezzo.statoMezzo,
                'data_creazione': mezzo.data_creazione.isoformat() if mezzo.data_creazione else None,
                'data_modifica': mezzo.data_modifica.isoformat() if mezzo.data_modifica else None,
                'immagine': mezzo.immagine.name if mezzo.immagine and mezzo.immagine.name else None
            }
            return mezzo_data, None
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def update_mezzo(mezzo_id, payload):
        """
        Update an existing mezzo.
        
        Args:
            mezzo_id (int): ID of the mezzo to update
            payload: Data to update
            
        Returns:
            tuple: (mezzo_data, error) where error is None if successful
        """
        try:
            mezzo = Mezzo.objects.get(id=mezzo_id)
            
            # Update fields
            if hasattr(payload, 'targa') and payload.targa is not None:
                mezzo.targa = payload.targa
            if hasattr(payload, 'chilometraggio') and payload.chilometraggio is not None:
                mezzo.chilometraggio = payload.chilometraggio
            if hasattr(payload, 'consumoCarburante') and payload.consumoCarburante is not None:
                mezzo.consumoCarburante = payload.consumoCarburante
            if hasattr(payload, 'scadenzaRevisione'):
                mezzo.scadenzaRevisione = payload.scadenzaRevisione
            if hasattr(payload, 'scadenzaAssicurazione'):
                mezzo.scadenzaAssicurazione = payload.scadenzaAssicurazione
            if hasattr(payload, 'isDanneggiato') and payload.isDanneggiato is not None:
                mezzo.isDanneggiato = payload.isDanneggiato
            if hasattr(payload, 'statoMezzo') and payload.statoMezzo is not None:
                mezzo.statoMezzo = payload.statoMezzo.upper()  # Converti in maiuscolo
            
            mezzo.save()
            
            mezzo_data = {
                'id': mezzo.id,
                'targa': mezzo.targa,
                'chilometraggio': mezzo.chilometraggio,
                'consumoCarburante': mezzo.consumoCarburante,
                'scadenzaRevisione': mezzo.scadenzaRevisione.isoformat() if mezzo.scadenzaRevisione else None,
                'scadenzaAssicurazione': mezzo.scadenzaAssicurazione.isoformat() if mezzo.scadenzaAssicurazione else None,
                'isDanneggiato': mezzo.isDanneggiato,
                'statoMezzo': mezzo.statoMezzo,
                'data_creazione': mezzo.data_creazione.isoformat() if mezzo.data_creazione else None,
                'data_modifica': mezzo.data_modifica.isoformat() if mezzo.data_modifica else None,
                'immagine': mezzo.immagine.name if mezzo.immagine and mezzo.immagine.name else None
            }
            return mezzo_data, None
        except Mezzo.DoesNotExist:
            return None, "Mezzo non trovato"
        except Exception as e:
            return None, str(e)
    
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
                'scadenzaRevisione': mezzo.scadenzaRevisione.isoformat() if mezzo.scadenzaRevisione else None,
                'scadenzaAssicurazione': mezzo.scadenzaAssicurazione.isoformat() if mezzo.scadenzaAssicurazione else None,
                'isDanneggiato': mezzo.isDanneggiato,
                'statoMezzo': mezzo.statoMezzo,
                'data_creazione': mezzo.data_creazione.isoformat() if mezzo.data_creazione else None,
                'data_modifica': mezzo.data_modifica.isoformat() if mezzo.data_modifica else None,
                'immagine': mezzo.immagine.name if mezzo.immagine and mezzo.immagine.name else None
            }
            result.append(mezzo_data)
        
        return result

    # ------ METHODS FOR RIMORCHIO API ------
    
    @staticmethod
    def list_rimorchi():
        """
        Get a list of all rimorchi.
        
        Returns:
            list: List of all rimorchi
        """
        rimorchi = Rimorchio.objects.all()
        result = []
        for rimorchio in rimorchi:
            rimorchio_data = {
                'id': rimorchio.id,
                'nome': rimorchio.nome,
                'capacitaDiCarico': float(rimorchio.capacitaDiCarico),
                'tipoRimorchio': rimorchio.tipoRimorchio,
                'immagine': rimorchio.immagine.name if rimorchio.immagine and rimorchio.immagine.name else None,
                'data_creazione': rimorchio.data_creazione.isoformat() if rimorchio.data_creazione else None,
                'data_modifica': rimorchio.data_modifica.isoformat() if rimorchio.data_modifica else None,
            }
            result.append(rimorchio_data)
        return result
    
    @staticmethod
    def get_rimorchio(rimorchio_id):
        """
        Get a specific rimorchio by ID.
        
        Args:
            rimorchio_id (int): ID of the rimorchio to retrieve
            
        Returns:
            tuple: (rimorchio_data, error) where error is None if successful
        """
        try:
            rimorchio = Rimorchio.objects.get(id=rimorchio_id)
            rimorchio_data = {
                'id': rimorchio.id,
                'nome': rimorchio.nome,
                'capacitaDiCarico': float(rimorchio.capacitaDiCarico),
                'tipoRimorchio': rimorchio.tipoRimorchio,
                'immagine': rimorchio.immagine.name if rimorchio.immagine and rimorchio.immagine.name else None,
                'data_creazione': rimorchio.data_creazione.isoformat() if rimorchio.data_creazione else None,
                'data_modifica': rimorchio.data_modifica.isoformat() if rimorchio.data_modifica else None,
            }
            return rimorchio_data, None
        except Rimorchio.DoesNotExist:
            return None, "Rimorchio non trovato"
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def create_rimorchio(payload):
        """
        Create a new rimorchio.
        
        Args:
            payload: Data for creating the rimorchio
            
        Returns:
            tuple: (rimorchio_data, error) where error is None if successful
        """
        try:
            rimorchio = Rimorchio.objects.create(
                nome=payload.nome,
                capacitaDiCarico=payload.capacitaDiCarico,
                tipoRimorchio=payload.tipoRimorchio.upper()  # Converti in maiuscolo
            )
            
            rimorchio_data = {
                'id': rimorchio.id,
                'nome': rimorchio.nome,
                'capacitaDiCarico': float(rimorchio.capacitaDiCarico),
                'tipoRimorchio': rimorchio.tipoRimorchio,
                'immagine': rimorchio.immagine.name if rimorchio.immagine and rimorchio.immagine.name else None,
                'data_creazione': rimorchio.data_creazione.isoformat() if rimorchio.data_creazione else None,
                'data_modifica': rimorchio.data_modifica.isoformat() if rimorchio.data_modifica else None,
            }
            return rimorchio_data, None
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def update_rimorchio(rimorchio_id, payload):
        """
        Update an existing rimorchio.
        
        Args:
            rimorchio_id (int): ID of the rimorchio to update
            payload: Data to update
            
        Returns:
            tuple: (rimorchio_data, error) where error is None if successful
        """
        try:
            rimorchio = Rimorchio.objects.get(id=rimorchio_id)
            
            # Update fields
            if hasattr(payload, 'nome') and payload.nome is not None:
                rimorchio.nome = payload.nome
            if hasattr(payload, 'capacitaDiCarico') and payload.capacitaDiCarico is not None:
                rimorchio.capacitaDiCarico = payload.capacitaDiCarico
            if hasattr(payload, 'tipoRimorchio') and payload.tipoRimorchio is not None:
                rimorchio.tipoRimorchio = payload.tipoRimorchio.upper()  # Converti in maiuscolo
            
            rimorchio.save()
            
            rimorchio_data = {
                'id': rimorchio.id,
                'nome': rimorchio.nome,
                'capacitaDiCarico': float(rimorchio.capacitaDiCarico),
                'tipoRimorchio': rimorchio.tipoRimorchio,
                'immagine': rimorchio.immagine.name if rimorchio.immagine and rimorchio.immagine.name else None,
                'data_creazione': rimorchio.data_creazione.isoformat() if rimorchio.data_creazione else None,
                'data_modifica': rimorchio.data_modifica.isoformat() if rimorchio.data_modifica else None,
            }
            return rimorchio_data, None
        except Rimorchio.DoesNotExist:
            return None, "Rimorchio non trovato"
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def delete_rimorchio(rimorchio_id):
        """
        Delete a rimorchio.
        
        Args:
            rimorchio_id (int): ID of the rimorchio to delete
            
        Returns:
            tuple: (success, error) where error is None if successful
        """
        try:
            rimorchio = Rimorchio.objects.get(id=rimorchio_id)
            rimorchio.delete()
            return True, None
        except Rimorchio.DoesNotExist:
            return False, "Rimorchio non trovato"
        except Exception as e:
            return False, str(e)

    # ------ METHODS FOR MEZZO-RIMORCHIO API ------

    @staticmethod
    def list_mezzo_rimorchio_disponibili():
        """
        Gets the list of mezzo-rimorchio associations where the mezzo status is DISPONIBILE.
        
        Returns:
            list: List of mezzo-rimorchio associations with available vehicles
        """
        from mezzo_rimorchio.models import MezzoRimorchio
        
        # Filtra per associazioni attive e mezzi disponibili
        associazioni = MezzoRimorchio.objects.filter(
            attivo=True,
            mezzo__statoMezzo=StatoMezzo.DISPONIBILE
        ).select_related('mezzo', 'rimorchio')
        
        result = []
        for associazione in associazioni:
            associazione_data = {
                'id': associazione.id,
                'mezzo_id': associazione.mezzo.id,
                'rimorchio_id': associazione.rimorchio.id,
                'data_associazione': associazione.data_associazione,
                'data_dissociazione': associazione.data_dissociazione,
                'attivo': associazione.attivo,
                'data_creazione': associazione.data_creazione,
                'data_modifica': associazione.data_modifica,
                # Aggiungi anche i dettagli di mezzo e rimorchio come campi extra per il frontend
                'mezzo': {
                    'id': associazione.mezzo.id,
                    'targa': associazione.mezzo.targa,
                    'statoMezzo': associazione.mezzo.statoMezzo,
                    'chilometraggio': associazione.mezzo.chilometraggio,
                    'isDanneggiato': associazione.mezzo.isDanneggiato,
                    'immagine': associazione.mezzo.immagine.name if associazione.mezzo.immagine and associazione.mezzo.immagine.name else None
                },
                'rimorchio': {
                    'id': associazione.rimorchio.id,
                    'nome': associazione.rimorchio.nome,
                    'tipoRimorchio': associazione.rimorchio.tipoRimorchio,
                    'capacitaDiCarico': (float(getattr(associazione.rimorchio, 'capacitaDiCarico')) if getattr(associazione.rimorchio, 'capacitaDiCarico', None) is not None else None),
                }
            }
            result.append(associazione_data)
        
        return result

    @staticmethod
    def list_mezzo_rimorchio_by_stato(stato):
        """
        Gets the list of mezzo-rimorchio associations filtered by vehicle status.
        
        Args:
            stato (str): Vehicle status to filter results (DISPONIBILE, OCCUPATO, MANUTENZIONE)
            
        Returns:
            list: List of mezzo-rimorchio associations with vehicles in the specified status
        """
        from mezzo_rimorchio.models import MezzoRimorchio
        
        # Valida che lo stato sia uno di quelli supportati
        if stato not in [StatoMezzo.DISPONIBILE, StatoMezzo.OCCUPATO, StatoMezzo.MANUTENZIONE]:
            raise ValueError(f"Stato non valido: {stato}. Stati supportati: {', '.join([s.value for s in StatoMezzo])}")
        
        # Filtra per associazioni attive e mezzi con lo stato specificato
        associazioni = MezzoRimorchio.objects.filter(
            attivo=True,
            mezzo__statoMezzo=stato
        ).select_related('mezzo', 'rimorchio')
        
        result = []
        for associazione in associazioni:
            associazione_data = {
                'id': associazione.id,
                'mezzo': {
                    'id': associazione.mezzo.id,
                    'targa': associazione.mezzo.targa,
                    'statoMezzo': associazione.mezzo.statoMezzo,
                    'chilometraggio': associazione.mezzo.chilometraggio,
                    'isDanneggiato': associazione.mezzo.isDanneggiato,
                    'immagine': associazione.mezzo.immagine.name if associazione.mezzo.immagine and associazione.mezzo.immagine.name else None
                },
                'rimorchio': {
                    'id': associazione.rimorchio.id,
                    'nome': associazione.rimorchio.nome,
                    'tipoRimorchio': associazione.rimorchio.tipoRimorchio,
                    'capacitaDiCarico': (float(getattr(associazione.rimorchio, 'capacitaDiCarico')) if getattr(associazione.rimorchio, 'capacitaDiCarico', None) is not None else None),
                },
                'data_associazione': associazione.data_associazione,
                'attivo': associazione.attivo
            }
            result.append(associazione_data)
        
        return result

    @staticmethod
    def list_mezzi_rimorchi():
        """Return list of all active mezzo-rimorchio associations with nested mezzo and rimorchio info."""
        associazioni = MezzoRimorchio.objects.filter(attivo=True).select_related('mezzo', 'rimorchio')
        result = []
        for associazione in associazioni:
            associazione_data = {
                'id': associazione.id,
                'mezzo_id': associazione.mezzo.id,
                'rimorchio_id': associazione.rimorchio.id,
                'data_associazione': associazione.data_associazione,
                'data_dissociazione': associazione.data_dissociazione,
                'attivo': associazione.attivo,
                'data_creazione': associazione.data_creazione,
                'data_modifica': associazione.data_modifica,
                'mezzo': {
                    'id': associazione.mezzo.id,
                    'targa': associazione.mezzo.targa,
                    'statoMezzo': associazione.mezzo.statoMezzo,
                    'chilometraggio': associazione.mezzo.chilometraggio,
                    'scadenzaRevisione': associazione.mezzo.scadenzaRevisione,
                    'scadenzaAssicurazione': associazione.mezzo.scadenzaAssicurazione,
                    'isDanneggiato': associazione.mezzo.isDanneggiato,
                    'immagine': associazione.mezzo.immagine.name if associazione.mezzo.immagine and associazione.mezzo.immagine.name else None
                },
                'rimorchio': {
                    'id': associazione.rimorchio.id,
                    'nome': associazione.rimorchio.nome,
                    'tipoRimorchio': associazione.rimorchio.tipoRimorchio,
                    'capacitaDiCarico': float(associazione.rimorchio.capacitaDiCarico) if getattr(associazione.rimorchio, 'capacitaDiCarico', None) is not None else None,
                }
            }
            result.append(associazione_data)
        return result

    @staticmethod
    def create_mezzo_rimorchio(payload):
        """Create a new mezzo-rimorchio association from payload. Raises exceptions on error."""
        from django.shortcuts import get_object_or_404
        from mezzo.models import Mezzo
        from rimorchio.models import Rimorchio

        mezzo = get_object_or_404(Mezzo, id=payload.mezzo_id)
        rimorchio = get_object_or_404(Rimorchio, id=payload.rimorchio_id)

        associazione = MezzoRimorchio.objects.create(
            mezzo=mezzo,
            rimorchio=rimorchio,
            attivo=payload.attivo
        )

        return {
            'id': associazione.id,
            'mezzo_id': associazione.mezzo.id,
            'rimorchio_id': associazione.rimorchio.id,
            'data_associazione': associazione.data_associazione,
            'data_dissociazione': associazione.data_dissociazione,
            'attivo': associazione.attivo,
            'data_creazione': associazione.data_creazione,
            'data_modifica': associazione.data_modifica,
            'mezzo': {
                'id': associazione.mezzo.id,
                'targa': associazione.mezzo.targa,
                'statoMezzo': associazione.mezzo.statoMezzo,
                'chilometraggio': associazione.mezzo.chilometraggio,
                'scadenzaRevisione': associazione.mezzo.scadenzaRevisione,
                'scadenzaAssicurazione': associazione.mezzo.scadenzaAssicurazione,
                'isDanneggiato': associazione.mezzo.isDanneggiato,
                'immagine': associazione.mezzo.immagine.name if associazione.mezzo.immagine and associazione.mezzo.immagine.name else None
            },
            'rimorchio': {
                'id': associazione.rimorchio.id,
                'nome': associazione.rimorchio.nome,
                'tipoRimorchio': associazione.rimorchio.tipoRimorchio,
                'capacitaDiCarico': float(associazione.rimorchio.capacitaDiCarico) if getattr(associazione.rimorchio, 'capacitaDiCarico', None) is not None else None,
            }
        }

    @staticmethod
    def get_mezzo_rimorchio(mezzo_rimorchio_id):
        """Get a specific mezzo-rimorchio association by ID. Raises Http404 if not found."""
        from django.shortcuts import get_object_or_404

        associazione = get_object_or_404(MezzoRimorchio.objects.select_related('mezzo', 'rimorchio'), id=mezzo_rimorchio_id)
        return {
            'id': associazione.id,
            'mezzo_id': associazione.mezzo.id,
            'rimorchio_id': associazione.rimorchio.id,
            'data_associazione': associazione.data_associazione,
            'data_dissociazione': associazione.data_dissociazione,
            'attivo': associazione.attivo,
            'data_creazione': associazione.data_creazione,
            'data_modifica': associazione.data_modifica,
            'mezzo': {
                'id': associazione.mezzo.id,
                'targa': associazione.mezzo.targa,
                'statoMezzo': associazione.mezzo.statoMezzo,
                'chilometraggio': associazione.mezzo.chilometraggio,
                'scadenzaRevisione': associazione.mezzo.scadenzaRevisione,
                'scadenzaAssicurazione': associazione.mezzo.scadenzaAssicurazione,
                'isDanneggiato': associazione.mezzo.isDanneggiato,
                'immagine': associazione.mezzo.immagine.name if associazione.mezzo.immagine and associazione.mezzo.immagine.name else None
            },
            'rimorchio': {
                'id': associazione.rimorchio.id,
                'nome': associazione.rimorchio.nome,
                'tipoRimorchio': associazione.rimorchio.tipoRimorchio,
                'capacitaDiCarico': float(associazione.rimorchio.capacitaDiCarico) if getattr(associazione.rimorchio, 'capacitaDiCarico', None) is not None else None,
            }
        }

    @staticmethod
    def delete_mezzo_rimorchio(mezzo_rimorchio_id):
        """Mark an association as inactive. Raises Http404 if not found."""
        associazione = MezzoRimorchio.objects.get(id=mezzo_rimorchio_id)
        associazione.attivo = False
        associazione.save()
        return {'success': True, 'message': 'Mezzo-rimorchio dissociato con successo'}

    @staticmethod
    def cerca_mezzo_rimorchi(term: str):
        """Search mezzo-rimorchio associations by mezzo.targa (case-insensitive)."""
        associazioni = MezzoRimorchio.objects.filter(attivo=True).select_related('mezzo', 'rimorchio')
        base_list = []
        for associazione in associazioni:
            associazione_data = {
                'id': associazione.id,
                'mezzo_id': associazione.mezzo.id,
                'rimorchio_id': associazione.rimorchio.id,
                'data_associazione': associazione.data_associazione,
                'data_dissociazione': associazione.data_dissociazione,
                'attivo': associazione.attivo,
                'data_creazione': associazione.data_creazione,
                'data_modifica': associazione.data_modifica,
                'mezzo': {
                    'id': associazione.mezzo.id,
                    'targa': associazione.mezzo.targa,
                    'statoMezzo': associazione.mezzo.statoMezzo,
                    'chilometraggio': associazione.mezzo.chilometraggio,
                    'scadenzaRevisione': associazione.mezzo.scadenzaRevisione,
                    'scadenzaAssicurazione': associazione.mezzo.scadenzaAssicurazione,
                    'isDanneggiato': associazione.mezzo.isDanneggiato,
                    'immagine': associazione.mezzo.immagine.name if associazione.mezzo.immagine and associazione.mezzo.immagine.name else None
                },
                'rimorchio': {
                    'id': associazione.rimorchio.id,
                    'nome': associazione.rimorchio.nome,
                    'tipoRimorchio': associazione.rimorchio.tipoRimorchio,
                    'capacitaDiCarico': float(associazione.rimorchio.capacitaDiCarico) if getattr(associazione.rimorchio, 'capacitaDiCarico', None) is not None else None,
                }
            }
            base_list.append(associazione_data)

        if not term or term.strip() == '':
            return base_list

        term_lower = term.strip().lower()
        results = []
        for a in base_list:
            try:
                if a['mezzo'] and a['mezzo'].get('targa') and term_lower in a['mezzo']['targa'].lower():
                    results.append(a)
            except Exception:
                pass
        return results

    @staticmethod
    def filter_mezzo_rimorchi(value: str, filters: list):
        """Filter mezzo-rimorchio associations by a value and a list of fields."""
        associazioni = MezzoRimorchio.objects.filter(attivo=True).select_related('mezzo', 'rimorchio')
        base_list = []
        for associazione in associazioni:
            associazione_data = {
                'id': associazione.id,
                'mezzo_id': associazione.mezzo.id,
                'rimorchio_id': associazione.rimorchio.id,
                'data_associazione': associazione.data_associazione,
                'data_dissociazione': associazione.data_dissociazione,
                'attivo': associazione.attivo,
                'data_creazione': associazione.data_creazione,
                'data_modifica': associazione.data_modifica,
                'mezzo': {
                    'id': associazione.mezzo.id,
                    'targa': associazione.mezzo.targa,
                    'statoMezzo': associazione.mezzo.statoMezzo,
                    'chilometraggio': associazione.mezzo.chilometraggio,
                    'scadenzaRevisione': associazione.mezzo.scadenzaRevisione,
                    'scadenzaAssicurazione': associazione.mezzo.scadenzaAssicurazione,
                    'isDanneggiato': associazione.mezzo.isDanneggiato,
                    'immagine': associazione.mezzo.immagine.name if associazione.mezzo.immagine and associazione.mezzo.immagine.name else None
                },
                'rimorchio': {
                    'id': associazione.rimorchio.id,
                    'nome': associazione.rimorchio.nome,
                    'tipoRimorchio': associazione.rimorchio.tipoRimorchio,
                    'capacitaDiCarico': float(associazione.rimorchio.capacitaDiCarico) if getattr(associazione.rimorchio, 'capacitaDiCarico', None) is not None else None,
                }
            }
            base_list.append(associazione_data)

        if not filters or not value or value.strip() == '':
            return base_list

        value_lower = value.strip().lower()
        results = []
        for a in base_list:
            matched = False
            for field in filters:
                f = field.lower()
                if f in ("targa",):
                    if a.get('mezzo') and a['mezzo'].get('targa') and value_lower in a['mezzo']['targa'].lower():
                        matched = True
                        break
                elif f in ("tiporimorchio", "tipo_rimorchio", "tipoRimorchio"):
                    if a.get('rimorchio') and a['rimorchio'].get('tipoRimorchio') and value_lower in a['rimorchio']['tipoRimorchio'].lower():
                        matched = True
                        break
                elif f in ("stato", "statomezzo", "statoMezzo"):
                    if a.get('mezzo') and a['mezzo'].get('statoMezzo') and value_lower in a['mezzo']['statoMezzo'].lower():
                        matched = True
                        break
                elif f in ("scadenzarevisione", "scadenza_revisione", "scadenzaRevisione"):
                    if a.get('mezzo') and a['mezzo'].get('scadenzaRevisione'):
                        try:
                            from datetime import date
                            scad = a['mezzo']['scadenzaRevisione']
                            if isinstance(scad, date):
                                date_str = scad.strftime("%Y-%m-%d")
                            else:
                                date_str = str(scad)
                            if value_lower in date_str.lower():
                                matched = True
                                break
                        except Exception:
                            pass
                elif f in ("scadenzaassicurazione", "scadenza_assicurazione", "scadenzaAssicurazione"):
                    if a.get('mezzo') and a['mezzo'].get('scadenzaAssicurazione'):
                        try:
                            from datetime import date
                            scad = a['mezzo']['scadenzaAssicurazione']
                            if isinstance(scad, date):
                                date_str = scad.strftime("%Y-%m-%d")
                            else:
                                date_str = str(scad)
                            if value_lower in date_str.lower():
                                matched = True
                                break
                        except Exception:
                            pass
            if matched:
                results.append(a)
        return results