from rest_framework import generics, permissions, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Q
from .serializers import UserSerializer, UserRegistrationSerializer
from .models import UserFollowing, FollowRequest, Notification
from django.shortcuts import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from google.oauth2 import id_token
from google.auth.transport import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from authentication.models import User
from authentication.serializers import UserSerializer
import jwt
from django.conf import settings

class GoogleLoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Verify the token with clock skew tolerance
            id_info = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                settings.GOOGLE_OAUTH2_CLIENT_ID,
                clock_skew_in_seconds=10  # Add 10 seconds of leeway
            )
            
            if id_info['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                return Response({'error': 'Wrong issuer'}, status=status.HTTP_401_UNAUTHORIZED)

            email = id_info['email']
            # Try to get existing user
            try:
                user = User.objects.get(email=email)
                # User exists, proceed with login
                refresh = RefreshToken.for_user(user)
                return Response({
                    'token': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': UserSerializer(user).data,
                    'message': 'Login successful'
                }, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                # User doesn't exist, create new user with Google info
                name_parts = id_info.get('name', '').split(' ', 1)
                first_name = name_parts[0] if name_parts else ''
                last_name = name_parts[1] if len(name_parts) > 1 else ''
                
                user = User.objects.create(
                    email=email,
                    username=email.split('@')[0],  # Create username from email
                    first_name=first_name,
                    last_name=last_name,
                    is_active=True,
                    user_type=User.UserType.ALUMNI  # Default user type
                )
                
                # Generate tokens for the new user
                refresh = RefreshToken.for_user(user)
                return Response({
                    'token': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': UserSerializer(user).data,
                    'message': 'Registration successful'
                }, status=status.HTTP_201_CREATED)

        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(email=request.data['email'])
            user_data = UserSerializer(user).data
            response.data['user'] = user_data
        return response

class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'message': 'User created successfully'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # If no pk in URL, return current user
        pk = self.kwargs.get('pk')
        if not pk:
            return self.request.user
        return get_object_or_404(User, pk=pk)

class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def follow_user(request):
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_to_follow = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if user_to_follow == request.user:
        return Response({'error': 'You cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if there's already a pending request
    existing_request = FollowRequest.objects.filter(
        from_user=request.user,
        to_user=user_to_follow,
        status='pending'
    ).first()

    if existing_request:
        return Response({'error': 'Follow request already sent'}, status=status.HTTP_400_BAD_REQUEST)

    # Create follow request
    follow_request = FollowRequest.objects.create(
        from_user=request.user,
        to_user=user_to_follow
    )

    # Create notification for the target user
    Notification.objects.create(
        user=user_to_follow,
        title='New Follow Request',
        message=f'{request.user.get_full_name()} wants to follow you',
        notification_type='follow_request',
        related_id=follow_request.id
    )

    return Response({'status': 'follow_request_sent'})

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def handle_follow_request(request):
    request_id = request.data.get('request_id')
    action = request.data.get('action')  # 'accept' or 'decline'

    if not request_id or not action:
        return Response({'error': 'request_id and action are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        follow_request = FollowRequest.objects.get(id=request_id, to_user=request.user, status='pending')
    except FollowRequest.DoesNotExist:
        return Response({'error': 'Follow request not found'}, status=status.HTTP_404_NOT_FOUND)

    if action == 'accept':
        # Create one-way follow relationship
        UserFollowing.objects.get_or_create(user=follow_request.from_user, following_user=request.user)
        
        follow_request.status = 'accepted'
        follow_request.save()

        # Notify the requester
        Notification.objects.create(
            user=follow_request.from_user,
            title='Follow Request Accepted',
            message=f'{request.user.get_full_name()} accepted your follow request',
            notification_type='follow_accepted',
            related_id=follow_request.id
        )

        return Response({'status': 'accepted'})
    
    elif action == 'decline':
        follow_request.status = 'declined'
        follow_request.save()

        # Notify the requester
        Notification.objects.create(
            user=follow_request.from_user,
            title='Follow Request Declined',
            message=f'{request.user.get_full_name()} declined your follow request',
            notification_type='follow_declined',
            related_id=follow_request.id
        )

        return Response({'status': 'declined'})

    return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_notifications(request):
    notifications = Notification.objects.filter(user=request.user)
    data = [{
        'id': n.id,
        'title': n.title,
        'message': n.message,
        'type': n.notification_type,
        'related_id': n.related_id,
        'is_read': n.is_read,
        'created_at': n.created_at
    } for n in notifications]
    return Response(data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notification_read(request, notification_id):
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.is_read = True
        notification.save()
        return Response({'status': 'success'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def unfollow_user(request):
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_to_unfollow = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    UserFollowing.objects.filter(
        user=request.user,
        following_user=user_to_unfollow
    ).delete()

    return Response({'status': 'unfollowed'})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_following(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        following = UserFollowing.objects.filter(user=user).select_related('following_user')
        
        # Add pagination
        paginator = PageNumberPagination()
        paginator.page_size = 10
        paginated_following = paginator.paginate_queryset(following, request)
        
        following_users = [follow.following_user for follow in paginated_following]
        serializer = UserSerializer(following_users, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_followers(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        followers = UserFollowing.objects.filter(following_user=user).select_related('user')
        
        # Add pagination
        paginator = PageNumberPagination()
        paginator.page_size = 10
        paginated_followers = paginator.paginate_queryset(followers, request)
        
        follower_users = [follow.user for follow in paginated_followers]
        serializer = UserSerializer(follower_users, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class SearchUsersView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'email', 'username']

    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if not query:
            return User.objects.none()
        
        return User.objects.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(email__icontains=query) |
            Q(username__icontains=query)
        ).exclude(id=self.request.user.id)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_follow_request_status(request, user_id):
    try:
        follow_request = FollowRequest.objects.filter(
            from_user=request.user,
            to_user_id=user_id,
            status='pending'
        ).first()
        
        if follow_request:
            return Response({'status': 'requested'})
        
        is_following = UserFollowing.objects.filter(
            user=request.user,
            following_user_id=user_id
        ).exists()
        
        return Response({'status': 'following' if is_following else 'none'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
