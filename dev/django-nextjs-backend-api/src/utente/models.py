from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _

class Ruolo(models.TextChoices):
    """
    Enum per i ruoli degli utenti
    """
    STAFF = 'STAFF', _('Staff')
    OPERATORE = 'OPERATORE', _('Operatore')
    CLIENTE = 'CLIENTE', _('Cliente')

class UtenteManager(BaseUserManager):
    """
    Custom manager per il modello Utente che usa l'email come identificatore principale
    invece dell'username.
    """
    def create_user(self, email, password=None, **extra_fields):
        """
        Crea e salva un utente con l'email e la password specificati.
        """
        if not email:
            raise ValueError('Gli utenti devono avere un indirizzo email')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """
        Crea e salva un superuser con l'email e la password specificati.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('ruolo', Ruolo.STAFF)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Il superuser deve avere is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Il superuser deve avere is_superuser=True')
        
        return self.create_user(email, password, **extra_fields)

# Create your models here.
class Utente(AbstractUser):
    """
    Extension of Django's User model.
    Uses email as the primary identifier instead of username.
    """
    # Remove the username field and make email the primary field
    username = None
    email = models.EmailField(unique=True, verbose_name=_("Email"))
    
    # Personal information
    nome = models.CharField(max_length=30, verbose_name=_("Nome"), null=True, blank=True)
    cognome = models.CharField(max_length=30, verbose_name=_("Cognome"), null=True, blank=True)
    dataDiNascita = models.DateField(null=True, blank=True, verbose_name=_("Data di nascita"))
    luogoDiNascita = models.CharField(max_length=100, null=True, blank=True, verbose_name=_("Luogo di nascita"))
    residenza = models.CharField(max_length=255, null=True, blank=True, verbose_name=_("Residenza"))
    
    # Role information
    ruolo = models.CharField(
        max_length=20,
        choices=Ruolo.choices,
        default=Ruolo.CLIENTE,
        verbose_name=_("Ruolo")
    )
    
    # Set email as the primary field for authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # Email e password sono già richiesti
    
    # Use the custom manager
    objects = UtenteManager()
    
    # Relationships:
    # - assenze: reverse relation from Assenza model
    # - attestati: reverse relation from Documento model
    # - attivita_assegnate: reverse relation from UtenteAttivita model
    # - attivita_create: reverse relation from Attivita model
    
    class Meta:
        verbose_name = _("Utente")
        verbose_name_plural = _("Utenti")
    
    def __str__(self):
        return f"{self.nome} {self.cognome} ({self.email})"
    
    def save(self, *args, **kwargs):
        """
        Override the save method to ensure alignment between nome/cognome and 
        first_name/last_name which are inherited from AbstractUser.
        This maintains compatibility with Django's built-in user model.
        """
        # Sincronizzazione bidirezionale tra nome/first_name e cognome/last_name
        if self.nome is not None:
            self.first_name = self.nome
        elif self.first_name and not self.nome:
            self.nome = self.first_name
            
        if self.cognome is not None:
            self.last_name = self.cognome
        elif self.last_name and not self.cognome:
            self.cognome = self.last_name
            
        super().save(*args, **kwargs)
