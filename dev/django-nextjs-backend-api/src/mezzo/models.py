from django.db import models
from django.utils.translation import gettext_lazy as _

class StatoMezzo(models.TextChoices):
    """
    Enum per lo stato del mezzo
    """
    DISPONIBILE = 'DISPONIBILE', _('Disponibile')
    OCCUPATO = 'OCCUPATO', _('Occupato')
    MANUTENZIONE = 'MANUTENZIONE', _('In manutenzione')

class Mezzo(models.Model):
    """
    Model for vehicles (trucks, vans, etc.) used in waste management activities.
    """
    # Identificazione del mezzo
    targa = models.CharField(max_length=20, unique=True, verbose_name=_("Targa"))
    
    # Dettagli tecnici
    chilometraggio = models.PositiveIntegerField(default=0, verbose_name=_("Chilometraggio"))
    consumoCarburante = models.PositiveIntegerField(default=0, verbose_name=_("Consumo carburante"))
    
    # Scadenze
    scadenzaRevisione = models.DateField(null=True, blank=True, verbose_name=_("Scadenza revisione"))
    scadenzaAssicurazione = models.DateField(null=True, blank=True, verbose_name=_("Scadenza assicurazione"))
    
    # Status
    isDanneggiato = models.BooleanField(default=False, verbose_name=_("È danneggiato"))
    statoMezzo = models.CharField(
        max_length=20,
        choices=StatoMezzo.choices,
        default=StatoMezzo.DISPONIBILE,
        verbose_name=_("Stato del mezzo")
    )
    
    # Immagine
    immagine = models.FileField(
        upload_to='mezzi/immagini/',
        null=True,
        blank=True,
        verbose_name=_("Immagine del mezzo"),
        help_text=_("Carica un'immagine del mezzo (formati supportati: JPG, PNG)")
    )
    
    # Metadata
    data_creazione = models.DateTimeField(auto_now_add=True, verbose_name=_("Data creazione"))
    data_modifica = models.DateTimeField(auto_now=True, verbose_name=_("Data modifica"))
    
    class Meta:
        verbose_name = _("Mezzo")
        verbose_name_plural = _("Mezzi")
        ordering = ['targa']
    
    def save(self, *args, **kwargs):
        """
        Override del metodo save per gestire automaticamente isDanneggiato
        quando lo stato è MANUTENZIONE
        """
        # Se lo stato è MANUTENZIONE, imposta automaticamente isDanneggiato a True
        if self.statoMezzo == StatoMezzo.MANUTENZIONE:
            self.isDanneggiato = True
        # Se lo stato non è MANUTENZIONE, puoi decidere se resettarlo o mantenerlo
        # Per ora lo lasciamo inalterato se non è MANUTENZIONE
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.targa} - {self.get_statoMezzo_display()}"
