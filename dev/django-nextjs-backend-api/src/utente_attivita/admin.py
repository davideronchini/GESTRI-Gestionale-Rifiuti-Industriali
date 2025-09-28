from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import UtenteAttivita

@admin.register(UtenteAttivita)
class UtenteAttivitaAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for the UtenteAttivita model
    """
    list_display = ('id', 'utente', 'attivita', 'data_assegnazione')
    list_filter = ('data_assegnazione',)
    search_fields = ('id', 'utente__email', 'utente__nome', 'utente__cognome', 'attivita__titolo')
    date_hierarchy = 'data_assegnazione'
    
    fieldsets = (
        (None, {'fields': ('id', 'utente', 'attivita')}),
    )
    readonly_fields = ('id', 'data_assegnazione',)
    raw_id_fields = ('utente', 'attivita')
