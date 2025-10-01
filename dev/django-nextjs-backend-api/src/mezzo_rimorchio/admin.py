from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import MezzoRimorchio

@admin.register(MezzoRimorchio)
class MezzoRimorchioAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for the MezzoRimorchio model
    """
    list_display = ('id', 'mezzo', 'rimorchio', 'data_associazione', 'data_dissociazione', 'attivo')
    list_filter = ('attivo', 'data_associazione', 'data_dissociazione')
    search_fields = ('id', 'mezzo__targa', 'rimorchio__nome')
    date_hierarchy = 'data_associazione'
    
    fieldsets = (
        (None, {'fields': ('id', 'mezzo', 'rimorchio')}),
        (_('Periodo'), {'fields': ('data_dissociazione',)}),
        (_('Stato'), {'fields': ('attivo',)}),
    )
    
    readonly_fields = ('id', 'data_creazione', 'data_modifica', 'data_associazione')
