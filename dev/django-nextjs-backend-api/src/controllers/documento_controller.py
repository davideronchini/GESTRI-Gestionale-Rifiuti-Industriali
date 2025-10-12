"""
Controller for document management.
This module contains the business logic for operations on documents.
"""
from documento.models import Documento
from django.db.models import Q
from utente.models import Ruolo
from django.http import Http404
from django.core.exceptions import PermissionDenied


class DocumentoController:
    """
    Controller for document management.
    """
    
    # ------ METHODS FOR DOCUMENTO API ------
    
    @staticmethod
    def _serialize_documento(documento: Documento) -> dict:
        """Serializes a Documento instance to a plain dict used by the API responses."""
        return {
            'id': documento.id,
            'tipoDocumento': documento.tipoDocumento,
            'dataInserimento': documento.dataInserimento,
            'dataScadenza': documento.dataScadenza,
            'file': documento.file.name if documento.file and getattr(documento.file, 'name', None) else None,
            'file_url': documento.file.url if getattr(documento, 'file', None) and getattr(documento.file, 'url', None) else None,
            'operatore_id': documento.operatore.id if documento.operatore else None,
            'operatore_nome': f"{documento.operatore.first_name} {documento.operatore.last_name}" if documento.operatore else None,
            'operatore_email': documento.operatore.email if documento.operatore else None,
        }

    @staticmethod
    def _is_user_authorized_for_document(request, documento: Documento) -> bool:
        """Checks whether the requesting user is authorized to access the given document.

        Rules:
        - STAFF: always authorized
        - OPERATORE: authorized if operator is assigned to any activity linked to the document OR documento.operatore == user
        - CLIENTE: authorized if cliente is creator of any activity linked to the document
        """
        try:
            user = getattr(request, 'user', None)
            if not user or not getattr(user, 'is_authenticated', False):
                return False
            if user.ruolo == Ruolo.STAFF:
                return True
            if user.ruolo == Ruolo.OPERATORE:
                # assigned to a related activity OR owner
                if documento.attivita.filter(utente_attivita__utente_id=user.id).exists():
                    return True
                if documento.operatore and documento.operatore.id == user.id:
                    return True
                return False
            if user.ruolo == Ruolo.CLIENTE:
                # creator of any related activity
                if documento.attivita.filter(utente_creatore_id=user.id).exists():
                    return True
                return False
            return False
        except Exception:
            return False

    @staticmethod
    def list_documenti(request):
        """Return serialized list of all documents visible to the requesting user.

        Visibility rules:
        - STAFF: all documents
        - OPERATORE: documents associated with activities where the operator is assigned OR documents whose operatore is the operator
        - CLIENTE: documents associated with activities where the cliente is the creator
        """
        try:
            user = getattr(request, 'user', None)
            if not user or not getattr(user, 'is_authenticated', False):
                # unauthenticated users see nothing
                return []

            if user.ruolo == Ruolo.STAFF:
                qs = Documento.objects.select_related('operatore').all()
            elif user.ruolo == Ruolo.OPERATORE:
                # documents linked to activities where operator is assigned OR documents assigned to the operator
                qs = Documento.objects.select_related('operatore').filter(
                    Q(attivita__utente_attivita__utente_id=user.id) | Q(operatore_id=user.id)
                ).distinct()
            else:  # CLIENTE
                qs = Documento.objects.select_related('operatore').filter(
                    attivita__utente_creatore_id=user.id
                ).distinct()

            return [DocumentoController._serialize_documento(d) for d in qs]
        except Exception as e:
            print(f"Errore in DocumentoController.list_documenti: {e}")
            return []

    @staticmethod
    def create_documento(request):
        """Create a Documento using a Django HttpRequest object. Returns a dict or raises exceptions."""
        # Reuse the same parsing/validation logic as the API implementation
        from django.utils.dateparse import parse_datetime, parse_date
        try:
            files = request.FILES
            post_data = request.POST

            body_json = None
            try:
                if request.content_type and 'application/json' in request.content_type:
                    import json as _json
                    body_text = request.body.decode('utf-8') if request.body else ''
                    if body_text:
                        body_json = _json.loads(body_text)
            except Exception:
                body_json = None

            uploaded_file = files['file'] if 'file' in files else None

            tipo_documento = None
            attivita_id = None
            if post_data and post_data.get('tipoDocumento'):
                tipo_documento = post_data.get('tipoDocumento')
                attivita_id = post_data.get('attivita_id')
            elif body_json:
                tipo_documento = body_json.get('tipoDocumento') if isinstance(body_json, dict) else None
                attivita_id = body_json.get('attivita_id') if isinstance(body_json, dict) else None

            if not tipo_documento:
                raise ValueError("tipoDocumento is required")

            from documento.models import TipoDocumento
            valid_types = [choice[0] for choice in TipoDocumento.choices]
            if tipo_documento not in valid_types:
                raise ValueError(f"Invalid tipoDocumento '{tipo_documento}'. Valid choices are: {valid_types}")

            documento = Documento(
                tipoDocumento=tipo_documento,
                file=uploaded_file if uploaded_file else None,
                operatore=request.user
            )

            # parse dataScadenza if provided
            data_scadenza_val = None
            try:
                if post_data and post_data.get('dataScadenza'):
                    data_scadenza_val = post_data.get('dataScadenza')
                elif body_json and isinstance(body_json, dict) and body_json.get('dataScadenza'):
                    data_scadenza_val = body_json.get('dataScadenza')

                if data_scadenza_val:
                    dt = None
                    try:
                        dt = parse_datetime(data_scadenza_val)
                    except Exception:
                        dt = None
                    if not dt:
                        try:
                            d = parse_date(data_scadenza_val)
                            if d:
                                from datetime import datetime
                                dt = datetime.combine(d, datetime.min.time())
                        except Exception:
                            dt = None
                    if dt:
                        documento.dataScadenza = dt
            except Exception:
                pass

            documento.save()

            if attivita_id:
                from attivita.models import Attivita
                try:
                    att = Attivita.objects.get(id=attivita_id)
                    att.documenti.add(documento)
                    att.save()
                except Attivita.DoesNotExist:
                    raise Http404(f"Activity with id {attivita_id} not found")

            return DocumentoController._serialize_documento(documento)
        except Exception as e:
            # Let the API layer or framework handle unexpected exceptions - raise to preserve trace
            raise

    @staticmethod
    def get_documento(request, documento_id):
        try:
            documento = Documento.objects.select_related('operatore').get(id=documento_id)

            user = getattr(request, 'user', None)
            if not user or not getattr(user, 'is_authenticated', False):
                raise PermissionDenied("Not authorized to view this document")

            # STAFF can view any document
            if user.ruolo == Ruolo.STAFF:
                return DocumentoController._serialize_documento(documento)

            # OPERATORE: allowed if operator assigned to one of the related activities OR is documento.operatore
            if user.ruolo == Ruolo.OPERATORE:
                is_assigned = documento.attivita.filter(utente_attivita__utente_id=user.id).exists()
                if is_assigned or (documento.operatore and documento.operatore.id == user.id):
                    return DocumentoController._serialize_documento(documento)
                raise PermissionDenied("Not authorized to view this document")

            # CLIENTE: allowed only if they created one of the related activities
            if user.ruolo == Ruolo.CLIENTE:
                is_creator = documento.attivita.filter(utente_creatore_id=user.id).exists()
                if is_creator:
                    return DocumentoController._serialize_documento(documento)
                raise PermissionDenied("Not authorized to view this document")

            return PermissionDenied("Not authorized to view this document")
        except Documento.DoesNotExist:
            raise Http404("Documento not found")
        except Exception as e:
            raise

    @staticmethod
    def delete_documento(request, documento_id: int):
        try:
            documento = Documento.objects.get(id=documento_id)
            requesting_user = request.user
            allow = False
            try:
                if getattr(requesting_user, 'is_staff', False) or getattr(requesting_user, 'is_superuser', False):
                    allow = True
            except Exception:
                pass

            try:
                if documento.operatore and requesting_user and documento.operatore.id == getattr(requesting_user, 'id', None):
                    allow = True
            except Exception:
                pass

            if not allow:
                raise PermissionDenied("Not authorized to delete this document")

            # remove file from storage if exists
            try:
                if documento.file and getattr(documento.file, 'path', None):
                    import os
                    if os.path.exists(documento.file.path):
                        os.remove(documento.file.path)
            except Exception:
                pass

            documento.delete()
            return {"success": True, "message": "Documento eliminato con successo", "id": documento_id}
        except Documento.DoesNotExist:
            raise Http404("Documento not found")
        except Exception as e:
            raise

    @staticmethod
    def update_documento(request, documento_id: int, file=None, tipoDocumento=None):
        try:
            documento = Documento.objects.get(id=documento_id)

            # parse incoming data similar to API
            incoming_data = {}
            try:
                if request.content_type and 'application/json' in request.content_type:
                    import json as _json
                    body = request.body.decode('utf-8') if request.body else ''
                    if body:
                        incoming_data = _json.loads(body)
                else:
                    incoming_data = {k: v for k, v in request.POST.items()}
            except Exception:
                incoming_data = {}

            # dataInserimento
            if incoming_data.get('dataInserimento'):
                try:
                    from datetime import datetime
                    val = incoming_data.get('dataInserimento')
                    if isinstance(val, datetime):
                        documento.dataInserimento = val
                    elif isinstance(val, str):
                        try:
                            documento.dataInserimento = datetime.fromisoformat(val)
                        except Exception:
                            from django.utils.dateparse import parse_datetime
                            dt = parse_datetime(val)
                            if dt:
                                documento.dataInserimento = dt
                except Exception:
                    pass

            # dataScadenza
            if incoming_data.get('dataScadenza'):
                try:
                    from datetime import date, datetime
                    val = incoming_data.get('dataScadenza')
                    if isinstance(val, date) and not isinstance(val, datetime):
                        documento.dataScadenza = val
                    elif isinstance(val, datetime):
                        documento.dataScadenza = val
                    elif isinstance(val, str):
                        try:
                            documento.dataScadenza = date.fromisoformat(val)
                        except Exception:
                            try:
                                documento.dataScadenza = datetime.fromisoformat(val)
                            except Exception:
                                from django.utils.dateparse import parse_datetime
                                dt = parse_datetime(val)
                                if dt:
                                    documento.dataScadenza = dt
                except Exception:
                    pass

            # handle new file
            if file:
                if documento.file and getattr(documento.file, 'path', None):
                    import os
                    if os.path.exists(documento.file.path):
                        os.remove(documento.file.path)
                documento.file = file

            # tipoDocumento
            if not tipoDocumento and isinstance(incoming_data, dict) and incoming_data.get('tipoDocumento'):
                tipoDocumento = incoming_data.get('tipoDocumento')

            if tipoDocumento:
                from documento.models import TipoDocumento
                valid_types = [choice[0] for choice in TipoDocumento.choices]
                if tipoDocumento not in valid_types:
                    return {"error": f"Invalid tipoDocumento '{tipoDocumento}'. Valid choices are: {valid_types}"}
                documento.tipoDocumento = tipoDocumento

            # operatore_id or operatore_email
            op_id = None
            if isinstance(incoming_data, dict) and incoming_data.get('operatore_id') is not None:
                op_id = incoming_data.get('operatore_id')

            operatore_email_from_body = None
            if isinstance(incoming_data, dict) and 'operatore_email' in incoming_data:
                operatore_email_from_body = incoming_data.get('operatore_email')

            if op_id is not None:
                from utente.models import Utente, Ruolo
                try:
                    if str(op_id).strip() == '' or op_id is None:
                        documento.operatore = None
                    else:
                        try:
                            uid = int(op_id)
                            oper = Utente.objects.get(id=uid)
                            if oper.ruolo == Ruolo.OPERATORE:
                                documento.operatore = oper
                        except Exception:
                            pass
                except Exception:
                    pass
            elif operatore_email_from_body is not None:
                from utente.models import Utente, Ruolo
                try:
                    email_val = operatore_email_from_body
                    if email_val is None or (isinstance(email_val, str) and email_val.strip() == ''):
                        documento.operatore = None
                    else:
                        try:
                            oper = Utente.objects.get(email=str(email_val))
                            if oper.ruolo == Ruolo.OPERATORE:
                                documento.operatore = oper
                        except Utente.DoesNotExist:
                            pass
                except Exception:
                    pass

            documento.save()
            documento.refresh_from_db()
            return DocumentoController._serialize_documento(documento)
        except Documento.DoesNotExist:
            raise Http404("Documento not found")
        except Exception as e:
            raise

    @staticmethod
    def cerca_documenti(request, term: str):
        try:
            # reuse list_documenti to get the visible set, then filter by term
            visible = DocumentoController.list_documenti(request)
            if not term or term.strip() == '':
                return visible
            term_lower = term.strip().lower()
            results = []
            for d in visible:
                try:
                    if d.get('tipoDocumento') and term_lower in str(d['tipoDocumento']).lower():
                        results.append(d)
                except Exception:
                    pass
            return results
        except Exception:
            return []

    @staticmethod
    def filter_documenti(request, value: str, filters: list):
        try:
            visible = DocumentoController.list_documenti(request)
            if not filters or not value or value.strip() == '':
                return visible
            value_lower = value.strip().lower()
            results = []
            for d in visible:
                matched = False
                for field in filters:
                    f = field.lower()
                    if f in ("id",):
                        try:
                            id_str = str(d.get('id', '')).lower()
                            if value_lower == id_str or value_lower in id_str:
                                matched = True
                                break
                        except Exception:
                            pass
                    elif f in ("tipo", "tipodocumento", "tipoDocumento"):
                        if d.get('tipoDocumento'):
                            if value_lower in str(d['tipoDocumento']).lower():
                                matched = True
                                break
                    elif f in ("operatori", "operatore"):
                        if d.get('operatore_nome'):
                            if value_lower in d['operatore_nome'].lower():
                                matched = True
                                break
                    elif f in ("scadenza", "datascadenza", "dataScadenza"):
                        if d.get('dataScadenza'):
                            try:
                                from datetime import date
                                scad = d['dataScadenza']
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
                    results.append(d)
            return results
        except Exception:
            return []