from django.test import TestCase, Client
from utente.models import Ruolo
from utente.models import Utente
from attivita.models import Attivita
from utente_attivita.models import UtenteAttivita
import json


class AttivitaIntegrationTests(TestCase):
    def setUp(self):
        self.client = Client()

        # create users
        self.staff = Utente.objects.create(email='staff@example.com', ruolo=Ruolo.STAFF)
        self.staff.set_password('pass')
        self.staff.save()

        self.operatore = Utente.objects.create(email='op@example.com', ruolo=Ruolo.OPERATORE)
        self.operatore.set_password('pass')
        self.operatore.save()

        self.cliente = Utente.objects.create(email='cliente@example.com', ruolo=Ruolo.CLIENTE)
        self.cliente.set_password('pass')
        self.cliente.save()
        # create activities
        # att_assigned will be assigned to operator (for operatore visibility test)
        self.att_assigned = Attivita.objects.create(titolo='Assigned', descrizione='DescA', utente_creatore=self.staff)
        UtenteAttivita.objects.create(attivita=self.att_assigned, utente=self.operatore)

        # att_unassigned is owned by cliente and initially has no operator (for association test)
        self.att_unassigned = Attivita.objects.create(titolo='ClienteAtt', descrizione='DescC', utente_creatore=self.cliente)

        # att_other is another activity to ensure staff sees everything
        self.att_other = Attivita.objects.create(titolo='Other', descrizione='Desc2', utente_creatore=self.staff)

    def _login_get_headers(self, email, password='pass'):
        payload = json.dumps({"email": email, "password": password})
        resp = self.client.post('/api/utenti/login', data=payload, content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        tokens = resp.json()
        access = tokens.get('access')
        return {'HTTP_AUTHORIZATION': f'Bearer {access}'}

    def _login_get_headers_and_token(self, email, password='pass'):
        """Return both Django test client headers dict and raw access token string."""
        payload = json.dumps({"email": email, "password": password})
        resp = self.client.post('/api/utenti/login', data=payload, content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        tokens = resp.json()
        access = tokens.get('access')
        headers = {'HTTP_AUTHORIZATION': f'Bearer {access}'}
        return headers, access

    def test_staff_list_sees_all(self):
        headers = self._login_get_headers('staff@example.com')
        resp = self.client.get('/api/attivita/', **headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        ids = {a.get('id') for a in data}
        self.assertIn(self.att_assigned.id, ids)
        self.assertIn(self.att_unassigned.id, ids)
        self.assertIn(self.att_other.id, ids)

    def test_operatore_list_sees_assigned(self):
        headers = self._login_get_headers('op@example.com')
        resp = self.client.get('/api/attivita/', **headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        ids = {a.get('id') for a in data}
        self.assertIn(self.att_assigned.id, ids)
        self.assertNotIn(self.att_other.id, ids)

    def test_cliente_create_and_detail(self):
        headers = self._login_get_headers('cliente@example.com')
        payload = json.dumps({
            "titolo": "Nuova",
            "descrizione": "desc",
            "data": None
        })
        resp = self.client.post('/api/attivita/', data=payload, content_type='application/json', **headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('id', data)
        new_id = data.get('id')

        # detail
        resp2 = self.client.get(f'/api/attivita/{new_id}', **headers)
        self.assertEqual(resp2.status_code, 200)
        d2 = resp2.json()
        self.assertEqual(d2.get('id'), new_id)

    def test_cliente_associate_operator(self):
        headers = self._login_get_headers('cliente@example.com')
        payload = json.dumps({"operatore_id": self.operatore.id})
        resp = self.client.post(f'/api/attivita/{self.att_unassigned.id}/associa-operatore', data=payload, content_type='application/json', **headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('success', data)

    def test_cliente_cannot_see_other_cliente_activity(self):
        # create another cliente and activity
        other_cliente = Utente.objects.create(email='other_cliente@example.com', ruolo=Ruolo.CLIENTE)
        other_cliente.set_password('pass')
        other_cliente.save()

        other_att = Attivita.objects.create(titolo='OtherClienteAtt', descrizione='DescX', utente_creatore=other_cliente)

        headers = self._login_get_headers('cliente@example.com')
        resp = self.client.get('/api/attivita/', **headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        ids = {a.get('id') for a in data}
        self.assertNotIn(other_att.id, ids)

    def test_operatore_not_assigned_cannot_get_attivita_documento(self):
        # create a document on att_unassigned (created by cliente) but operator is not assigned
        from documento.models import Documento
        doc = Documento.objects.create(tipoDocumento='FIR', operatore=self.staff)
        self.att_unassigned.documenti.add(doc)
        self.att_unassigned.save()
        headers = self._login_get_headers('op@example.com')
        resp = self.client.get(f'/api/attivita/{self.att_unassigned.id}/documento', **headers)
        # unauthorized access should return 403 with a 'detail' key
        self.assertEqual(resp.status_code, 403)
        self.assertIn('detail', resp.json())

    def test_list_by_date_cliente_and_operatore_filters(self):
        """Verify /api/attivita/by-date/{data} filters by role correctly.

        - cliente sees only activities they created on that date
        - operatore sees only activities they are assigned to on that date
        """
        from datetime import datetime, timedelta

        # Create three activities for the same date
        target_date = datetime.now()
        date_str = target_date.strftime('%Y-%m-%d')

        # activity created by cliente (self.cliente)
        att_cliente = Attivita.objects.create(
            titolo='C1', descrizione='desc', utente_creatore=self.cliente, data=target_date
        )

        # activity created by staff
        att_staff = Attivita.objects.create(
            titolo='S1', descrizione='desc', utente_creatore=self.staff, data=target_date
        )

        # activity created by staff but assigned to operatore
        att_assigned_for_op = Attivita.objects.create(
            titolo='OP1', descrizione='desc', utente_creatore=self.staff, data=target_date
        )
        UtenteAttivita.objects.create(attivita=att_assigned_for_op, utente=self.operatore)

        # Cliente should only see their activity when requesting by date
        headers_cliente = self._login_get_headers('cliente@example.com')
        resp_c = self.client.get(f'/api/attivita/by-date/{date_str}', **headers_cliente)
        self.assertEqual(resp_c.status_code, 200)
        data_c = resp_c.json()
        ids_c = {a.get('id') for a in data_c}
        self.assertIn(att_cliente.id, ids_c)
        self.assertNotIn(att_staff.id, ids_c)
        self.assertNotIn(att_assigned_for_op.id, ids_c)

        # Operatore should only see the activity they are assigned to
        headers_op = self._login_get_headers('op@example.com')
        resp_o = self.client.get(f'/api/attivita/by-date/{date_str}', **headers_op)
        self.assertEqual(resp_o.status_code, 200)
        data_o = resp_o.json()
        ids_o = {a.get('id') for a in data_o}
        self.assertIn(att_assigned_for_op.id, ids_o)
        self.assertNotIn(att_staff.id, ids_o)
        self.assertNotIn(att_cliente.id, ids_o)

    def test_by_date_after_switching_users_no_cached_results(self):
        """Simulate: cliente logs in and requests by-date, then another user logs in and requests by-date.

        This ensures the second user's response is not accidentally the same (cached) as the first user's.
        """
        from datetime import datetime

        # choose a target date and create two activities: one by cliente, one by staff
        target_date = datetime.now()
        date_str = target_date.strftime('%Y-%m-%d')

        att_cliente = Attivita.objects.create(
            titolo='SeqC', descrizione='seq desc C', utente_creatore=self.cliente, data=target_date
        )

        att_staff = Attivita.objects.create(
            titolo='SeqS', descrizione='seq desc S', utente_creatore=self.staff, data=target_date
        )
        # Step 1: cliente logs in and requests by-date
        headers_cliente, token_cliente = self._login_get_headers_and_token('cliente@example.com')
        resp_c = self.client.get(f'/api/attivita/by-date/{date_str}', **headers_cliente)
        self.assertEqual(resp_c.status_code, 200)
        data_c = resp_c.json()
        ids_c = {a.get('id') for a in data_c}

        # cliente should only see their activity
        self.assertIn(att_cliente.id, ids_c)
        self.assertNotIn(att_staff.id, ids_c)

        # Step 2: simulate logout by simply obtaining fresh headers for another user (staff)
        headers_staff, token_staff = self._login_get_headers_and_token('staff@example.com')
        resp_s = self.client.get(f'/api/attivita/by-date/{date_str}', **headers_staff)
        self.assertEqual(resp_s.status_code, 200)
        data_s = resp_s.json()
        ids_s = {a.get('id') for a in data_s}

        # staff should see the staff-created activity (and typically all activities for that date)
        self.assertIn(att_staff.id, ids_s)

        # Ensure the staff view is not identical to the cliente view (no accidental caching)
        self.assertNotEqual(ids_c, ids_s)

        # Assert that the Authorization tokens used for cliente and staff are different
        self.assertIsNotNone(token_cliente)
        self.assertIsNotNone(token_staff)
        self.assertNotEqual(token_cliente, token_staff)

