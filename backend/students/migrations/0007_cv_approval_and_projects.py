# Generated migration for CV approval and project fields

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('students', '0006_cvrating'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='cv',
            name='approval_status',
            field=models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending', max_length=20),
        ),
        migrations.AddField(
            model_name='cv',
            name='approved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='cv',
            name='approved_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='approved_cvs', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='cv',
            name='certifications',
            field=models.TextField(blank=True, help_text='Certifications and achievements'),
        ),
        migrations.AddField(
            model_name='cv',
            name='hobbies',
            field=models.TextField(blank=True, help_text='Hobbies and interests'),
        ),
        migrations.AddField(
            model_name='cv',
            name='languages',
            field=models.TextField(blank=True, help_text='Languages known'),
        ),
        migrations.AddField(
            model_name='cv',
            name='project_file',
            field=models.FileField(blank=True, help_text='Project file/document', null=True, upload_to='cvs/projects/'),
        ),
        migrations.AddField(
            model_name='cv',
            name='projects',
            field=models.TextField(blank=True, help_text='Project descriptions and details'),
        ),
        migrations.AddField(
            model_name='cv',
            name='rejection_reason',
            field=models.TextField(blank=True, help_text='Reason for rejection if rejected'),
        ),
    ]
