# Assicuriamoci che l'admin venga caricato
try:
    from . import admin
except ImportError:
    pass