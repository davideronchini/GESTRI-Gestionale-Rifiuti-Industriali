"""
Controller for managing activities.
This module contains the business logic for operations on activities.
"""
from datetime import datetime, date
from django.db.models import Count, Q
from django.db import transaction
from attivita.models import Attivita, StatoAttivita
from utente.models import Utente, Ruolo
from mezzo_rimorchio.models import MezzoRimorchio
from utente_attivita.models import UtenteAttivita
from controllers.utente_controller import UtenteController


class AttivitaController:
    """
    Controller for managing activities.
    """
    
    # ------ METHODS FOR ATTIVITA API ------
    
    @staticmethod
    def list_attivita(user_role, user_id):
        """
        Gets all activities based on user role.
        
        Args:
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            QuerySet: QuerySet of activities authorized for the user
        """
        try:
            if user_role == Ruolo.STAFF:
                # STAFF sees all activities
                return Attivita.objects.all().order_by('-data_creazione')
            elif user_role == Ruolo.OPERATORE:
                # OPERATORE sees only activities they are assigned to
                # Se non ci sono associazioni, restituisce un queryset vuoto
                return Attivita.objects.filter(utente_attivita__utente_id=user_id).distinct().order_by('-data_creazione')
            else:  # Ruolo.CLIENTE
                # CLIENTE sees only activities they created
                return Attivita.objects.filter(utente_creatore__id=user_id).order_by('-data_creazione')
        except Exception as e:
            print(f"Errore in list_attivita: {str(e)}")
            # In caso di errore, restituisci un queryset vuoto
            return Attivita.objects.none()
    
    @staticmethod
    def list_attivita_by_stato(stato, user_role, user_id):
        """
        Ottiene tutte le attività filtrate per stato in base al ruolo dell'utente.
        
        Args:
            stato (str): State of the activity
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            list: List of activities filtered by state
        """
        base_query = Attivita.objects.filter(statoAttivita=stato)
        
        if user_role == Ruolo.STAFF:
            return base_query
        elif user_role == Ruolo.OPERATORE:
            return base_query.filter(utente_attivita__utente_id=user_id)
        else:  # Ruolo.CLIENTE
            return base_query.filter(utente_creatore__id=user_id)
    
    @staticmethod
    def list_attivita_by_date(data, user_role, user_id):
        """
        Gets all activities scheduled for a specific date based on user role.
        Filters by the 'data' field (activity scheduled date).
        
        Args:
            data (date): Date to filter activities by (YYYY-MM-DD)
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            list: List of activities scheduled for the specified date
        """
        # Query base: filtra per data di svolgimento dell'attività (solo la data, non l'ora)
        base_query = Attivita.objects.filter(data__date=data).order_by('data')
        
        # Applica filtri basati sul ruolo dell'utente
        if user_role == Ruolo.STAFF:
            return base_query
        elif user_role == Ruolo.OPERATORE:
            # OPERATORE sees only activities they are assigned to
            return base_query.filter(utente_attivita__utente_id=user_id)
        else:  # Ruolo.CLIENTE
            # CLIENTE sees only activities they created
            return base_query.filter(utente_creatore__id=user_id)

    @staticmethod
    def list_attivita_by_tipo(tipo, user_role, user_id):
        """
        Gets all activities filtered by type based on user role.
        
        Args:
            tipo (str): Type of the activity
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            list: List of activities filtered by type
        """
        base_query = Attivita.objects.filter(tipo=tipo)
        
        if user_role == Ruolo.STAFF:
            return base_query
        elif user_role == Ruolo.OPERATORE:
            return base_query.filter(utente_attivita__utente_id=user_id)
        else:  # Ruolo.CLIENTE
            return base_query.filter(utente_creatore__id=user_id)
    
    @staticmethod
    def list_attivita_by_utente(utente_id, user_role, user_id):
        """
        Gets all activities for a specific user based on the role of the user making the request.
        
        Args:
            utente_id (int): ID of the user whose activities are requested
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            tuple: (attivita, error)
                - attivita (list): List of activities for the user
                - error (str): Error message, or None if the operation succeeded
        """
        # Check if user is trying to view activities of another user
        if str(user_id) != str(utente_id) and user_role != Ruolo.STAFF:
            if user_role == Ruolo.OPERATORE:
                # OPERATOR can only see activities to which they are assigned together with the requested user
                return Attivita.objects.filter(utente_attivita__utente_id=utente_id).filter(utente_attivita__utente_id=user_id), None
            else:  # Ruolo.CLIENTE
                # CLIENT cannot see activities of other users
                return [], "You are not authorized to view activities of other users"
        
        # STAFF can view activities of any user
        # User can view their own activities
        return Attivita.objects.filter(utente_attivita__utente_id=utente_id), None
    
    @staticmethod
    def list_attivita_by_mezzo_rimorchio(mezzo_rimorchio_id, user_role, user_id):
        """
        Gets all activities for a specific vehicle-trailer based on the user's role.
        
        Args:
            mezzo_rimorchio_id (int): ID of the vehicle-trailer
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            list: List of activities for the vehicle-trailer
        """
        base_query = Attivita.objects.filter(mezzo_rimorchio_id=mezzo_rimorchio_id)
        
        if user_role == Ruolo.STAFF:
            return base_query
        elif user_role == Ruolo.OPERATORE:
            return base_query.filter(utente_attivita__utente_id=user_id)
        else:  # Ruolo.CLIENTE
            return base_query.filter(utente_creatore__id=user_id)
    
    @staticmethod
    def get_attivita(attivita_id, user_role, user_id):
        """
        Gets a specific activity based on the user's role.
        
        Args:
            attivita_id (int): ID of the activity
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            tuple: (attivita, error)
                - attivita (Attivita): The requested activity, or None if not found or not authorized
                - error (str): Error message, or None if the operation succeeded
        """
        try:
            attivita = Attivita.objects.get(id=attivita_id)
            
            # Verify authorization based on role
            if user_role == Ruolo.STAFF:
                # STAFF can view any activity
                return attivita, None
            elif user_role == Ruolo.OPERATORE and attivita.utente_attivita.filter(utente_id=user_id).exists():
                # OPERATOR can only view activities to which they are assigned
                return attivita, None
            elif user_role == Ruolo.CLIENTE and attivita.utente_creatore_id == user_id:
                # CLIENT can only view activities they created
                return attivita, None
            else:
                # User is not authorized to view this activity
                return None, "You are not authorized to view this activity"
        except Attivita.DoesNotExist:
            return None, "Activity not found"

    @staticmethod
    def get_attivita_detail(attivita_id, user_role, user_id):
        """
        Gets detailed information about a specific activity including related objects.
        
        Args:
            attivita_id (int): ID of the activity
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            tuple: (attivita_detail, error)
                - attivita_detail (dict): Detailed activity data with related objects, or None if not found/not authorized
                - error (str): Error message, or None if the operation succeeded
        """
        try:
            # Use select_related and prefetch_related for efficient queries
            attivita = Attivita.objects.select_related(
                'utente_creatore',
                'mezzo_rimorchio',
                'mezzo_rimorchio__mezzo',
                'mezzo_rimorchio__rimorchio'
            ).prefetch_related(
                'utente_attivita__utente',
                'documenti'
            ).get(id=attivita_id)
            
            # Verify authorization based on role
            authorized = False
            if user_role == Ruolo.STAFF:
                # STAFF can view any activity
                authorized = True
            elif user_role == Ruolo.OPERATORE and attivita.utente_attivita.filter(utente_id=user_id).exists():
                # OPERATOR can only view activities to which they are assigned
                authorized = True
            elif user_role == Ruolo.CLIENTE and attivita.utente_creatore_id == user_id:
                # CLIENT can only view activities they created
                authorized = True
            
            if not authorized:
                return None, "You are not authorized to view this activity"
            
            # Build detailed response
            detail = {
                'id': attivita.id,
                'titolo': attivita.titolo,
                'descrizione': attivita.descrizione,
                'statoAttivita': attivita.statoAttivita,
                'data': attivita.data,
                'luogo': attivita.luogo,
                'codiceCer': attivita.codiceCer,
                'durata': attivita.durata,
                'data_creazione': attivita.data_creazione,
                'data_modifica': attivita.data_modifica,
                'utente_creatore': {
                    'id': attivita.utente_creatore.id,
                    'email': attivita.utente_creatore.email,
                    'nome': attivita.utente_creatore.nome,
                    'cognome': attivita.utente_creatore.cognome,
                },
                'mezzo_rimorchio': None,
                'operatori_assegnati': []
            }
            
            # Add mezzo_rimorchio details if exists
            if attivita.mezzo_rimorchio:
                detail['mezzo_rimorchio'] = {
                    'id': attivita.mezzo_rimorchio.id,
                    'mezzo': {
                        'id': attivita.mezzo_rimorchio.mezzo.id,
                        'targa': attivita.mezzo_rimorchio.mezzo.targa,
                        'statoMezzo': attivita.mezzo_rimorchio.mezzo.statoMezzo,
                        'immagine': attivita.mezzo_rimorchio.mezzo.immagine.name if attivita.mezzo_rimorchio.mezzo.immagine else None,
                    },
                    'rimorchio': {
                        'id': attivita.mezzo_rimorchio.rimorchio.id,
                        'nome': attivita.mezzo_rimorchio.rimorchio.nome,
                        'tipoRimorchio': attivita.mezzo_rimorchio.rimorchio.tipoRimorchio,
                    }
                }
            
            # Add assigned operators
            for utente_attivita in attivita.utente_attivita.all():
                detail['operatori_assegnati'].append({
                    'id': utente_attivita.utente.id,
                    'email': utente_attivita.utente.email,
                    'nome': utente_attivita.utente.nome,
                    'cognome': utente_attivita.utente.cognome,
                })
            
            return detail, None
            
        except Attivita.DoesNotExist:
            return None, "Activity not found"
    
    @staticmethod
    def create_attivita(payload, user_role, user_id):
        """
        Creates a new activity based on the user's role.
        
        Args:
            payload (dict): Data of the activity to create
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            tuple: (attivita, error)
                - attivita (Attivita): The created activity, or None if the operation failed
                - error (str): Error message, or None if the operation succeeded
        """
        # For CLIENT and OPERATOR, the creator is always the authenticated user
        if user_role in [Ruolo.CLIENTE, Ruolo.OPERATORE]:
            # Force utente_creatore to be the current user
            payload.utente_creatore_id = user_id
        
        # Limitations for non-STAFF users
        if user_role != Ruolo.STAFF:
            # CLIENT and OPERATOR cannot assign activities to STAFF users
            if payload.utenti_assegnati_ids and payload.utenti_assegnati_ids:
                from utente.models import Utente
                staff_ids = Utente.objects.filter(ruolo=Ruolo.STAFF).values_list('id', flat=True)
                if any(user_id in staff_ids for user_id in payload.utenti_assegnati_ids):
                    return None, "You cannot assign activities to STAFF users"
        
        try:
            with transaction.atomic():
                # Extract m2m fields
                utenti_assegnati_ids = payload.utenti_assegnati_ids or []
                documenti_ids = payload.documenti_ids or []
                
                # Create attivita without m2m fields
                attivita_data = payload.dict(exclude={"utenti_assegnati_ids", "documenti_ids"})
                attivita = Attivita.objects.create(**attivita_data)
                
                # Add m2m relationships
                if utenti_assegnati_ids:
                    attivita.utenti_assegnati.set(utenti_assegnati_ids)
                
                if documenti_ids:
                    attivita.documenti.set(documenti_ids)
                
                return attivita, None
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def update_attivita(attivita_id, payload, user_role, user_id):
        """
        Updates an existing activity based on the user's role.
        
        Args:
            attivita_id (int): ID of the activity to update
            payload (dict): Data of the activity to update
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            tuple: (attivita, error)
                - attivita (Attivita): The updated activity, or None if not found or not authorized
                - error (str): Error message, or None if the operation succeeded
        """
        try:
            attivita = Attivita.objects.get(id=attivita_id)
            
            # Verify authorization based on role
            if user_role == Ruolo.STAFF:
                # STAFF can modify any activity
                pass
            elif user_role == Ruolo.OPERATORE and attivita.utente_attivita.filter(utente_id=user_id).exists():
                # OPERATOR can only modify activities to which they are assigned and with limitations
                # Cannot change the creator user
                if payload.dict().get("utente_creatore_id") and payload.utente_creatore_id != attivita.utente_creatore_id:
                    return None, "You cannot change the creator of the activity"
            elif user_role == Ruolo.CLIENTE and attivita.utente_creatore_id == user_id:
                # CLIENT can only modify activities they created and with limitations
                # Cannot change the creator user
                if payload.dict().get("utente_creatore_id") and payload.utente_creatore_id != user_id:
                    return None, "You cannot change the creator of the activity"
            else:
                # User is not authorized to modify this activity
                return None, "You are not authorized to modify this activity"
            
            # Limitations for non-STAFF users
            if user_role != Ruolo.STAFF and payload.dict().get("utenti_assegnati_ids"):
                # CLIENT and OPERATOR cannot assign activities to STAFF users
                from utente.models import Utente
                staff_ids = Utente.objects.filter(ruolo=Ruolo.STAFF).values_list('id', flat=True)
                if any(user_id in staff_ids for user_id in payload.utenti_assegnati_ids):
                    return None, "You cannot assign activities to STAFF users"
            
            with transaction.atomic():
                # Extract m2m fields
                utenti_assegnati_ids = payload.dict().get("utenti_assegnati_ids")
                documenti_ids = payload.dict().get("documenti_ids")
                
                # Update non-m2m fields
                update_data = payload.dict(exclude={"utenti_assegnati_ids", "documenti_ids"}, exclude_unset=True)
                for attr, value in update_data.items():
                    setattr(attivita, attr, value)
                
                # Update m2m relationships if provided
                if utenti_assegnati_ids is not None:
                    attivita.utenti_assegnati.set(utenti_assegnati_ids)
                
                if documenti_ids is not None:
                    attivita.documenti.set(documenti_ids)
                
                attivita.save()
                return attivita, None
        except Attivita.DoesNotExist:
            return None, "Activity not found"
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def delete_attivita(attivita_id, user_role, user_id):
        """
        Deletes an activity based on the user's role.
        
        Args:
            attivita_id (int): ID of the activity to delete
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            tuple: (success, error)
                - success (bool): True if deletion succeeded, False otherwise
                - error (str): Error message, or None if the operation succeeded
        """
        try:
            attivita = Attivita.objects.get(id=attivita_id)
            
            # Verify authorization based on role
            if user_role == Ruolo.STAFF:
                # STAFF can delete any activity
                attivita.delete()
                return True, None
            elif user_role == Ruolo.CLIENTE and attivita.utente_creatore_id == user_id:
                # CLIENT can only delete activities they created
                attivita.delete()
                return True, None
            else:
                # User is not authorized to delete this activity
                return False, "You are not authorized to delete this activity"
        except Attivita.DoesNotExist:
            return False, "Activity not found"
    
    # ------ METHODS FOR UTENTE_ATTIVITA APIs ------
    
    @staticmethod
    def list_utente_attivita():
        """
        Gets all user-activity associations.
        
        Returns:
            list: List of all user-activity associations
        """
        return UtenteAttivita.objects.all()
    
    @staticmethod
    def get_utente_attivita(utente_attivita_id):
        """
        Gets a specific user-activity association.
        
        Args:
            utente_attivita_id (int): ID of the user-activity association
            
        Returns:
            tuple: (utente_attivita, error)
                - utente_attivita (UtenteAttivita): The requested user-activity association, or None if not found
                - error (str): Error message, or None if the operation succeeded
        """
        try:
            utente_attivita = UtenteAttivita.objects.get(id=utente_attivita_id)
            return utente_attivita, None
        except UtenteAttivita.DoesNotExist:
            return None, "User-activity association not found"
    
    @staticmethod
    def create_utente_attivita(utente_id, attivita_id):
        """
        Creates a new user-activity association.
        
        Args:
            utente_id (int): ID of the user
            attivita_id (int): ID of the activity
            
        Returns:
            tuple: (utente_attivita, error)
                - utente_attivita (UtenteAttivita): The created user-activity association, or None if the operation failed
                - error (str): Error message, or None if the operation succeeded
        """
        try:
            # Check if the association already exists
            if UtenteAttivita.objects.filter(utente_id=utente_id, attivita_id=attivita_id).exists():
                return None, "The user is already associated with this activity"
            
            utente_attivita = UtenteAttivita.objects.create(
                utente_id=utente_id,
                attivita_id=attivita_id
            )
            return utente_attivita, None
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def delete_utente_attivita(utente_attivita_id):
        """
        Deletes a user-activity association.
        
        Args:
            utente_attivita_id (int): ID of the user-activity association
            
        Returns:
            tuple: (success, error)
                - success (bool): True if deletion succeeded, False otherwise
                - error (str): Error message, or None if the operation succeeded
        """
        try:
            utente_attivita = UtenteAttivita.objects.get(id=utente_attivita_id)
            utente_attivita.delete()
            return True, None
        except UtenteAttivita.DoesNotExist:
            return False, "User-activity association not found"
    
    # ------ METODI DI UTILITÀ ------
    
    @staticmethod
    def associa_documento_a_attivita(documento_id, attivita_id):
        """
        Associa un documento a un'attività.
        
        Args:
            documento_id (int): ID del documento
            attivita_id (int): ID dell'attività
            
        Returns:
            tuple: (successo, messaggio) dove:
                - successo (bool): True se l'operazione è riuscita, False altrimenti
                - messaggio (str): Messaggio informativo
        """
        try:
            from documento.models import Documento
            documento = Documento.objects.get(id=documento_id)
        except Documento.DoesNotExist:
            return False, "Documento non trovato"
        except ImportError:
            return False, "Modello Documento non disponibile"
        
        try:
            attivita = Attivita.objects.get(id=attivita_id)
        except Attivita.DoesNotExist:
            return False, "Attività non trovata"
        
        # Verifico se il documento è già associato all'attività
        if documento in attivita.documenti.all():
            return True, "Il documento è già associato all'attività"
        
        # Associo il documento all'attività
        attivita.documenti.add(documento)
        attivita.save()
        
        return True, "Documento associato all'attività con successo"
    
    @staticmethod
    def crea_attivita(titolo, data, creatore_id, descrizione=None, luogo=None, 
                     codice_cer=None, mezzo_rimorchio_id=None, note=None):
        """
        Crea una nuova attività.
        
        Args:
            titolo (str): Titolo dell'attività
            data (datetime): Data dell'attività
            creatore_id (int): ID dell'utente che crea l'attività
            descrizione (str, optional): Descrizione dell'attività
            luogo (str, optional): Luogo dell'attività
            codice_cer (str, optional): Codice CER dell'attività
            mezzo_rimorchio_id (int, optional): ID del mezzo e rimorchio
            note (str, optional): Note aggiuntive
            
        Returns:
            tuple: (attivita, creata, messaggio)
                - attivita (Attivita): L'oggetto Attivita creato, o None se l'operazione è fallita
                - creata (bool): True se l'operazione è riuscita, False altrimenti
                - messaggio (str): Messaggio informativo o di errore
        """
        try:
            creatore = Utente.objects.get(id=creatore_id)
        except Utente.DoesNotExist:
            return None, False, "Utente creatore non trovato"
        
        # Verifica del mezzo e rimorchio
        mezzo_rimorchio = None
        if mezzo_rimorchio_id:
            try:
                mezzo_rimorchio = MezzoRimorchio.objects.get(id=mezzo_rimorchio_id)
                
                # Verifico se il mezzo è già occupato nella data specificata
                mezzi_occupati = Attivita.objects.filter(
                    mezzo_rimorchio=mezzo_rimorchio,
                    data__date=data.date(),
                    statoAttivita__in=[StatoAttivita.PROGRAMMATA, StatoAttivita.INIZIATA]
                )
                
                if mezzi_occupati.exists():
                    return None, False, "Il mezzo e rimorchio selezionato è già assegnato ad un'altra attività in questa data"
                    
            except MezzoRimorchio.DoesNotExist:
                return None, False, "Mezzo e rimorchio non trovato"
        
        # Creazione dell'attività
        attivita = Attivita.objects.create(
            titolo=titolo,
            descrizione=descrizione,
            data=data,
            luogo=luogo,
            codiceCer=codice_cer,
            utente_creatore=creatore,
            mezzo_rimorchio=mezzo_rimorchio,
            note=note,
            statoAttivita=StatoAttivita.PROGRAMMATA
        )
        
        return attivita, True, "Attività creata con successo"
    

    
    @staticmethod
    def cambia_stato_attivita(attivita_id, nuovo_stato, utente_id=None):
        """
        Cambia lo stato di un'attività.
        
        Args:
            attivita_id (int): ID dell'attività
            nuovo_stato (str): Nuovo stato dell'attività (StatoAttivita)
            utente_id (int, optional): ID dell'utente che effettua il cambio di stato
            
        Returns:
            tuple: (successo, messaggio, attivita)
                - successo (bool): True se l'operazione è riuscita, False altrimenti
                - messaggio (str): Messaggio informativo o di errore
                - attivita (Attivita): L'oggetto Attivita aggiornato, o None se l'operazione è fallita
        """
        try:
            attivita = Attivita.objects.get(id=attivita_id)
        except Attivita.DoesNotExist:
            return False, "Attività non trovata", None
        
        # Verifica se il nuovo stato è valido
        stati_validi = [choice[0] for choice in StatoAttivita.choices]
        if nuovo_stato not in stati_validi:
            return False, f"Stato non valido. Stati validi: {', '.join(stati_validi)}", None
        
        # Verifica se il cambio di stato è logico
        if attivita.statoAttivita == StatoAttivita.TERMINATA and nuovo_stato != StatoAttivita.TERMINATA:
            return False, "Non è possibile cambiare lo stato di un'attività già terminata", None
        
        # Aggiorno lo stato
        vecchio_stato = attivita.statoAttivita
        attivita.statoAttivita = nuovo_stato
        attivita.save()
        
        # Potremmo aggiungere qui altre logiche, come registrare il cambio di stato in un log
        
        return True, f"Stato dell'attività cambiato da {vecchio_stato} a {nuovo_stato}", attivita
    
    @staticmethod
    def verifica_risorse_disponibili(data, numero_operatori=1, mezzo_rimorchio_id=None):
        """
        Verifica se ci sono risorse disponibili (operatori, mezzi) per una data specifica.
        
        Args:
            data (date): Data per cui verificare la disponibilità
            numero_operatori (int, optional): Numero di operatori richiesti
            mezzo_rimorchio_id (int, optional): ID del mezzo e rimorchio richiesto
            
        Returns:
            dict: Dizionario con il risultato della verifica:
                {
                    'disponibile': bool,
                    'operatori_disponibili': list,  # Lista di operatori disponibili
                    'mezzo_disponibile': bool,  # True se il mezzo specificato è disponibile
                    'mezzi_disponibili': list  # Lista di mezzi disponibili
                }
        """
        # Verifico la disponibilità degli operatori
        operatori_disponibili = UtenteController.trova_operatori_disponibili(data)
        
        # Verifico la disponibilità del mezzo specifico
        mezzo_disponibile = True
        if mezzo_rimorchio_id:
            mezzi_occupati = Attivita.objects.filter(
                mezzo_rimorchio_id=mezzo_rimorchio_id,
                data__date=data,
                statoAttivita__in=[StatoAttivita.PROGRAMMATA, StatoAttivita.INIZIATA]
            )
            mezzo_disponibile = not mezzi_occupati.exists()
        
        # Verifico tutti i mezzi disponibili
        mezzi_occupati_ids = Attivita.objects.filter(
            data__date=data,
            statoAttivita__in=[StatoAttivita.PROGRAMMATA, StatoAttivita.INIZIATA]
        ).values_list('mezzo_rimorchio_id', flat=True)
        
        mezzi_disponibili = MezzoRimorchio.objects.exclude(id__in=mezzi_occupati_ids)
        
        # Determino se ci sono risorse sufficienti
        disponibile = (
            len(operatori_disponibili) >= numero_operatori and
            (not mezzo_rimorchio_id or mezzo_disponibile)
        )
        
        return {
            'disponibile': disponibile,
            'operatori_disponibili': operatori_disponibili,
            'mezzo_disponibile': mezzo_disponibile,
            'mezzi_disponibili': list(mezzi_disponibili)
        }

    @staticmethod
    def get_documento_by_attivita(attivita_id):
        """
        Gets the document associated with a specific activity.
        
        Args:
            attivita_id (int): Activity ID to get document for
            
        Returns:
            dict or None: Document data associated with the activity, or None if no document
        """
        try:
            attivita = Attivita.objects.get(id=attivita_id)
            documento = attivita.documenti.first()  # Get the first (and presumably only) document
            
            if not documento:
                return None
            
            # Convert to dictionary with proper file handling
            documento_data = {
                'id': documento.id,
                'tipoDocumento': documento.tipoDocumento,
                'dataInserimento': documento.dataInserimento,
                'dataScadenza': documento.dataScadenza,
                'file': documento.file.name if documento.file and documento.file.name else None,
                'operatore_id': documento.operatore.id if documento.operatore else None,
                'operatore_nome': f"{documento.operatore.first_name} {documento.operatore.last_name}" if documento.operatore else None
            }
            
            return documento_data
            
        except Attivita.DoesNotExist:
            return None