from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UserFollowing, FollowRequest

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    username = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password2', 'first_name', 'last_name', 
                 'user_type', 'profile_photo', 'bio', 'graduation_year', 'department')

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    follow_request_sent = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'full_name', 
                 'profile_photo', 'bio', 'department', 'graduation_year', 'user_type',
                 'follower_count', 'following_count', 'is_following', 'follow_request_sent']
        read_only_fields = ['email']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_follower_count(self, obj):
        return UserFollowing.objects.filter(following_user=obj).count()

    def get_following_count(self, obj):
        return UserFollowing.objects.filter(user=obj).count()

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if request.user.id == obj.id:
                return None  # Return None for the user's own profile
            return UserFollowing.objects.filter(
                user=request.user,
                following_user=obj
            ).exists()
        return False

    def get_follow_request_sent(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if request.user.id == obj.id:
                return None  # Return None for the user's own profile
            return FollowRequest.objects.filter(
                from_user=request.user,
                to_user=obj,
                status='pending'
            ).exists()
        return False

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data.get('username', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)
