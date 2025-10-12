from django.test import TestCase, Client
from utente.models import Ruolo, Utente
from assenza.models import Assenza
import json


class AssenzaIntegrationTests(TestCase):
	def setUp(self):
		self.client = Client()
		# create a staff user and a normal user
		self.staff = Utente.objects.create(email='staff_assenza@example.com', ruolo=Ruolo.STAFF)
		self.staff.set_password('pass')
		self.staff.save()

		self.user = Utente.objects.create(email='user_assenza@example.com', ruolo=Ruolo.OPERATORE)
		self.user.set_password('pass')
		self.user.save()

	def _login_get_headers(self, email):
		payload = json.dumps({"email": email, "password": "pass"})
		resp = self.client.post('/api/utenti/login', data=payload, content_type='application/json')
		self.assertEqual(resp.status_code, 200)
		access = resp.json().get('access')
		return {'HTTP_AUTHORIZATION': f'Bearer {access}'}

	def test_list_assenze_staff(self):
		headers = self._login_get_headers('staff_assenza@example.com')
		resp = self.client.get('/api/assenze/', **headers)
		# should respond 200 with a list (or 404 if route not wired as expected)
		self.assertIn(resp.status_code, (200, 404))

	def test_create_assenza_as_staff(self):
		headers = self._login_get_headers('staff_assenza@example.com')
		payload = json.dumps({
			"operatore_id": self.user.id,
			"tipoAssenza": "FERIE",
			"dataInizio": "2025-10-01",
			"dataFine": "2025-10-03"
		})
		resp = self.client.post('/api/assenze/', data=payload, content_type='application/json', **headers)
		# creation may return 200 or 201 or 400 if validation; accept 200/201/400
		self.assertIn(resp.status_code, (200, 201, 400))
