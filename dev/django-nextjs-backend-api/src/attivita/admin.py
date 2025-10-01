from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import Attivita
from utente_attivita.models import UtenteAttivita

class UtenteAttivitaInline(admin.TabularInline):
    """
    Inline per gestire l'assegnazione degli operatori all'attività
    """
    model = UtenteAttivita
    extra = 1
    verbose_name = _('Operatore assegnato')
    verbose_name_plural = _('Operatori assegnati')
    
    fields = ('utente', 'data_assegnazione')
    readonly_fields = ('data_assegnazione',)
    
    def get_queryset(self, request):
        # Filtra solo utenti con ruolo OPERATORE o STAFF per l'assegnazione
        return super().get_queryset(request).select_related('utente')

@admin.register(Attivita)
class AttivitaAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for the Attivita model
    """
    list_display = ('id', 'titolo', 'statoAttivita', 'data', 'get_mezzo_info', 'get_operatori_count', 'utente_creatore')
    list_filter = ('statoAttivita', 'data', 'durata')
    search_fields = ('titolo', 'descrizione', 'luogo', 'codiceCer')
    date_hierarchy = 'data'
    
    inlines = [UtenteAttivitaInline]
    
    fieldsets = (
        (None, {'fields': ('titolo', 'descrizione', 'statoAttivita')}),
        (_('Data e Luogo'), {'fields': ('data', 'luogo', 'durata')}),
        (_('Codice CER'), {'fields': ('codiceCer',)}),
        (_('Assegnazioni'), {'fields': ('utente_creatore', 'mezzo_rimorchio')}),
        (_('Documenti'), {'fields': ('documenti',)}),
    )
    
    filter_horizontal = ('documenti',)
    readonly_fields = ('data_creazione', 'data_modifica')
    
    def get_queryset(self, request):
        # Ottimizza le query per l'admin
        return super().get_queryset(request).select_related(
            'utente_creatore', 
            'mezzo_rimorchio', 
            'mezzo_rimorchio__mezzo', 
            'mezzo_rimorchio__rimorchio'
        ).prefetch_related('utente_attivita__utente')
    
    def get_mezzo_info(self, obj):
        """Mostra informazioni del mezzo nella lista"""
        if obj.mezzo_rimorchio:
            return f"{obj.mezzo_rimorchio.mezzo.targa} + {obj.mezzo_rimorchio.rimorchio.nome}"
        return "Nessun mezzo"
    get_mezzo_info.short_description = _('Mezzo associato')
    
    def get_operatori_count(self, obj):
        """Mostra il numero di operatori assegnati"""
        return obj.utente_attivita.count()
    get_operatori_count.short_description = _('N° Operatori')
