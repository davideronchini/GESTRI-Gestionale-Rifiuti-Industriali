from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import Attivita

@admin.register(Attivita)
class AttivitaAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for the Attivita model
    """
    list_display = ('titolo', 'statoAttivita', 'data', 'durata', 'utente_creatore', 'codiceCer')
    list_filter = ('statoAttivita', 'data', 'durata')
    search_fields = ('titolo', 'descrizione', 'luogo', 'codiceCer')
    date_hierarchy = 'data'
    
    fieldsets = (
        (None, {'fields': ('titolo', 'descrizione', 'statoAttivita')}),
        (_('Data e Luogo'), {'fields': ('data', 'luogo', 'durata')}),
        (_('Codice CER'), {'fields': ('codiceCer',)}),
        (_('Assegnazioni'), {'fields': ('utente_creatore', 'mezzo_rimorchio')}),
        (_('Documenti'), {'fields': ('documenti',)}),
    )
    
    filter_horizontal = ('documenti',)
    readonly_fields = ('data_creazione', 'data_modifica')
