"""
Controller for user management.
This module contains the business logic for operations on users.
"""
from datetime import datetime, date
from django.db.models import Q
from django.db import transaction
from django.contrib.auth import authenticate
from ninja_jwt.tokens import RefreshToken
from utente.models import Utente, Ruolo
from assenza.models import Assenza


class UtenteController:
    """
    Controller for user management.
    """
    
    # ------ METHODS FOR UTENTE API ------
    
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
    def update_user(utente_id, payload, requesting_user_role=None, requesting_user_id=None):
        """
        Aggiorna i campi di un utente se autorizzato.
        - STAFF può aggiornare qualsiasi utente e cambiare ruolo
        - Utente normale può aggiornare solo il proprio record e non può cambiare ruolo

        Restituisce (user, None) in caso di successo oppure (None, error_message)
        """
        try:
            utente = Utente.objects.get(id=utente_id)

            # controllo autorizzazioni
            if requesting_user_role != Ruolo.STAFF:
                # se non staff, può modificare solo se è se stesso
                if int(requesting_user_id) != int(utente_id):
                    return None, "You are not authorized to update this user"

            # Campi aggiornabili
            # Solo STAFF può cambiare il ruolo
            if hasattr(payload, 'ruolo') and payload.ruolo is not None:
                if requesting_user_role == Ruolo.STAFF:
                    if payload.ruolo in [choice[0] for choice in Ruolo.choices]:
                        utente.ruolo = payload.ruolo
                    else:
                        return None, f"Invalid role. Choose from: {', '.join([choice[0] for choice in Ruolo.choices])}"
                else:
                    # non-staff non può cambiare ruolo
                    pass

            # Aggiorna altri campi se forniti
            if hasattr(payload, 'email') and payload.email is not None:
                utente.email = payload.email
            if hasattr(payload, 'nome') and payload.nome is not None:
                utente.nome = payload.nome
            if hasattr(payload, 'cognome') and payload.cognome is not None:
                utente.cognome = payload.cognome
            if hasattr(payload, 'dataDiNascita') and payload.dataDiNascita is not None:
                utente.dataDiNascita = payload.dataDiNascita
            if hasattr(payload, 'luogoDiNascita') and payload.luogoDiNascita is not None:
                utente.luogoDiNascita = payload.luogoDiNascita
            if hasattr(payload, 'residenza') and payload.residenza is not None:
                utente.residenza = payload.residenza

            utente.save()
            return utente, None
        except Utente.DoesNotExist:
            return None, "User not found"
        except Exception as e:
            return None, str(e)

    # ------ METHODS FOR ASSENZA API ------

    @staticmethod
    def list_assenze(user_role, user_id):
        """
        Restituisce le assenze visibili all'utente in base al ruolo.
        STAFF vede tutte, OPERATORE vede le proprie (operatore), CLIENTE vede le proprie (utente).
        """
        try:
            if user_role == Ruolo.STAFF:
                return Assenza.objects.all().order_by('-dataInizio')
            elif user_role == Ruolo.OPERATORE:
                return Assenza.objects.filter(operatore_id=user_id).order_by('-dataInizio')
            else:
                return Assenza.objects.filter(utente_id=user_id).order_by('-dataInizio')
        except Exception as e:
            print(f"Errore in list_assenze: {str(e)}")
            return Assenza.objects.none()

    @staticmethod
    def get_assenza(assenza_id, user_role, user_id):
        """
        Restituisce una singola assenza se l'utente è autorizzato.
        Ritorna (assenza, None) oppure (None, error_message).
        """
        try:
            assenza = Assenza.objects.select_related('operatore', 'utente').get(id=assenza_id)

            # autorizzazione
            if user_role == Ruolo.STAFF:
                return assenza, None
            if assenza.operatore_id == user_id or assenza.utente_id == user_id:
                return assenza, None

            return None, "You are not authorized to view this absence"
        except Assenza.DoesNotExist:
            return None, "Absence not found"
        except Exception as e:
            return None, str(e)

    @staticmethod
    def create_assenza(payload, user_role, user_id):
        """
        Crea una nuova assenza. STAFF può creare per qualsiasi utente/operatore,
        gli utenti normali possono creare solo per sé (operatore_id sarà user_id).
        Ritorna (assenza, None) oppure (None, error_message).
        """
        try:
            # Determina l'operatore associato
            operatore_id = getattr(payload, 'operatore_id', None)

            if user_role == Ruolo.STAFF:
                # STAFF può specificare operatore_id
                operatore = None
                if operatore_id:
                    try:
                        operatore = Utente.objects.get(id=operatore_id)
                    except Utente.DoesNotExist:
                        return None, "Operatore non trovato"
            else:
                # utenti normali possono creare solo per sé
                operatore = Utente.objects.get(id=user_id)

            assenza = Assenza.objects.create(
                operatore=operatore,
                tipoAssenza=getattr(payload, 'tipoAssenza', None) or getattr(payload, 'tipo', None),
                dataInizio=getattr(payload, 'dataInizio', None) or getattr(payload, 'data_inizio', None),
                dataFine=getattr(payload, 'dataFine', None) or getattr(payload, 'data_fine', None),
            )

            # Cleanup: dissociate this user from activities that fall inside the absence interval
            try:
                from attivita.models import Attivita
                from utente_attivita.models import UtenteAttivita

                start = getattr(assenza, 'dataInizio', None) or getattr(assenza, 'data_inizio', None)
                end = getattr(assenza, 'dataFine', None) or getattr(assenza, 'data_fine', None)

                if operatore and start and end:
                    conflicting_activities = Attivita.objects.filter(
                        data__date__gte=start,
                        data__date__lte=end
                    ).values_list('id', flat=True)

                    if conflicting_activities:
                        with transaction.atomic():
                            UtenteAttivita.objects.filter(
                                utente_id=operatore.id,
                                attivita_id__in=list(conflicting_activities)
                            ).delete()
            except Exception:
                print(f"Warning: failed to cleanup assignments after creating assenza for operatore {getattr(operatore, 'id', None)}")

            return assenza, None
        except Exception as e:
            return None, f"Errore durante la creazione: {str(e)}"

    @staticmethod
    def update_assenza(assenza_id, payload, user_role, user_id):
        """
        Aggiorna un'assenza esistente se autorizzato.
        Ritorna (assenza, None) oppure (None, error_message).
        """
        try:
            assenza = Assenza.objects.get(id=assenza_id)

            # autorizzazione
            if user_role != Ruolo.STAFF and not (assenza.operatore_id == user_id or assenza.utente_id == user_id):
                return None, "You are not authorized to update this absence"

            # Aggiorna campi se forniti
            if hasattr(payload, 'tipoAssenza') and payload.tipoAssenza is not None:
                assenza.tipoAssenza = payload.tipoAssenza
            if hasattr(payload, 'dataInizio') and payload.dataInizio is not None:
                assenza.dataInizio = payload.dataInizio
            if hasattr(payload, 'dataFine') and payload.dataFine is not None:
                assenza.dataFine = payload.dataFine
            if hasattr(payload, 'operatore_id') and payload.operatore_id is not None:
                # solo STAFF può cambiare l'operatore
                if user_role == Ruolo.STAFF:
                    try:
                        new_op = Utente.objects.get(id=payload.operatore_id)
                        assenza.operatore = new_op
                    except Utente.DoesNotExist:
                        return None, "Operatore non trovato"

            assenza.save()

            # After updating the assenza dates or operatore, remove conflicting assignments
            try:
                from attivita.models import Attivita
                from utente_attivita.models import UtenteAttivita

                start = getattr(assenza, 'dataInizio', None) or getattr(assenza, 'data_inizio', None)
                end = getattr(assenza, 'dataFine', None) or getattr(assenza, 'data_fine', None)
                op_id = getattr(assenza, 'operatore_id', None) or getattr(assenza, 'utente_id', None)

                if op_id and start and end:
                    conflicting_activities = Attivita.objects.filter(
                        data__date__gte=start,
                        data__date__lte=end
                    ).values_list('id', flat=True)

                    if conflicting_activities:
                        with transaction.atomic():
                            UtenteAttivita.objects.filter(
                                utente_id=op_id,
                                attivita_id__in=list(conflicting_activities)
                            ).delete()
            except Exception:
                print(f"Warning: failed to cleanup assignments after updating assenza {assenza_id}")

            return assenza, None
        except Assenza.DoesNotExist:
            return None, "Absence not found"
        except Exception as e:
            return None, str(e)

    @staticmethod
    def delete_assenza(assenza_id, user_role, user_id):
        """
        Elimina un'assenza se autorizzato. Ritorna (success_bool, error_message).
        """
        try:
            assenza = Assenza.objects.get(id=assenza_id)

            if user_role == Ruolo.STAFF:
                assenza.delete()
                return True, None
            if assenza.operatore_id == user_id or assenza.utente_id == user_id:
                assenza.delete()
                return True, None

            return False, "You are not authorized to delete this absence"
        except Assenza.DoesNotExist:
            return False, "Absence not found"
        except Exception as e:
            return False, str(e)

    @staticmethod
    def get_assenze_by_operatore(operatore_id, user_role, user_id):
        """
        Restituisce le assenze per un dato operatore se autorizzato.
        STAFF vede tutte; OPERATORE può vedere solo le proprie; altri non autorizzati.
        """
        try:
            if user_role == Ruolo.STAFF:
                return Assenza.objects.filter(operatore_id=operatore_id).order_by('-dataInizio'), None
            if user_role == Ruolo.OPERATORE and int(operatore_id) == int(user_id):
                return Assenza.objects.filter(operatore_id=operatore_id).order_by('-dataInizio'), None

            return None, "You are not authorized to view these absences"
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_attivita_e_documenti_per_utente(utente_id, requesting_user_role=None, requesting_user_id=None):
        """
        Ritorna le attività assegnate, le attività create e i documenti non-FIR
        relativi a un dato utente/operatore.

        Questo helper può essere usato da più endpoint (es. dettaglio utente, retribuzione)
        per avere lo stesso comportamento e controllo dei permessi.

        Returns:
            tuple: (result_dict, None) in caso di successo oppure (None, error_message)
        """
        try:
            # Import dinamico per evitare dipendenze circolari a livello di modulo
            from utente_attivita.models import UtenteAttivita
            from attivita.models import Attivita
            from documento.models import Documento

            # Attività assegnate
            attivita = []
            try:
                ua_qs = UtenteAttivita.objects.filter(utente_id=utente_id).select_related('attivita')
                for ua in ua_qs:
                    at = ua.attivita
                    attivita.append({
                        'id': at.id,
                        'titolo': getattr(at, 'titolo', None),
                        'statoAttivita': getattr(at, 'statoAttivita', None),
                        'data': getattr(at, 'data', None),
                        'luogo': getattr(at, 'luogo', None),
                    })
            except Exception:
                attivita = []

            # Documenti associati all'operatore che NON sono FIR (es. attestati)
            attestati = []
            try:
                doc_qs = Documento.objects.filter(operatore_id=utente_id).exclude(tipoDocumento='FIR').order_by('-dataInserimento')
                for d in doc_qs:
                    # Ensure dataScadenza is a date (no time component) because
                    # the response schema expects a date (pydantic v2 enforces this).
                    ds = getattr(d, 'dataScadenza', None)
                    if ds is not None:
                        try:
                            # If it's a datetime, convert to date; if already a date, keep it
                            if isinstance(ds, datetime):
                                ds = ds.date()
                        except Exception:
                            # Fallback: leave as-is (pydantic will validate and raise if incompatible)
                            pass

                    attestati.append({
                        'id': d.id,
                        'tipoDocumento': getattr(d, 'tipoDocumento', None),
                        'dataInserimento': getattr(d, 'dataInserimento', None),
                        'dataScadenza': ds,
                        'file': getattr(d, 'file', None).name if getattr(d, 'file', None) else None,
                        'operatore_id': getattr(d, 'operatore_id', None),
                    })
            except Exception:
                attestati = []

            return {
                'attivita': attivita,
                'attestati': attestati,
            }, None
        except Exception as e:
            return None, str(e)
