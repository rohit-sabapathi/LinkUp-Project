from django.db import models
from django.conf import settings

# Create your models here.

class UserPreference(models.Model):
    THEME_CHOICES = (
        ('light', 'Light'),
        ('dark', 'Dark')
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='preferences'
    )
    theme = models.CharField(
        max_length=10,
        choices=THEME_CHOICES,
        default='dark'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name()}'s preferences"
