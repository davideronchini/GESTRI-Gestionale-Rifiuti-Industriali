from django.db import models
from django.utils.translation import gettext_lazy as _

class UtenteAttivita(models.Model):
    """
    Modello che rappresenta l'associazione tra Utente e Attività
    """
    utente = models.ForeignKey(
        'utente.Utente',
        on_delete=models.CASCADE,
        related_name='utente_attivita',
        verbose_name=_('Utente')
    )
    attivita = models.ForeignKey(
        'attivita.Attivita',
        on_delete=models.CASCADE,
        related_name='utente_attivita',
        verbose_name=_('Attività')
    )
    data_assegnazione = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Data assegnazione')
    )
    
    class Meta:
        verbose_name = _('Associazione Utente-Attività')
        verbose_name_plural = _('Associazioni Utente-Attività')
        unique_together = ['utente', 'attivita']
        
    def __str__(self):
        return f"{self.utente} - {self.attivita}"
