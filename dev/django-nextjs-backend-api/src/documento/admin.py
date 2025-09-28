from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import Documento

@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    """
    Configurazione dell'interfaccia di amministrazione per il modello Documento
    """
    list_display = ('tipoDocumento', 'operatore', 'dataInserimento', 'dataScadenza')
    list_filter = ('tipoDocumento', 'dataInserimento', 'dataScadenza')
    search_fields = ('operatore__email', 'operatore__first_name', 'operatore__last_name')
    date_hierarchy = 'dataInserimento'
    readonly_fields = ('dataInserimento',)
    fieldsets = (
        (None, {'fields': ('tipoDocumento', 'file')}),
        (_('Relazioni'), {'fields': ('operatore',)}),
        (_('Date'), {'fields': ('dataInserimento', 'dataScadenza',)}),
    )
