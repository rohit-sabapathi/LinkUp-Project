from django.db import models
from django.contrib.auth import get_user_model
from django.db.models import Q
from authentication.models import UserFollowing

User = get_user_model()

# Create your models here.

class ChatRoom(models.Model):
    user1 = models.ForeignKey(User, related_name='chat_rooms_as_user1', on_delete=models.CASCADE)
    user2 = models.ForeignKey(User, related_name='chat_rooms_as_user2', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def can_participate(self, user):
        if user not in [self.user1, self.user2]:
            return False
        # Allow messaging if either user follows the other
        other_user = self.user2 if user == self.user1 else self.user1
        return (
            UserFollowing.objects.filter(user=user, following_user=other_user).exists() or
            UserFollowing.objects.filter(user=other_user, following_user=user).exists()
        )

    class Meta:
        unique_together = ['user1', 'user2']
        ordering = ['-updated_at']

    def __str__(self):
        return f'Chat between {self.user1.get_full_name()} and {self.user2.get_full_name()}'

    @property
    def room_name(self):
        # Create a consistent room name regardless of user order
        return f'chat_{min(self.user1.id, self.user2.id)}_{max(self.user1.id, self.user2.id)}'

class Message(models.Model):
    room = models.ForeignKey(ChatRoom, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, related_name='sent_messages', on_delete=models.CASCADE)
    content = models.TextField(blank=True)
    file_data = models.TextField(blank=True, null=True)  # Base64 encoded file data
    file_type = models.CharField(max_length=50, blank=True, null=True)  # MIME type
    file_name = models.CharField(max_length=255, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.sender.get_full_name()} -> {self.room} at {self.created_at}'
