from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import Assenza

@admin.register(Assenza)
class AssenzaAdmin(admin.ModelAdmin):
    """
    Configurazione dell'interfaccia di amministrazione per il modello Assenza
    """
    list_display = ('id', 'dataInizio', 'dataFine', 'tipoAssenza', 'operatore', 'durata_giorni')
    list_display_links = ('id', 'dataInizio')  # Rende l'ID cliccabile nella lista
    list_filter = ('tipoAssenza', 'dataInizio', 'dataFine')
    search_fields = ('operatore__email', 'operatore__first_name', 'operatore__last_name')
    date_hierarchy = 'dataInizio'
    readonly_fields = ('id', 'durata_giorni')
    
    fieldsets = (
        (_('ID'), {'fields': ('id',), 'classes': ('wide',)}),
        (_('Periodo'), {'fields': ('dataInizio', 'dataFine', 'durata_giorni')}),
        (_('Dettagli'), {'fields': ('tipoAssenza', 'operatore')}),
    )
    
    def durata_giorni(self, obj):
        return obj.durata_giorni
    durata_giorni.short_description = _('Durata (giorni)')
    
    def get_fieldsets(self, request, obj=None):
        """
        Esclude il campo ID quando si sta creando un nuovo oggetto
        ma lo mostra quando si sta modificando un oggetto esistente
        """
        fieldsets = super().get_fieldsets(request, obj)
        if obj is None:  # Durante la creazione di un nuovo oggetto
            # Rimuove il primo fieldset che contiene il campo 'id'
            return fieldsets[1:]
        return fieldsets
    
    def has_change_permission(self, request, obj=None):
        """Assicura che il permesso di modifica sia concesso"""
        return True
    
    def get_readonly_fields(self, request, obj=None):
        """
        Imposta i campi di sola lettura in base a se stiamo creando o modificando
        """
        if obj:  # quando si modifica un record esistente
            return self.readonly_fields
        return ('durata_giorni',)  # solo durata_giorni è in sola lettura quando si crea un nuovo record
