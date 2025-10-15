from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import Rimorchio

@admin.register(Rimorchio)
class RimorchioAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for the Rimorchio model
    """
    # Show the model ID in the admin list for easy reference
    list_display = ('id', 'nome', 'tipoRimorchio', 'capacitaDiCarico')
    list_filter = ('tipoRimorchio',)
    search_fields = ('nome',)
    
    fields = ('nome', 'capacitaDiCarico', 'tipoRimorchio')
