from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings

class TipoDocumento(models.TextChoices):
    """
    Enum per i tipi di documento
    """
    FIR = 'FIR', _('FIR')
    CORSO_SICUREZZA = 'CORSO_SICUREZZA', _('Corso sulla sicurezza')
    CORSO_AGGIORNAMENTO = 'CORSO_AGGIORNAMENTO', _('Corso d\'aggiornamento')
    ALTRO = 'ALTRO', _('Altro')

class Documento(models.Model):
    """
    Modello per gestire i documenti dell'applicazione.
    Collegato a un operatore (Utente) con relazione bidirezionale.
    """
    # Campi base
    id = models.AutoField(primary_key=True)
    # nome = models.CharField(max_length=255, verbose_name=_("Nome documento"))
    
    # Tipo documento come enum - rinominato da 'tipo' a 'tipoDocumento'
    tipoDocumento = models.CharField(
        max_length=30, 
        choices=TipoDocumento.choices, 
        default=TipoDocumento.ALTRO, 
        verbose_name=_("Tipo documento")
    )
    
    # Date - rinominate per consistenza
    dataInserimento = models.DateTimeField(
        auto_now_add=True, 
        verbose_name=_("Data inserimento")
    )
    dataScadenza = models.DateField(
        null=True, 
        blank=True, 
        verbose_name=_("Data scadenza")
    )
    
    # File del documento
    file = models.FileField(
        upload_to='documenti/', 
        verbose_name=_("File"),
        null=True,
        blank=True
    )
    
    # Relazione con operatore (Utente) - rinominata da 'utente' a 'operatore'
    operatore = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='documenti',
        verbose_name=_("Operatore"),
        null=True,
        blank=True
    )
    
    class Meta:
        verbose_name = _("Documento")
        verbose_name_plural = _("Documenti")
        ordering = ['-dataInserimento']
    
    def __str__(self):
        return f"Documento {self.get_tipoDocumento_display()} ({self.operatore})"
