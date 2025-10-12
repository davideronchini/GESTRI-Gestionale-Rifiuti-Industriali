from documento.models import Documento
from django.db.models import Q
from utente.models import Ruolo
from django.http import Http404
from django.core.exceptions import PermissionDenied
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
                return Attivita.objects.filter(
                    utente_attivita__utente_id=user_id
                ).distinct().order_by('-data_creazione')
            else:  # Ruolo.CLIENTE
                # CLIENTE sees only activities they created
                return Attivita.objects.filter(
                    utente_creatore__id=user_id
                ).order_by('-data_creazione')
        except Exception as e:
            print(f"Errore in list_attivita: {str(e)}")
            # In caso di errore, restituisci un queryset vuoto
            return Attivita.objects.none()

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
        Creates a new activity.
        
        Args:
            payload (AttivitaCreateSchema): Data for the new activity
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            tuple: (attivita, error)
                - attivita (Attivita): Created activity object, or None if failed
                - error (str): Error message, or None if the operation succeeded
        """
        try:
            # Get the user who is creating the activity
            try:
                utente_creatore = Utente.objects.get(id=user_id)
            except Utente.DoesNotExist:
                return None, "User not found"
            
            # Validate mezzo_rimorchio if provided
            mezzo_rimorchio = None
            if payload.mezzo_rimorchio_id:
                try:
                    mezzo_rimorchio = MezzoRimorchio.objects.get(id=payload.mezzo_rimorchio_id, attivo=True)
                    
                    # Check if mezzo is available
                    from mezzo.models import StatoMezzo
                    if mezzo_rimorchio.mezzo.statoMezzo != StatoMezzo.DISPONIBILE:
                        return None, f"Il mezzo non è disponibile (stato: {mezzo_rimorchio.mezzo.statoMezzo})"
                    
                    # Check if mezzo is already assigned to another activity
                    other_activity = Attivita.objects.filter(
                        mezzo_rimorchio=mezzo_rimorchio,
                        statoAttivita__in=[StatoAttivita.PROGRAMMATA, StatoAttivita.INIZIATA]
                    ).first()
                    
                    if other_activity:
                        return None, f"Il mezzo è già assegnato all'attività '{other_activity.titolo}'"
                        
                except MezzoRimorchio.DoesNotExist:
                    return None, "Mezzo-rimorchio non trovato o non attivo"
            
            # Create the activity
            with transaction.atomic():
                attivita = Attivita.objects.create(
                    titolo=payload.titolo,
                    descrizione=payload.descrizione,
                    statoAttivita=payload.statoAttivita or StatoAttivita.PROGRAMMATA,
                    data=payload.data,
                    luogo=payload.luogo,
                    codiceCer=payload.codiceCer,
                    durata=payload.durata,
                    utente_creatore=utente_creatore,
                    mezzo_rimorchio=mezzo_rimorchio
                )
                
                # Associate operators if provided
                if payload.utenti_assegnati_ids:
                    for operatore_id in payload.utenti_assegnati_ids:
                        try:
                            operatore = Utente.objects.get(id=operatore_id, ruolo=Ruolo.OPERATORE, is_active=True)
                            UtenteAttivita.objects.create(
                                attivita=attivita,
                                utente=operatore
                            )
                        except Utente.DoesNotExist:
                            # Skip invalid operator IDs
                            pass
                
                # Note: documenti_ids handling would go here if needed in the future
                
            return attivita, None
            
        except Exception as e:
            return None, f"Errore durante la creazione: {str(e)}"
    
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

    @staticmethod
    def update_attivita(attivita_id, user_role, user_id, update_data):
        """
        Updates an activity based on the user's role.
        
        Args:
            attivita_id (int): ID of the activity to update
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            update_data (dict): Dictionary with fields to update
            
        Returns:
            tuple: (attivita_detail, error)
                - attivita_detail (dict): Updated activity details, or None if failed
                - error (str): Error message, or None if the operation succeeded
        """
        try:
            attivita = Attivita.objects.select_related(
                'utente_creatore',
                'mezzo_rimorchio',
                'mezzo_rimorchio__mezzo',
                'mezzo_rimorchio__rimorchio'
            ).prefetch_related(
                'utente_attivita__utente'
            ).get(id=attivita_id)
            
            # Verify authorization based on role
            authorized = False
            if user_role == Ruolo.STAFF:
                # STAFF can update any activity
                authorized = True
            elif user_role == Ruolo.CLIENTE and attivita.utente_creatore_id == user_id:
                # CLIENT can only update activities they created
                authorized = True
            
            if not authorized:
                return None, "You are not authorized to update this activity"
            
            # Update fields if provided
            if 'titolo' in update_data and update_data['titolo'] is not None:
                attivita.titolo = update_data['titolo']
            if 'descrizione' in update_data and update_data['descrizione'] is not None:
                attivita.descrizione = update_data['descrizione']
            if 'statoAttivita' in update_data and update_data['statoAttivita'] is not None:
                attivita.statoAttivita = update_data['statoAttivita']
            if 'data' in update_data and update_data['data'] is not None:
                attivita.data = update_data['data']
            if 'luogo' in update_data and update_data['luogo'] is not None:
                attivita.luogo = update_data['luogo']
            if 'codiceCer' in update_data and update_data['codiceCer'] is not None:
                attivita.codiceCer = update_data['codiceCer']
            if 'durata' in update_data and update_data['durata'] is not None:
                attivita.durata = update_data['durata']
            
            attivita.save()

            # If the activity date was modified, remove assigned operators
            # who have an Assenza covering the new activity date.
            try:
                if 'data' in update_data and attivita.data:
                    activity_date = attivita.data.date()
                    # Import locally to avoid circular imports
                    from assenza.models import Assenza as AssenzaModel
                    from utente_attivita.models import UtenteAttivita as UtenteAttivitaModel

                    # Get all assigned user associations for this activity
                    assigned_qs = UtenteAttivitaModel.objects.filter(attivita=attivita).select_related('utente')
                    to_remove = []
                    for ua in assigned_qs:
                        uid = getattr(ua, 'utente_id', None)
                        if not uid:
                            continue

                        # Check if this user has any assenza covering activity_date
                        has_assenza = AssenzaModel.objects.filter(
                            (Q(operatore_id=uid) | Q(utente_id=uid)) & (
                                Q(dataInizio__lte=activity_date, dataFine__gte=activity_date) |
                                Q(data_inizio__lte=activity_date, data_fine__gte=activity_date)
                            )
                        ).exists()

                        if has_assenza:
                            to_remove.append(ua.id)

                    if to_remove:
                        with transaction.atomic():
                            UtenteAttivitaModel.objects.filter(id__in=to_remove).delete()
            except Exception:
                # Don't break update flow due to cleanup errors; log in stdout
                print(f"Warning: failed to cleanup assignments after activity update {attivita_id}")
            
            # Return updated activity details using the get_attivita_detail method
            return AttivitaController.get_attivita_detail(attivita_id, user_role, user_id)
            
        except Attivita.DoesNotExist:
            return None, "Activity not found"
        
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
        # Build a role-scoped base queryset using the existing list_attivita
        # helper to ensure consistent permission rules across list endpoints.
        try:
            role_qs = AttivitaController.list_attivita(user_role=user_role, user_id=user_id)
            # Now filter that role-scoped queryset by the requested date
            qs = role_qs.filter(data__date=data).order_by('-data')
            return qs
        except Exception as e:
            print(f"Errore in list_attivita_by_date: {str(e)}")
            return Attivita.objects.none()
        
    @staticmethod
    def get_documento_by_attivita(attivita_id, user_role, user_id):
        """
        Gets the document associated with a specific activity.
        
        Args:
            attivita_id (int): Activity ID to get document for
            
        Returns:
            dict or None: Document data associated with the activity, or None if no document
        """
        try:
            attivita = Attivita.objects.select_related('utente_creatore').prefetch_related('documenti', 'utente_attivita').get(id=attivita_id)

            # Authorization: STAFF can see, OPERATORE only if assigned, CLIENTE only if creator
            authorized = False
            if user_role == Ruolo.STAFF:
                authorized = True
            elif user_role == Ruolo.OPERATORE and attivita.utente_attivita.filter(utente_id=user_id).exists():
                authorized = True
            elif user_role == Ruolo.CLIENTE and attivita.utente_creatore_id == user_id:
                authorized = True

            if not authorized:
                 raise PermissionDenied("Not authorized to view this document")

            documento = attivita.documenti.first()
            if not documento:
                return None

            documento_data = {
                'id': documento.id,
                'tipoDocumento': documento.tipoDocumento,
                'dataInserimento': documento.dataInserimento,
                'dataScadenza': documento.dataScadenza,
                'file': documento.file.url if documento.file else None,
                'operatore_id': documento.operatore.id if documento.operatore else None,
                'operatore_nome': f"{documento.operatore.first_name} {documento.operatore.last_name}" if documento.operatore else None
            }

            return documento_data
        except Attivita.DoesNotExist:
            return None

    @staticmethod
    def associa_mezzo_rimorchio(attivita_id, mezzo_rimorchio_id, user_role, user_id):
        """
        Associates a mezzo-rimorchio to an activity.
        If a mezzo is already associated, it will be replaced.
        
        Args:
            attivita_id (int): Activity ID to associate mezzo to
            mezzo_rimorchio_id (int): MezzoRimorchio ID to associate
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            tuple: (success: bool, error: str or None)
        """
        try:
            # Check if activity exists and user has permission
            try:
                attivita = Attivita.objects.get(id=attivita_id)
            except Attivita.DoesNotExist:
                return False, "Attività non trovata"
            
            # Permission check
            if user_role == Ruolo.CLIENTE and attivita.utente_creatore.id != user_id:
                return False, "Non autorizzato a modificare questa attività"
            elif user_role == Ruolo.OPERATORE:
                # Check if operatore is assigned to this activity
                if not UtenteAttivita.objects.filter(attivita=attivita, utente_id=user_id).exists():
                    return False, "Non autorizzato a modificare questa attività"
            # STAFF can modify any activity
            
            # Check if mezzo_rimorchio exists and is available
            try:
                mezzo_rimorchio = MezzoRimorchio.objects.get(id=mezzo_rimorchio_id, attivo=True)
            except MezzoRimorchio.DoesNotExist:
                return False, "Mezzo-rimorchio non trovato o non attivo"
            
            # Check if mezzo is available (DISPONIBILE status)
            from mezzo.models import StatoMezzo
            if mezzo_rimorchio.mezzo.statoMezzo != StatoMezzo.DISPONIBILE:
                return False, f"Il mezzo non è disponibile (stato: {mezzo_rimorchio.mezzo.statoMezzo})"
            
            # Check if mezzo is already assigned to another activity
            other_activity = Attivita.objects.filter(
                mezzo_rimorchio=mezzo_rimorchio,
                statoAttivita__in=[StatoAttivita.PROGRAMMATA, StatoAttivita.INIZIATA]
            ).exclude(id=attivita_id).first()
            
            if other_activity:
                return False, f"Il mezzo è già assegnato all'attività '{other_activity.titolo}'"
            
            # Associate mezzo to activity (replace existing if any)
            with transaction.atomic():
                attivita.mezzo_rimorchio = mezzo_rimorchio
                attivita.save()
            
            return True, None
            
        except Exception as e:
            return False, f"Errore durante l'associazione: {str(e)}"
    
    @staticmethod
    def dissocia_mezzo_rimorchio(attivita_id, user_role, user_id):
        """
        Dissociates mezzo-rimorchio from an activity.
        
        Args:
            attivita_id (int): Activity ID to dissociate mezzo from
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            tuple: (success: bool, error: str or None)
        """
        try:
            # Check if activity exists and user has permission
            try:
                attivita = Attivita.objects.get(id=attivita_id)
            except Attivita.DoesNotExist:
                return False, "Attività non trovata"
            
            # Permission check
            if user_role == Ruolo.CLIENTE and attivita.utente_creatore.id != user_id:
                return False, "Non autorizzato a modificare questa attività"
            elif user_role == Ruolo.OPERATORE:
                # Check if operatore is assigned to this activity
                if not UtenteAttivita.objects.filter(attivita=attivita, utente_id=user_id).exists():
                    return False, "Non autorizzato a modificare questa attività"
            # STAFF can modify any activity
            
            # Check if there's a mezzo associated
            if not attivita.mezzo_rimorchio:
                return False, "Nessun mezzo associato a questa attività"
            
            # Dissociate mezzo from activity
            with transaction.atomic():
                attivita.mezzo_rimorchio = None
                attivita.save()
            
            return True, None
            
        except Exception as e:
            return False, f"Errore durante la dissociazione: {str(e)}"
    
    @staticmethod
    def list_operatori_disponibili(attivita_id=None):
        """
        Gets the list of operators (OPERATORE role) available for assignment.

        If attivita_id is provided, excludes users who have an absence
        covering the date of the activity.

        Returns:
            list: List of operators with OPERATORE role
        """
        try:
            # Base queryset: active operators
            operatori_qs = Utente.objects.filter(
                ruolo=Ruolo.OPERATORE,
                is_active=True
            ).order_by('cognome', 'nome')

            # If attivita_id provided, try to obtain the activity date and
            # exclude users who have an Assenza that covers that date.
            if attivita_id is not None:
                try:
                    attivita = Attivita.objects.get(id=attivita_id)
                    # If activity has no date, we can't filter by assenze
                    if attivita.data:
                        activity_date = attivita.data.date()
                        # Import Assenza here to avoid circular imports at module level
                        from assenza.models import Assenza

                        # Find assenze that include the activity date.
                        # The model has duplicated legacy/new fields (dataInizio/dataFine and data_inizio/data_fine),
                        # so check both sets of fields when filtering.
                        assenti_qs = Assenza.objects.filter(
                            Q(dataInizio__lte=activity_date, dataFine__gte=activity_date) |
                            Q(data_inizio__lte=activity_date, data_fine__gte=activity_date)
                        )

                        # Collect user ids from both fields (operatore and utente)
                        assenti_ids = set()
                        for a in assenti_qs:
                            if getattr(a, 'operatore_id', None):
                                assenti_ids.add(a.operatore_id)
                            if getattr(a, 'utente_id', None):
                                assenti_ids.add(a.utente_id)

                        if assenti_ids:
                            operatori_qs = operatori_qs.exclude(id__in=list(assenti_ids))
                except Attivita.DoesNotExist:
                    # If activity not found, fall back to returning all operators
                    pass

            result = []
            for operatore in operatori_qs:
                operatore_data = {
                    'id': operatore.id,
                    'email': operatore.email,
                    'nome': operatore.nome,
                    'cognome': operatore.cognome,
                    'ruolo': operatore.ruolo,
                }
                result.append(operatore_data)

            return result
        except Exception as e:
            print(f"Errore in list_operatori_disponibili: {str(e)}")
            return []

    @staticmethod
    def list_attivita_for_operatore(operatore_id, requesting_user_role, requesting_user_id):
        """
        Returns activities where the given user is assigned or is the creator.
        Permissions: STAFF can view any operatore's activities; OPERATORE can view only their own; CLIENTE maybe limited.
        """
        try:
            # Base queryset: activities where the user is assigned OR is the creator
            qs_assigned = Attivita.objects.filter(utente_attivita__utente_id=operatore_id)
            qs_created = Attivita.objects.filter(utente_creatore_id=operatore_id)

            qs = (qs_assigned | qs_created).distinct().order_by('-data_creazione')

            # Apply requesting user's permissions
            if requesting_user_role == Ruolo.STAFF:
                return qs
            elif requesting_user_role == Ruolo.OPERATORE:
                # operatore can view only their own activities
                if int(requesting_user_id) == int(operatore_id):
                    return qs
                else:
                    return Attivita.objects.none()
            else:
                # CLIENTE: only allow viewing activities they created if operatore_id matches, otherwise none
                if int(requesting_user_id) == int(operatore_id):
                    return qs_created.order_by('-data_creazione')
                return Attivita.objects.none()
        except Exception as e:
            print(f"Errore in list_attivita_for_operatore: {str(e)}")
            return Attivita.objects.none()
    
    @staticmethod
    def associa_operatore(attivita_id, operatore_id, user_role, user_id):
        """
        Associates an operator to an activity.
        
        Args:
            attivita_id (int): Activity ID to associate operator to
            operatore_id (int): Operator (Utente) ID to associate
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            tuple: (success: bool, error: str or None)
        """
        try:
            # Check if activity exists and user has permission
            try:
                attivita = Attivita.objects.get(id=attivita_id)
            except Attivita.DoesNotExist:
                return False, "Attività non trovata"
            
            # Permission check
            if user_role == Ruolo.CLIENTE and attivita.utente_creatore.id != user_id:
                return False, "Non autorizzato a modificare questa attività"
            elif user_role == Ruolo.OPERATORE:
                # Check if operatore is assigned to this activity
                if not UtenteAttivita.objects.filter(attivita=attivita, utente_id=user_id).exists():
                    return False, "Non autorizzato a modificare questa attività"
            # STAFF can modify any activity
            
            # Check if operator exists and has OPERATORE role
            try:
                operatore = Utente.objects.get(id=operatore_id, ruolo=Ruolo.OPERATORE, is_active=True)
            except Utente.DoesNotExist:
                return False, "Operatore non trovato o non attivo"
            
            # Check if operator is already assigned to this activity
            if UtenteAttivita.objects.filter(attivita=attivita, utente=operatore).exists():
                return False, "L'operatore è già assegnato a questa attività"
            
            # Create the association
            UtenteAttivita.objects.create(
                attivita=attivita,
                utente=operatore
            )
            
            return True, None
            
        except Exception as e:
            return False, f"Errore durante l'associazione: {str(e)}"
    
    @staticmethod
    def dissocia_operatore(attivita_id, operatore_id, user_role, user_id):
        """
        Dissociates an operator from an activity.
        
        Args:
            attivita_id (int): Activity ID to dissociate operator from
            operatore_id (int): Operator (Utente) ID to dissociate
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            tuple: (success: bool, error: str or None)
        """
        try:
            # Check if activity exists and user has permission
            try:
                attivita = Attivita.objects.get(id=attivita_id)
            except Attivita.DoesNotExist:
                return False, "Attività non trovata"
            
            # Permission check
            if user_role == Ruolo.CLIENTE and attivita.utente_creatore.id != user_id:
                return False, "Non autorizzato a modificare questa attività"
            elif user_role == Ruolo.OPERATORE:
                # Check if operatore is assigned to this activity
                if not UtenteAttivita.objects.filter(attivita=attivita, utente_id=user_id).exists():
                    return False, "Non autorizzato a modificare questa attività"
            # STAFF can modify any activity
            
            # Check if the association exists
            try:
                utente_attivita = UtenteAttivita.objects.get(
                    attivita=attivita,
                    utente_id=operatore_id
                )
            except UtenteAttivita.DoesNotExist:
                return False, "L'operatore non è assegnato a questa attività"
            
            # Delete the association
            utente_attivita.delete()
            
            return True, None
            
        except Exception as e:
            return False, f"Errore durante la dissociazione: {str(e)}"
