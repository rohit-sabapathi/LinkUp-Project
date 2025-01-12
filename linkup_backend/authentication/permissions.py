from rest_framework import permissions
from .models import User

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == User.UserType.ADMIN

class IsAlumni(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == User.UserType.ALUMNI

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == User.UserType.STUDENT

class IsAdminOrAlumni(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.user_type in [User.UserType.ADMIN, User.UserType.ALUMNI]

class CanCreatePost(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Only Admin and Alumni can create posts
        return request.user.user_type in [User.UserType.ADMIN, User.UserType.ALUMNI]

    def has_object_permission(self, request, view, obj):
        # Users can only edit/delete their own posts
        return obj.author == request.user

class CanInteractWithPost(permissions.BasePermission):
    """Permission to like, save, and comment on posts"""
    def has_permission(self, request, view):
        # All authenticated users can interact with posts
        return request.user.is_authenticated
