from django.db import models
from django.utils.translation import gettext_lazy as _

class MezzoRimorchio(models.Model):
    """
    Model representing a relationship between a Mezzo (vehicle) and a Rimorchio (trailer)
    This is a model to represent the association between a vehicle and a trailer
    """
    # Relazioni principali
    mezzo = models.ForeignKey(
        'mezzo.Mezzo', 
        on_delete=models.CASCADE,
        related_name='mezzoRimorchio',
        verbose_name=_('Mezzo')
    )
    rimorchio = models.ForeignKey(
        'rimorchio.Rimorchio', 
        on_delete=models.CASCADE,
        related_name='mezzoRimorchio',
        verbose_name=_('Rimorchio')
    )
    
    # Date dell'associazione
    data_associazione = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Data associazione')
    )
    data_dissociazione = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name=_('Data dissociazione')
    )
    
    # Stato dell'associazione
    attivo = models.BooleanField(
        default=True,
        verbose_name=_('Attivo')
    )
    
    # Metadata
    data_creazione = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Data creazione')
    )
    data_modifica = models.DateTimeField(
        auto_now=True,
        verbose_name=_('Data modifica')
    )
    
    class Meta:
        verbose_name = _('Associazione Mezzo-Rimorchio')
        verbose_name_plural = _('Associazioni Mezzo-Rimorchio')
        ordering = ['-data_associazione']
    
    def __str__(self):
        return f"{self.mezzo} - {self.rimorchio} ({self.data_associazione.strftime('%d/%m/%Y')})"
