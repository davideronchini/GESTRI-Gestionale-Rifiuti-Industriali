from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from .models import Utente

@admin.register(Utente)
class UtenteAdmin(UserAdmin):
    """
    Admin interface configuration for the Utente model
    """
    list_display = ('id', 'email', 'nome', 'cognome', 'ruolo', 'is_staff')
    filter_horizontal = ('user_permissions',)  # Rimuovo 'groups' da qui
    list_filter = ('is_staff', 'is_superuser', 'is_active')  # Rimuovo 'groups' da qui
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Informazioni personali'), {'fields': ('nome', 'cognome', 'dataDiNascita', 'luogoDiNascita', 'residenza')}),
        (_('Informazioni professionali'), {'fields': ('ruolo',)}),
        (_('Permessi'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'user_permissions')}),
        (_('Date importanti'), {'fields': ('last_login', 'date_joined')}),
    )
    search_fields = ('email', 'nome', 'cognome')
    ordering = ('email',)
    
    # Questi campi sono necessari per gestire correttamente l'interfaccia di admin senza username
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
    )
