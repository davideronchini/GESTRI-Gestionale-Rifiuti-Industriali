from django.test import TestCase, Client
from utente.models import Ruolo, Utente
from documento.models import Documento
from attivita.models import Attivita
import json


class DocumentoIntegrationTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.staff = Utente.objects.create(email='staff_doc@example.com', ruolo=Ruolo.STAFF)
        self.staff.set_password('pass')
        self.staff.save()

        self.operatore = Utente.objects.create(email='op_doc@example.com', ruolo=Ruolo.OPERATORE)
        self.operatore.set_password('pass')
        self.operatore.save()

        self.att = Attivita.objects.create(titolo='A1', descrizione='desc', utente_creatore=self.staff)

    def _login_get_headers(self, email):
        payload = json.dumps({"email": email, "password": "pass"})
        resp = self.client.post('/api/utenti/login', data=payload, content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        access = resp.json().get('access')
        return {'HTTP_AUTHORIZATION': f'Bearer {access}'}

    def test_create_documento_json(self):
        headers = self._login_get_headers('op_doc@example.com')
        payload = json.dumps({"tipoDocumento": "FIR", "attivita_id": self.att.id})
        resp = self.client.post('/api/documenti/', data=payload, content_type='application/json', **headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('id', data)

    def test_operatore_not_assigned_cannot_see_document(self):
        # create a document associated to self.att created by staff
        doc = Documento.objects.create(tipoDocumento='FIR', operatore=self.staff)
        self.att.documenti.add(doc)
        self.att.save()

        # login as the operator that is NOT assigned to the activity
        headers = self._login_get_headers('op_doc@example.com')

        # listing should NOT include the document
        resp = self.client.get('/api/documenti/', **headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        ids = {d.get('id') for d in data}
        self.assertNotIn(doc.id, ids)

        # direct access should return an error payload
        resp2 = self.client.get(f'/api/documenti/{doc.id}', **headers)
        self.assertEqual(resp2.status_code, 403)
        self.assertIn('detail', resp2.json())
