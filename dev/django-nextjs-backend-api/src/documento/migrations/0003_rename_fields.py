from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('documento', '0002_initial'),  # Assicurati che questa sia l'ultima migrazione
    ]

    operations = [
        # Rinomina i campi mantenendo le relazioni e i dati
        migrations.RenameField(
            model_name='documento',
            old_name='tipo',
            new_name='tipoDocumento',
        ),
        migrations.RenameField(
            model_name='documento',
            old_name='data_caricamento',
            new_name='dataInserimento',
        ),
        migrations.RenameField(
            model_name='documento',
            old_name='data_scadenza',
            new_name='dataScadenza',
        ),
        migrations.RenameField(
            model_name='documento',
            old_name='utente',
            new_name='operatore',
        ),
        # Aggiorna l'ordinamento nella Meta
        migrations.AlterModelOptions(
            name='documento',
            options={'ordering': ['-dataInserimento'], 'verbose_name': 'Documento', 'verbose_name_plural': 'Documenti'},
        ),
    ]