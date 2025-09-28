from django.db import models
from django.utils.translation import gettext_lazy as _

class TipoRimorchio(models.TextChoices):
    """
    Enum per i tipi di rimorchio
    """
    RIBALTABILE = 'RIBALTABILE', _('Ribaltabile')
    COMPATTANTE = 'COMPATTANTE', _('Compattante')
    CISTERNA = 'CISTERNA', _('Cisterna')
    PIANALE = 'PIANALE', _('Pianale')
    CASSONE = 'CASSONE', _('Cassone')
    SCARRABILE = 'SCARRABILE', _('Scarrabile')
    ALTRO = 'ALTRO', _('Altro')

class Rimorchio(models.Model):
    """
    Model for trailers that can be attached to vehicles (Mezzo).
    """
    id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100, verbose_name=_("Nome"), default="Rimorchio")
    capacitaDiCarico = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        verbose_name=_("Capacità di Carico"),
        default=0.00
    )
    tipoRimorchio = models.CharField(
        max_length=20,
        choices=TipoRimorchio.choices,
        verbose_name=_("Tipo Rimorchio"),
        default=TipoRimorchio.ALTRO
    )
    
    class Meta:
        verbose_name = _("Rimorchio")
        verbose_name_plural = _("Rimorchi")
        ordering = ['nome']
    
    def __str__(self):
        return f"{self.nome} ({self.tipoRimorchio})"
