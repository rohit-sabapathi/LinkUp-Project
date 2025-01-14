from rest_framework import serializers
from .models import ChatRoom, Message
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'profile_photo']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'file_data', 'file_type', 'file_name', 'created_at', 'is_read']
        read_only_fields = ['sender', 'is_read']

    def validate(self, attrs):
        content = attrs.get('content', '').strip()
        file_data = attrs.get('file_data')

        # Ensure content is a string
        if not isinstance(content, str):
            raise serializers.ValidationError({"content": "Content must be a string"})

        # Either content or file must be provided
        if not content and not file_data:
            raise serializers.ValidationError("Either content or file must be provided")

        # If file data is provided, file type must also be provided
        if file_data and not attrs.get('file_type'):
            raise serializers.ValidationError({"file_type": "File type is required when sending a file"})

        # Validate file type
        file_type = attrs.get('file_type', '')
        if file_type and not (file_type.startswith('image/') or file_type.startswith('video/')):
            raise serializers.ValidationError({"file_type": "Only image and video files are allowed"})

        return attrs

class ChatRoomSerializer(serializers.ModelSerializer):
    user1 = UserSerializer()
    user2 = UserSerializer()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'user1', 'user2', 'created_at', 'updated_at', 'last_message', 'unread_count', 'other_user']

    def get_last_message(self, obj):
        last_message = obj.messages.order_by('-created_at').first()
        if last_message:
            return MessageSerializer(last_message).data
        return None

    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()

    def get_other_user(self, obj):
        user = self.context['request'].user
        other_user = obj.user2 if obj.user1 == user else obj.user1
        return UserSerializer(other_user).data
