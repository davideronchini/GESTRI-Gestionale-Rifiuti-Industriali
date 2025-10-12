from django.test import TestCase, Client
from utente.models import Ruolo, Utente
from mezzo.models import Mezzo
from rimorchio.models import Rimorchio
from mezzo_rimorchio.models import MezzoRimorchio
import json


class MezzoRimorchioIntegrationTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.staff = Utente.objects.create(email='staff_mr@example.com', ruolo=Ruolo.STAFF)
        self.staff.set_password('pass')
        self.staff.save()

        self.m = Mezzo.objects.create(targa='CCC333')
        self.r = Rimorchio.objects.create(nome='R2', tipoRimorchio='tipB', capacitaDiCarico=500)

    def _login_get_headers(self, email):
        payload = json.dumps({"email": email, "password": "pass"})
        resp = self.client.post('/api/utenti/login', data=payload, content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        access = resp.json().get('access')
        return {'HTTP_AUTHORIZATION': f'Bearer {access}'}

    def test_create_associazione(self):
        headers = self._login_get_headers('staff_mr@example.com')
        payload = json.dumps({"mezzo_id": self.m.id, "rimorchio_id": self.r.id, "attivo": True})
        # router registers mezzi-rimorchi under /api/mezzi-rimorchi/
        resp = self.client.post('/api/mezzi-rimorchi/', data=payload, content_type='application/json', **headers)
        # Accept 200 or 201 depending on endpoint behavior
        self.assertIn(resp.status_code, (200, 201))
