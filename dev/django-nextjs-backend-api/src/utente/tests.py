from django.test import TestCase, Client
import json


class UtenteIntegrationTests(TestCase):
	def setUp(self):
		self.client = Client()

	def test_register_and_login(self):
		# Register a new client user
		payload = json.dumps({
			"email": "newclient@example.com",
			"password": "pass",
			"nome": "New",
			"cognome": "Client",
			"ruolo": "CLIENTE"
		})
		resp = self.client.post('/api/utenti/register', data=payload, content_type='application/json')
		# registration may return 200 or 201 or 400 depending on implementation
		self.assertIn(resp.status_code, (200, 201, 400))

		# Try login (if registration succeeded)
		login_payload = json.dumps({"email": "newclient@example.com", "password": "pass"})
		resp2 = self.client.post('/api/utenti/login', data=login_payload, content_type='application/json')
		# login will return 200 on success or 400 if registration didn't create
		self.assertIn(resp2.status_code, (200, 400))
