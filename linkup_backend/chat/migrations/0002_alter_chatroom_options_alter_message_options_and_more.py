# Generated by Django 5.0.1 on 2025-01-08 14:53

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='chatroom',
            options={'ordering': ['-updated_at']},
        ),
        migrations.AlterModelOptions(
            name='message',
            options={'ordering': ['-created_at']},
        ),
        migrations.AddField(
            model_name='message',
            name='file_data',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='message',
            name='file_name',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='message',
            name='file_type',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AlterField(
            model_name='message',
            name='content',
            field=models.TextField(blank=True),
        ),
    ]
