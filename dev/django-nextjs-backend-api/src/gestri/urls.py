"""
URL configuration for gestri project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
# Nascondi il modello Group dal pannello admin se presente.
# Lo facciamo qui perché `urls.py` viene importato all'avvio di Django,
# garantendo che la deregistrazione sia eseguita prima che l'admin venga mostrato.
try:
    from django.contrib.auth.models import Group
    admin.site.unregister(Group)
except Exception:
    # Se l'import o la deregistrazione falliscono, ignoriamo l'errore.
    pass
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

# Configure admin site
admin.site.site_header = "GESTRI - Gestionale Rifiuti Industriali"
admin.site.site_title = "GESTRI Admin"
admin.site.index_title = "Pannello di Amministrazione"

from .api import api

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
