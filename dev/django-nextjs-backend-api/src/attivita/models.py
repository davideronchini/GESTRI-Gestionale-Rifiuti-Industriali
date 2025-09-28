from django.db import models
from django.utils.translation import gettext_lazy as _

class StatoAttivita(models.TextChoices):
    """
    Enum per lo stato dell'attività
    """
    PROGRAMMATA = 'PROGRAMMATA', _('Programmata')
    INIZIATA = 'INIZIATA', _('Iniziata')
    TERMINATA = 'TERMINATA', _('Terminata')

class Attivita(models.Model):
    """
    Model representing an activity in the waste management system
    """
    # Identificazione
    id = models.AutoField(primary_key=True)
    titolo = models.CharField(max_length=200, verbose_name=_('Titolo'))
    descrizione = models.TextField(blank=True, null=True, verbose_name=_('Descrizione'))
    
    # Stato
    statoAttivita = models.CharField(
        max_length=20,
        choices=StatoAttivita.choices,
        default=StatoAttivita.PROGRAMMATA,
        verbose_name=_('Stato attività')
    )
    
    # Date
    data = models.DateTimeField(
        verbose_name=_('Data Inizio'),
        null=True,
        blank=True
    )
    
    # Location
    luogo = models.CharField(
        max_length=255,
        blank=True, 
        null=True,
        verbose_name=_('Luogo')
    )
    
    # Codice CER
    codiceCer = models.CharField(
        max_length=100,
        blank=True, 
        null=True,
        verbose_name=_('Codice CER')
    )
    
    # Durata stimata dell'attività in ore
    durata = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_('Durata (minuti)')
    )
    
    # Relationships
    utente_creatore = models.ForeignKey(
        'utente.Utente',
        on_delete=models.PROTECT,
        related_name='attivita_create',
        verbose_name=_('Utente creatore')
    )
    mezzo_rimorchio = models.ForeignKey(
        'mezzo_rimorchio.MezzoRimorchio',
        on_delete=models.SET_NULL,
        related_name='attivita',
        null=True,
        blank=True,
        verbose_name=_('Mezzo e Rimorchio')
    )
    documenti = models.ManyToManyField(
        'documento.Documento',
        related_name='attivita',
        blank=True,
        verbose_name=_('Documenti')
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
        verbose_name = _('Attività')
        verbose_name_plural = _('Attività')
        ordering = ['-data']
    
    def __str__(self):
        return f"{self.titolo} ({self.get_statoAttivita_display()})"
