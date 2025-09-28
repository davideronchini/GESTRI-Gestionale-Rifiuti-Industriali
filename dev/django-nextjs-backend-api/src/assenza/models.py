from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings

# Create your models here.
class Assenza(models.Model):
    """
    Modello per gestire le assenze degli utenti.
    """
    class TipoAssenza(models.TextChoices):
        MALATTIA = 'MALATTIA', _('Malattia')
        FERIE = 'FERIE', _('Ferie')
        PERMESSO = 'PERMESSO', _('Permesso')
        ASPETTATIVA = 'ASPETTATIVA', _('Aspettativa')
        MATERNITA = 'MATERNITA', _('Maternità')

    # Relazione con l'utente - manteniamo temporaneamente entrambi i campi
    utente = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='assenze_vecchie',
        verbose_name=_("Utente"),
        null=True,
        blank=True
    )
    
    operatore = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='assenze',
        verbose_name=_("Operatore"),
        null=True,
        blank=True
    )
    
    # Periodo di assenza - manteniamo temporaneamente entrambi i campi
    data_inizio = models.DateField(verbose_name=_("Data inizio"), null=True, blank=True)
    data_fine = models.DateField(verbose_name=_("Data fine"), null=True, blank=True)
    
    dataInizio = models.DateField(verbose_name=_("Data inizio"), null=True, blank=True)
    dataFine = models.DateField(verbose_name=_("Data fine"), null=True, blank=True)
    
    # Tipo di assenza - manteniamo temporaneamente entrambi i campi
    tipo = models.CharField(
        max_length=20, 
        verbose_name=_("Tipo assenza"), 
        null=True, 
        blank=True
    )
    
    tipoAssenza = models.CharField(
        max_length=20, 
        choices=TipoAssenza.choices, 
        verbose_name=_("Tipo assenza"),
        null=True,
        blank=True
    )
    
    # Campi che verranno rimossi, ma li manteniamo temporaneamente
    descrizione = models.TextField(null=True, blank=True, verbose_name=_("Descrizione"))
    approvata = models.BooleanField(default=False, verbose_name=_("Approvata"), null=True, blank=True)
    approvata_da = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='assenze_approvate',
        verbose_name=_("Approvata da")
    )
    data_approvazione = models.DateTimeField(null=True, blank=True, verbose_name=_("Data approvazione"))
    data_creazione = models.DateTimeField(auto_now_add=True, verbose_name=_("Data creazione"), null=True, blank=True)
    data_modifica = models.DateTimeField(auto_now=True, verbose_name=_("Data modifica"), null=True, blank=True)
    
    class Meta:
        verbose_name = _("Assenza")
        verbose_name_plural = _("Assenze")
        ordering = ['-dataInizio']
    
    def __str__(self):
        operatore_display = self.operatore if self.operatore else self.utente
        tipo_display = self.get_tipoAssenza_display() if self.tipoAssenza else self.tipo
        data_inizio = self.dataInizio if self.dataInizio else self.data_inizio
        data_fine = self.dataFine if self.dataFine else self.data_fine
        return f"{operatore_display} - {tipo_display} ({data_inizio} - {data_fine})"
    
    @property
    def durata_giorni(self):
        """Calcola la durata dell'assenza in giorni."""
        data_inizio = self.dataInizio if self.dataInizio else self.data_inizio
        data_fine = self.dataFine if self.dataFine else self.data_fine
        
        if data_inizio and data_fine:
            return (data_fine - data_inizio).days + 1
        return 0
