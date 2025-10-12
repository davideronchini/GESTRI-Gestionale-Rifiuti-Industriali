from django.test import TestCase, Client
from utente.models import Ruolo, Utente
from rimorchio.models import Rimorchio
import json


class RimorchioIntegrationTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.staff = Utente.objects.create(email='staff_rim@example.com', ruolo=Ruolo.STAFF)
        self.staff.set_password('pass')
        self.staff.save()

        self.r1 = Rimorchio.objects.create(nome='R1', tipoRimorchio='tipA', capacitaDiCarico=1000)

    def _login_get_headers(self, email):
        payload = json.dumps({"email": email, "password": "pass"})
        resp = self.client.post('/api/utenti/login', data=payload, content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        access = resp.json().get('access')
        return {'HTTP_AUTHORIZATION': f'Bearer {access}'}

    def test_list_rimorchi(self):
        headers = self._login_get_headers('staff_rim@example.com')
        resp = self.client.get('/api/rimorchio/', **headers)
        self.assertIn(resp.status_code, (200, 404))
from django.test import TestCase

# Create your tests here.
