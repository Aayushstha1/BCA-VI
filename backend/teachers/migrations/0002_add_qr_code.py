from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('teachers', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='teacher',
            name='qr_code',
            field=models.ImageField(upload_to='qr_codes/', blank=True, null=True),
        ),
    ]
