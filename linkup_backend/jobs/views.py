from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import JobPosting
from .serializers import JobPostingSerializer
from django.utils import timezone
from django.db.models import Q
import logging
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

logger = logging.getLogger(__name__)

class IsAdminOrAlumniOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.user_type.upper() in ['ADMIN', 'ALUMNI']

class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.filter(is_active=True)
    serializer_class = JobPostingSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'delete']
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_permissions(self):
        if self.action == 'list' or self.action == 'retrieve':
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated, IsAdminOrAlumniOrReadOnly]
        return [permission() for permission in permission_classes]

    def initial(self, request, *args, **kwargs):
        """Add debugging information before processing the request"""
        logger.info(f"Request Method: {request.method}")
        logger.info(f"Request User: {request.user}")
        logger.info(f"Request Data: {request.data}")
        logger.info(f"User Type: {request.user.user_type if request.user.is_authenticated else 'Anonymous'}")
        logger.info(f"Action: {self.action}")
        return super().initial(request, *args, **kwargs)

    def get_queryset(self):
        queryset = JobPosting.objects.filter(is_active=True)
        if self.action == 'list':
            # Search functionality
            search_query = self.request.query_params.get('search', '').strip()
            if search_query:
                queryset = queryset.filter(
                    Q(title__icontains=search_query) |
                    Q(company__icontains=search_query) |
                    Q(description__icontains=search_query) |
                    Q(requirements__icontains=search_query)
                )

            # Filter by job type
            job_type = self.request.query_params.get('job_type')
            if job_type:
                queryset = queryset.filter(job_type=job_type)

            # Filter by experience level
            experience_level = self.request.query_params.get('experience_level')
            if experience_level:
                queryset = queryset.filter(experience_level=experience_level)

            # Filter by location
            location = self.request.query_params.get('location')
            if location:
                queryset = queryset.filter(location__icontains=location)

            # Only show jobs that haven't passed their deadline
            return queryset.filter(
                Q(deadline__gte=timezone.now()) | Q(deadline__isnull=True)
            ).order_by('-created_at')
        return queryset

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.filter_queryset(self.get_queryset())
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in list: {str(e)}")
            return Response([], status=status.HTTP_200_OK)

    def perform_create(self, serializer):
        serializer.save(posted_by=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            logger.info("\n=== Debug Information ===")
            logger.info(f"Request Method: {request.method}")
            logger.info(f"Request Headers: {dict(request.headers)}")
            logger.info(f"Request Data: {request.data}")
            logger.info(f"Request User: {request.user}")
            logger.info(f"User Type: {request.user.user_type}")
            logger.info(f"Action: {self.action}")
            logger.info("======================\n")

            if not request.user.is_authenticated:
                return Response(
                    {'detail': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if request.user.user_type.upper() not in ['ADMIN', 'ALUMNI']:
                return Response(
                    {'detail': 'Only admins and alumni can post jobs'},
                    status=status.HTTP_403_FORBIDDEN
                )

            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Serializer Errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"Error creating job: {str(e)}")
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error in update: {str(e)}")
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
