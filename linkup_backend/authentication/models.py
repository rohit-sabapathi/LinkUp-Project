from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    class UserType(models.TextChoices):
        ADMIN = 'ADMIN', _('Admin')
        ALUMNI = 'ALUMNI', _('Alumni')
        STUDENT = 'STUDENT', _('Student')
        FACULTY = 'FACULTY', _('Faculty')

    email = models.EmailField(_('email address'), unique=True)
    user_type = models.CharField(
        max_length=10,
        choices=UserType.choices,
        default=UserType.ALUMNI,
    )
    profile_photo = models.ImageField(upload_to='profile_photos/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    graduation_year = models.IntegerField(null=True, blank=True)
    department = models.CharField(max_length=100, blank=True)
    following = models.ManyToManyField(
        'self',
        through='UserFollowing',
        related_name='followers',
        symmetrical=False
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    objects = CustomUserManager()

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"

class UserFollowing(models.Model):
    user = models.ForeignKey(User, related_name='following_relationships', on_delete=models.CASCADE)
    following_user = models.ForeignKey(User, related_name='follower_relationships', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'following_user']
        
    def __str__(self):
        return f'{self.user.email} follows {self.following_user.email}'

class FollowRequest(models.Model):
    from_user = models.ForeignKey(User, related_name='sent_follow_requests', on_delete=models.CASCADE)
    to_user = models.ForeignKey(User, related_name='received_follow_requests', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=10,
        choices=[
            ('pending', 'Pending'),
            ('accepted', 'Accepted'),
            ('declined', 'Declined'),
        ],
        default='pending'
    )

    class Meta:
        unique_together = ['from_user', 'to_user']
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.from_user.get_full_name()} -> {self.to_user.get_full_name()}: {self.status}'

class Notification(models.Model):
    user = models.ForeignKey(User, related_name='notifications', on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20,
        choices=[
            ('follow_request', 'Follow Request'),
            ('follow_accepted', 'Follow Request Accepted'),
            ('follow_declined', 'Follow Request Declined'),
            ('message', 'New Message'),
        ]
    )
    related_id = models.IntegerField(null=True, blank=True)  # ID of related object (e.g., follow request ID)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.get_full_name()} - {self.title}'
