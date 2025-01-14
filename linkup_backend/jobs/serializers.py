from rest_framework import serializers
from .models import JobPosting
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']

class JobPostingSerializer(serializers.ModelSerializer):
    posted_by = UserSerializer(read_only=True)
    
    class Meta:
        model = JobPosting
        fields = [
            'id', 'title', 'company', 'description', 'requirements',
            'location', 'job_type', 'experience_level', 'salary_range',
            'application_url', 'posted_by', 'created_at', 'updated_at',
            'is_active', 'deadline'
        ]
        read_only_fields = ['posted_by', 'created_at', 'updated_at']

    def validate_application_url(self, value):
        """
        Validate that the application URL is a valid URL.
        """
        try:
            from urllib.parse import urlparse
            result = urlparse(value)
            if not all([result.scheme, result.netloc]):
                raise serializers.ValidationError("Please enter a valid URL")
        except:
            raise serializers.ValidationError("Please enter a valid URL")
        return value
