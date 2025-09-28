from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import Rimorchio

@admin.register(Rimorchio)
class RimorchioAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for the Rimorchio model
    """
    list_display = ('nome', 'tipoRimorchio', 'capacitaDiCarico')
    list_filter = ('tipoRimorchio',)
    search_fields = ('nome',)
    
    fields = ('nome', 'capacitaDiCarico', 'tipoRimorchio')
