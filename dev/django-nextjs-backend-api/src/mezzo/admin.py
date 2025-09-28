from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html

from .models import Mezzo

@admin.register(Mezzo)
class MezzoAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for the Mezzo model
    """
    list_display = ('targa', 'chilometraggio', 'consumoCarburante', 'statoMezzo', 'scadenzaAssicurazione', 'scadenzaRevisione', 'has_image')
    list_filter = ('statoMezzo', 'isDanneggiato')
    search_fields = ('targa',)
    date_hierarchy = 'data_creazione'
    
    fieldsets = (
        (None, {'fields': ('targa',)}),
        (_('Dettagli tecnici'), {'fields': ('chilometraggio', 'consumoCarburante')}),
        (_('Documenti'), {'fields': ('scadenzaAssicurazione', 'scadenzaRevisione')}),
        (_('Stato'), {'fields': ('statoMezzo', 'isDanneggiato')}),
        (_('Immagine'), {'fields': ('immagine', 'image_preview')}),
        (_('Metadata'), {'fields': ('data_creazione', 'data_modifica'), 'classes': ('collapse',)}),
    )
    
    readonly_fields = ('data_creazione', 'data_modifica', 'image_preview')

    def has_image(self, obj):
        """Display if the vehicle has an image"""
        return bool(obj.immagine)
    has_image.boolean = True
    has_image.short_description = _('Ha immagine')

    def image_preview(self, obj):
        """Display image preview in admin"""
        if obj.immagine:
            return format_html(
                '<img src="{}" style="max-width: 200px; max-height: 200px;" />',
                obj.immagine.url
            )
        return _('Nessuna immagine')
    image_preview.short_description = _('Anteprima immagine')
