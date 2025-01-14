from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import UserPreference
from .serializers import UserPreferenceSerializer

# Create your views here.

class UserPreferenceViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def retrieve(self, request):
        """Get user preferences, create with defaults if not exists."""
        preference, created = UserPreference.objects.get_or_create(
            user=request.user
        )
        serializer = UserPreferenceSerializer(preference)
        return Response(serializer.data)

    def update(self, request):
        """Update user preferences."""
        preference, created = UserPreference.objects.get_or_create(
            user=request.user
        )
        serializer = UserPreferenceSerializer(
            preference,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
