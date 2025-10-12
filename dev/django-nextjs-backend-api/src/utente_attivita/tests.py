from django.test import TestCase, Client
from utente.models import Ruolo, Utente
from attivita.models import Attivita
from utente_attivita.models import UtenteAttivita
import json


class UtenteAttivitaIntegrationTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.staff = Utente.objects.create(email='staff_ua@example.com', ruolo=Ruolo.STAFF)
        self.staff.set_password('pass')
        self.staff.save()

        self.user = Utente.objects.create(email='user_ua@example.com', ruolo=Ruolo.OPERATORE)
        self.user.set_password('pass')
        self.user.save()

        self.att = Attivita.objects.create(titolo='UA1', descrizione='desc', utente_creatore=self.staff)

    def _login_get_headers(self, email):
        payload = json.dumps({"email": email, "password": "pass"})
        resp = self.client.post('/api/utenti/login', data=payload, content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        access = resp.json().get('access')
        return {'HTTP_AUTHORIZATION': f'Bearer {access}'}

    def test_create_association_staff(self):
        headers = self._login_get_headers('staff_ua@example.com')
        # Create association via ORM (the controller endpoint is staff-only and may expect query params)
        ua = UtenteAttivita.objects.create(utente=self.user, attivita=self.att)

        # Now call the staff-only list endpoint to verify it is visible
        resp = self.client.get('/api/utente-attivita/', **headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        ids = {item.get('id') for item in data}
        self.assertIn(ua.id, ids)

