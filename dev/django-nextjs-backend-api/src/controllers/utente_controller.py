"""
Controller for user management.
This module contains the business logic for operations on users,
such as absence management, operator availability, etc.
"""
from datetime import datetime, date
from django.db.models import Q
from django.contrib.auth import authenticate
from ninja_jwt.tokens import RefreshToken
from utente.models import Utente, Ruolo
from assenza.models import Assenza
from attivita.models import Attivita, StatoAttivita
from utente_attivita.models import UtenteAttivita


class UtenteController:
    """
    Controller for user management.
    """
    
    # ------ METHODS FOR UTENTE API ------
    
    @staticmethod
    def get_staff_operatori(user_id):
        """
        Gets all users with STAFF or OPERATORE roles, excluding the current user.
        
        Args:
            user_id (int): ID of the current user to exclude from results
            
        Returns:
            list: List of users with STAFF or OPERATORE roles, excluding the current user
        """
        # Get all users with STAFF or OPERATORE roles, excluding the current user
        users = Utente.objects.filter(
            ruolo__in=[Ruolo.STAFF, Ruolo.OPERATORE]
        ).exclude(id=user_id)
        
        # Set isAutenticato flag for each user
        for user in users:
            user.isAutenticato = user.is_authenticated
            
        return users
    
    @staticmethod
    def login(email, password):
        """
        Authenticates a user using email and password.
        
        Args:
            email (str): User's email
            password (str): User's password
            
        Returns:
            tuple: (success, data, message)
                - success (bool): True if authentication was successful, False otherwise
                - data (dict): Dictionary with JWT tokens if success=True, otherwise None
                - message (str): Error message if success=False, otherwise None
        """
        try:
            user = authenticate(email=email, password=password)
            
            if user is None:
                return False, None, "Invalid credentials. Please verify email and password."
            
            # Create JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return True, {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }, None
        except Exception as e:
            return False, None, f"Error during login: {str(e)}"
    
    @staticmethod
    def get_current_user(user):
        """
        Gets the currently authenticated user.
        
        Args:
            user (Utente): The authenticated user
            
        Returns:
            Utente: The authenticated user with the isAutenticato flag set
        """
        user.isAutenticato = user.is_authenticated
        return user
    
    @staticmethod
    def register_user(payload, is_authenticated=False, user_role=None):
        """
        Registers a new user with specified role.
        
        Args:
            payload (dict): Data of the user to register
            is_authenticated (bool): If the request comes from an authenticated user
            user_role (str): Role of the user making the request
            
        Returns:
            tuple: (success, user, errors)
                - success (bool): True if registration succeeded, False otherwise
                - user (Utente): The registered user if success=True, otherwise None
                - errors (dict): Dictionary with errors if success=False, otherwise None
        """
        try:
            is_staff = is_authenticated and user_role == Ruolo.STAFF
            
            # Role validation
            if payload.ruolo:
                # Check if the role is valid
                if payload.ruolo not in [choice[0] for choice in Ruolo.choices]:
                    return False, None, {"non_field_errors": [f"Invalid role. Choose from: {', '.join([choice[0] for choice in Ruolo.choices])}"]}
                
                # Permission validation
                if not is_authenticated and payload.ruolo != Ruolo.CLIENTE:
                    return False, None, {"non_field_errors": ["Unauthenticated users can only register as CLIENT"]}
                
                if is_authenticated and not is_staff and payload.ruolo != Ruolo.CLIENTE:
                    return False, None, {"non_field_errors": ["Only STAFF users can register OPERATOR or STAFF users"]}
                
                if payload.ruolo == Ruolo.STAFF and not is_staff:
                    return False, None, {"non_field_errors": ["Only administrators can create STAFF accounts"]}
            
            # Set role based on authorization
            actual_role = payload.ruolo
            if not is_authenticated:
                actual_role = Ruolo.CLIENTE
            
            # Create user
            user = Utente.objects.create_user(
                email=payload.email,
                password=payload.password,
                nome=payload.nome,
                cognome=payload.cognome,
                dataDiNascita=payload.dataDiNascita,
                luogoDiNascita=payload.luogoDiNascita,
                residenza=payload.residenza,
                ruolo=actual_role or Ruolo.CLIENTE  # Default to CLIENT
            )
            
            user.isAutenticato = False  # Not authenticated
            return True, user, None
            
        except Exception as e:
            # Error handling
            error_dict = {}
            if hasattr(e, 'message_dict'):
                error_dict = e.message_dict
            else:
                error_dict = {"non_field_errors": [str(e)]}
            
            return False, None, error_dict
    
    @staticmethod
    def list_utenti():
        """
        Gets all users.
        
        Returns:
            list: List of all users
        """
        users = Utente.objects.all()
        for user in users:
            user.isAutenticato = user.is_authenticated
        return users
    
    @staticmethod
    def get_utente(utente_id, user_role, user_id):
        """
        Gets a specific user.
        
        Args:
            utente_id (int): ID of the user to get
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            tuple: (user, error)
                - user (Utente): The requested user, or None if not found or not authorized
                - error (str): Error message, or None if the operation succeeded
        """
        # Verify authorization
        if user_role != Ruolo.STAFF and user_id != utente_id:
            return None, "Not authorized"
        
        try:
            utente = Utente.objects.get(id=utente_id)
            utente.isAutenticato = utente.is_authenticated
            return utente, None
        except Utente.DoesNotExist:
            return None, "User not found"
    
    @staticmethod
    def create_utente(payload):
        """
        Creates a new user.
        
        Args:
            payload (dict): Data of the user to create
            
        Returns:
            tuple: (user, error)
                - user (Utente): The created user, or None if the operation failed
                - error (str): Error message, or None if the operation succeeded
        """
        try:
            utente = Utente.objects.create_user(
                email=payload.email,
                password=payload.password,
                nome=payload.nome,
                cognome=payload.cognome,
                dataDiNascita=payload.dataDiNascita,
                luogoDiNascita=payload.luogoDiNascita,
                residenza=payload.residenza,
                ruolo=payload.ruolo
            )
            utente.isAutenticato = utente.is_authenticated
            return utente, None
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def update_utente(utente_id, payload, user_role, user_id):
        """
        Updates an existing user.
        
        Args:
            utente_id (int): ID of the user to update
            payload (dict): Data of the user to update
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            tuple: (user, error)
                - user (Utente): The updated user, or None if not found or not authorized
                - error (str): Error message, or None if the operation succeeded
        """
        # Verify authorization
        if user_role != Ruolo.STAFF and user_id != utente_id:
            return None, "Not authorized"
        
        try:
            utente = Utente.objects.get(id=utente_id)
            
            # Non-STAFF cannot change roles
            if user_role != Ruolo.STAFF and payload.dict().get("ruolo") and payload.ruolo != utente.ruolo:
                return None, "Only administrators can change user roles"
            
            # Update only provided fields
            for field, value in payload.dict(exclude_unset=True).items():
                setattr(utente, field, value)
            
            utente.save()
            utente.isAutenticato = utente.is_authenticated
            return utente, None
        except Utente.DoesNotExist:
            return None, "User not found"
    
    @staticmethod
    def delete_utente(utente_id):
        """
        Deletes a user.
        
        Args:
            utente_id (int): ID of the user to delete
            
        Returns:
            tuple: (success, error)
                - success (bool): True if deletion succeeded, False otherwise
                - error (str): Error message, or None if the operation succeeded
        """
        try:
            utente = Utente.objects.get(id=utente_id)
            utente.delete()
            return True, None
        except Utente.DoesNotExist:
            return False, "User not found"
    
    # ------ METHODS FOR ABSENCE APIs ------
    
    @staticmethod
    def list_assenze(user_role, user_id):
        """
        Gets all absences based on the user's role.
        
        Args:
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            list: List of absences authorized for the user
        """
        # Admin sees all absences
        if user_role == Ruolo.STAFF:
            return Assenza.objects.all()
        # Normal users see only their own absences
        return Assenza.objects.filter(operatore_id=user_id) | Assenza.objects.filter(utente_id=user_id)
    
    @staticmethod
    def get_assenza(assenza_id, user_role, user_id):
        """
        Gets a specific absence.
        
        Args:
            assenza_id (int): ID of the absence to get
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            tuple: (absence, error)
                - absence (Assenza): The requested absence, or None if not found or not authorized
                - error (str): Error message, or None if the operation succeeded
        """
        try:
            assenza = Assenza.objects.get(id=assenza_id)
            
            # Verify authorization
            if user_role != Ruolo.STAFF and assenza.operatore_id != user_id and assenza.utente_id != user_id:
                return None, "Not authorized"
            
            return assenza, None
        except Assenza.DoesNotExist:
            return None, "Absence not found"
    
    @staticmethod
    def create_assenza(payload, user_role, user_id):
        """
        Creates a new absence.
        
        Args:
            payload (dict): Data of the absence to create
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            tuple: (absence, error)
                - absence (Assenza): The created absence, or None if the operation failed
                - error (str): Error message, or None if the operation succeeded
        """
        operatore_id = payload.operatore_id
        
        # If the user is not staff, they can create absences only for themselves
        if user_role != Ruolo.STAFF and operatore_id != user_id:
            operatore_id = user_id
        
        try:
            assenza = Assenza.objects.create(
                operatore_id=operatore_id,
                tipoAssenza=payload.tipoAssenza,
                dataInizio=payload.dataInizio,
                dataFine=payload.dataFine
            )
            
            return assenza, None
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def update_assenza(assenza_id, payload, user_role, user_id):
        """
        Updates an existing absence.
        
        Args:
            assenza_id (int): ID of the absence to update
            payload (dict): Data of the absence to update
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            tuple: (absence, error)
                - absence (Assenza): The updated absence, or None if not found or not authorized
                - error (str): Error message, or None if the operation succeeded
        """
        try:
            assenza = Assenza.objects.get(id=assenza_id)
            
            # Verify authorization
            if user_role != Ruolo.STAFF and assenza.operatore_id != user_id and assenza.utente_id != user_id:
                return None, "Not authorized"
            
            # Update only provided fields
            payload_dict = payload.dict(exclude_unset=True)
            for field, value in payload_dict.items():
                setattr(assenza, field, value)
            
            assenza.save()
            return assenza, None
        except Assenza.DoesNotExist:
            return None, "Absence not found"
    
    @staticmethod
    def delete_assenza(assenza_id, user_role, user_id):
        """
        Deletes an absence.
        
        Args:
            assenza_id (int): ID of the absence to delete
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            tuple: (success, error)
                - success (bool): True if deletion succeeded, False otherwise
                - error (str): Error message, or None if the operation succeeded
        """
        try:
            assenza = Assenza.objects.get(id=assenza_id)
            
            # Verify authorization
            if user_role != Ruolo.STAFF and assenza.operatore_id != user_id and assenza.utente_id != user_id:
                return False, "Not authorized"
            
            assenza.delete()
            return True, None
        except Assenza.DoesNotExist:
            return False, "Absence not found"
    
    @staticmethod
    def get_assenze_by_operatore(operatore_id, user_role, user_id):
        """
        Gets all absences for a specific operator.
        
        Args:
            operatore_id (int): ID of the operator
            user_role (str): Role of the user making the request
            user_id (int): ID of the user making the request
            
        Returns:
            tuple: (absences, error)
                - absences (list): List of absences for the operator, or None if not authorized
                - error (str): Error message, or None if the operation succeeded
        """
        # Verify authorization
        if user_role != Ruolo.STAFF and user_id != operatore_id:
            return None, "Not authorized"
        
        return (Assenza.objects.filter(operatore_id=operatore_id) | Assenza.objects.filter(utente_id=operatore_id)), None
    
    # ------ UTILITY METHODS ------
    
    @staticmethod
    def controlla_disponibilita_operatore(operatore_id, data_inizio, data_fine=None):
        """
        Checks if an operator is available in a specific period.
        
        Args:
            operatore_id (int): ID of the operator to check
            data_inizio (date): Start date of the period to check
            data_fine (date, optional): End date of the period to check. If None, checks only for data_inizio.
            
        Returns:
            dict: Dictionary with the result of the availability check:
                {
                    'disponibile': bool,
                    'motivi_indisponibilita': list,  # List of strings with the reasons for unavailability
                    'conflitti': {
                        'assenze': list,  # List of Absence objects
                        'attivita': list  # List of Activity objects
                    }
                }
        """
        # If data_fine is not specified, check only for data_inizio
        data_fine = data_fine or data_inizio
        
        # Verify that operatore_id corresponds to a user with OPERATORE role
        try:
            operatore = Utente.objects.get(id=operatore_id, ruolo=Ruolo.OPERATORE)
        except Utente.DoesNotExist:
            return {
                'disponibile': False,
                'motivi_indisponibilita': ['Operator not found or does not have operator role'],
                'conflitti': {'assenze': [], 'attivita': []}
            }
        
        # Check if there are absences in the specified period (check on both fields)
        assenze_conflittuali_new = Assenza.objects.filter(
            operatore=operatore,
            dataInizio__lte=data_fine,
            dataFine__gte=data_inizio
        )
        
        assenze_conflittuali_old = Assenza.objects.filter(
            utente=operatore,
            data_inizio__lte=data_fine,
            data_fine__gte=data_inizio
        )
        
        # Merge the two queries
        assenze_conflittuali = assenze_conflittuali_new | assenze_conflittuali_old
        
        # Check if there are already scheduled or ongoing activities
        attivita_conflittuali = []
        utente_attivita = UtenteAttivita.objects.filter(
            utente=operatore
        ).select_related('attivita')
        
        for ua in utente_attivita:
            attivita = ua.attivita
            # Consider only scheduled or started activities with specified date
            if (attivita.statoAttivita != StatoAttivita.TERMINATA and 
                attivita.data and 
                attivita.data.date() == data_inizio):
                attivita_conflittuali.append(attivita)
        
        # Build the result
        motivi_indisponibilita = []
        if assenze_conflittuali.exists():
            motivi_indisponibilita.append('The operator has absences registered in the specified period')
        
        if attivita_conflittuali:
            motivi_indisponibilita.append('The operator is already assigned to other activities in the specified period')
        
        disponibile = len(motivi_indisponibilita) == 0
        
        return {
            'disponibile': disponibile,
            'motivi_indisponibilita': motivi_indisponibilita,
            'conflitti': {
                'assenze': list(assenze_conflittuali),
                'attivita': attivita_conflittuali
            }
        }
    
    @staticmethod
    def gestisci_assenza(utente_id, data_inizio, data_fine, tipo, descrizione=None, approvata=False, approvata_da_id=None):
        """
        Creates or updates an absence for a user.
        
        Args:
            utente_id (int): ID of the user
            data_inizio (date): Start date of the absence
            data_fine (date): End date of the absence
            tipo (str): Type of absence (SICKNESS, VACATION, etc.)
            descrizione (str, optional): Description of the absence
            approvata (bool, optional): If the absence is approved
            approvata_da_id (int, optional): ID of the user who approved the absence
            
        Returns:
            tuple: (absence, created) where absence is the Absence object and created is a boolean indicating if the absence was created or updated
        """
        try:
            operatore = Utente.objects.get(id=utente_id)
        except Utente.DoesNotExist:
            raise ValueError("Operator not found")
        
        # Check if an absence already exists for the operator in the same period
        # Search in both new and old fields
        assenza_esistente = Assenza.objects.filter(
            Q(operatore=operatore, dataInizio=data_inizio, dataFine=data_fine) |
            Q(utente=operatore, data_inizio=data_inizio, data_fine=data_fine)
        ).first()
        
        if assenza_esistente:
            # Update the existing absence and set the new fields
            assenza_esistente.operatore = operatore
            assenza_esistente.dataInizio = data_inizio
            assenza_esistente.dataFine = data_fine
            assenza_esistente.tipoAssenza = tipo
            if descrizione:
                assenza_esistente.descrizione = descrizione
            assenza_esistente.approvata = approvata
            if approvata_da_id:
                assenza_esistente.approvata_da_id = approvata_da_id
            assenza_esistente.save()
            return assenza_esistente, False
        else:
            # Create a new absence
            dati_assenza = {
                'operatore': operatore,
                'dataInizio': data_inizio,
                'dataFine': data_fine,
                'tipoAssenza': tipo,
                'descrizione': descrizione,
                'approvata': approvata
            }
            
            if approvata_da_id:
                dati_assenza['approvata_da_id'] = approvata_da_id
            
            nuova_assenza = Assenza.objects.create(**dati_assenza)
            return nuova_assenza, True
    
    @staticmethod
    def trova_operatori_disponibili(data, luogo=None):
        """
        Finds all operators available on a specific date.
        
        Args:
            data (date): Date to check availability for
            luogo (str, optional): Location of the activity, to filter operators by geographic area
            
        Returns:
            list: List of available operators
        """
        # Get all operators
        operatori = Utente.objects.filter(ruolo=Ruolo.OPERATORE)
        
        # Filter operators who have absences on the specified date (check on both fields)
        operatori_in_assenza_ids_new = Assenza.objects.filter(
            operatore__ruolo=Ruolo.OPERATORE,
            dataInizio__lte=data,
            dataFine__gte=data
        ).values_list('operatore_id', flat=True)
        
        operatori_in_assenza_ids_old = Assenza.objects.filter(
            utente__ruolo=Ruolo.OPERATORE,
            data_inizio__lte=data,
            data_fine__gte=data
        ).values_list('utente_id', flat=True)
        
        # Filter operators who are already assigned to activities on the specified date
        operatori_occupati_ids = UtenteAttivita.objects.filter(
            utente__ruolo=Ruolo.OPERATORE,
            attivita__data__date=data,
            attivita__statoAttivita__in=[StatoAttivita.PROGRAMMATA, StatoAttivita.INIZIATA]
        ).values_list('utente_id', flat=True)
        
        # Exclude unavailable operators
        operatori_non_disponibili_ids = set(list(operatori_in_assenza_ids_new) + list(operatori_in_assenza_ids_old) + list(operatori_occupati_ids))
        operatori_disponibili = operatori.exclude(id__in=operatori_non_disponibili_ids)
        
        # If a location is specified, I could apply additional filters
        # (this is just a placeholder for a future implementation)
        if luogo:
            # Example: filter operators by geographic area
            # In a real implementation, you should have a model that associates operators with zones
            pass
        
        return list(operatori_disponibili)
    
    @staticmethod
    def assegna_operatore_a_attivita(operatore_id, attivita_id, verifica_disponibilita=True):
        """
        Assigns an operator to an activity, optionally checking availability.
        
        Args:
            operatore_id (int): ID of the operator
            attivita_id (int): ID of the activity
            verifica_disponibilita (bool, optional): Whether to verify the operator's availability
            
        Returns:
            tuple: (success, message, user_activity)
                - success (bool): True if the operation succeeded, False otherwise
                - message (str): Informational or error message
                - user_activity (UtenteAttivita): The created UtenteAttivita object, or None if the operation failed
        """
        try:
            operatore = Utente.objects.get(id=operatore_id, ruolo=Ruolo.OPERATORE)
        except Utente.DoesNotExist:
            return False, "Operator not found or does not have operator role", None
        
        try:
            attivita = Attivita.objects.get(id=attivita_id)
        except Attivita.DoesNotExist:
            return False, "Activity not found", None
        
        # Check if the operator is already assigned to the activity
        if UtenteAttivita.objects.filter(utente=operatore, attivita=attivita).exists():
            return False, "The operator is already assigned to this activity", None
        
        # Check the availability of the operator if requested
        if verifica_disponibilita and attivita.data:
            data_attivita = attivita.data.date()
            disponibilita = UtenteController.controlla_disponibilita_operatore(
                operatore_id=operatore_id, 
                data_inizio=data_attivita
            )
            
            if not disponibilita['disponibile']:
                return False, f"Operator not available: {', '.join(disponibilita['motivi_indisponibilita'])}", None
        
        # Create the association between operator and activity
        utente_attivita = UtenteAttivita.objects.create(
            utente=operatore,
            attivita=attivita
        )
        
        return True, "Operator successfully assigned to the activity", utente_attivita