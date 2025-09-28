from ninja import NinjaAPI

from ninja_extra import NinjaExtraAPI
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.controller import NinjaJWTDefaultController

import helpers
from utente.schemas import UtenteSchema

#default auth for all endpoints unless specified otherwise
api = NinjaExtraAPI() 

api.register_controllers(NinjaJWTDefaultController)
api.add_router("/waitlists/", "waitlists.api.router")
api.add_router("/utenti/", "utente.api.router")
api.add_router("/documenti/", "documento.api.router")
api.add_router("/assenze/", "assenza.api.router")
api.add_router("/mezzi/", "mezzo.api.router")
api.add_router("/rimorchi/", "rimorchio.api.router")
api.add_router("/mezzo-rimorchi/", "mezzo_rimorchio.api.router")
api.add_router("/attivita/", "attivita.api.router")
api.add_router("/utente-attivita/", "utente_attivita.api.router")

@api.get("/whoami", response=UtenteSchema, auth=helpers.api_auth_any_authenticated)
def me(request):
  request.user.isAutenticato = request.user.is_authenticated
  return request.user