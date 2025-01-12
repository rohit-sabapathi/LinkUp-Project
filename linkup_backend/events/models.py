from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator

# Create your models here.

class Event(models.Model):
    EVENT_TYPE_CHOICES = [
        ('webinar', 'Webinar'),
        ('workshop', 'Workshop'),
        ('conference', 'Conference'),
        ('networking', 'Networking Event'),
        ('reunion', 'Alumni Reunion'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES, default='other')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    location = models.CharField(max_length=200, help_text="Physical location or virtual meeting link", default='TBD')
    is_virtual = models.BooleanField(default=False)
    max_participants = models.PositiveIntegerField(null=True, blank=True, help_text="Maximum number of participants allowed (leave empty for unlimited)")
    registration_deadline = models.DateTimeField(null=True, blank=True)
    organizer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='organized_events')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    image = models.ImageField(upload_to='event_images/', null=True, blank=True)
    
    # Additional fields for virtual events
    meeting_link = models.URLField(blank=True, null=True, help_text="Virtual meeting link (for virtual events)")
    meeting_id = models.CharField(max_length=100, blank=True, null=True, help_text="Meeting ID (for virtual events)")
    meeting_password = models.CharField(max_length=100, blank=True, null=True, help_text="Meeting password (for virtual events)")

    class Meta:
        ordering = ['start_date']

    def __str__(self):
        return self.title

    @property
    def is_past(self):
        from django.utils import timezone
        return self.end_date < timezone.now()

    @property
    def is_full(self):
        if self.max_participants is None:
            return False
        return self.registrations.count() >= self.max_participants

class EventRegistration(models.Model):
    STATUS_CHOICES = [
        ('registered', 'Registered'),
        ('waitlisted', 'Waitlisted'),
        ('cancelled', 'Cancelled'),
        ('attended', 'Attended'),
    ]

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    participant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='event_registrations')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='registered')
    registration_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, help_text="Any special requirements or notes")
    
    class Meta:
        ordering = ['registration_date']
        unique_together = ['event', 'participant']

    def __str__(self):
        return f"{self.participant.get_full_name()} - {self.event.title}"

    def save(self, *args, **kwargs):
        # If the event is full, automatically set status to waitlisted
        if not self.pk and self.event.is_full and self.status == 'registered':
            self.status = 'waitlisted'
        super().save(*args, **kwargs)

class DonationCampaign(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    goal_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    current_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    image = models.ImageField(upload_to='campaign_images/', null=True, blank=True)
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='organized_campaigns'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def progress_percentage(self):
        if self.goal_amount == 0:
            return 0
        return (self.current_amount / self.goal_amount) * 100

class Donation(models.Model):
    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('successful', 'Successful'),
        ('failed', 'Failed')
    )

    campaign = models.ForeignKey(
        DonationCampaign,
        on_delete=models.CASCADE,
        related_name='donations'
    )
    donor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='donations'
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='pending'
    )
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    razorpay_order_id = models.CharField(max_length=100, blank=True)
    razorpay_signature = models.CharField(max_length=200, blank=True)
    is_anonymous = models.BooleanField(default=False)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        donor_name = 'Anonymous' if self.is_anonymous else (
            self.donor.get_full_name() if self.donor else 'Unknown'
        )
        return f"{donor_name} - {self.amount} - {self.campaign.title}"
