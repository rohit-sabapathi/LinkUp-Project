from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer
from django.contrib.auth import get_user_model
from authentication.models import UserFollowing
from django.http import Http404
from django.core.exceptions import PermissionDenied

User = get_user_model()

class MessagePagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

class ChatRoomListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatRoom.objects.filter(
            Q(user1=self.request.user) | Q(user2=self.request.user)
        ).order_by('-updated_at')

    def get_object(self):
        room_id = self.kwargs.get('room_id')
        user_id = self.kwargs.get('user_id')

        # If room_id is provided, get existing chat room
        if room_id:
            try:
                chat_room = ChatRoom.objects.get(id=room_id)
                if not chat_room.can_participate(self.request.user):
                    raise PermissionDenied("You cannot access this chat room")
                return chat_room
            except ChatRoom.DoesNotExist:
                raise Http404("Chat room not found")

        # If user_id is provided, get or create chat room with that user
        if user_id:
            try:
                other_user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                raise Http404("User not found")

            # Prevent self-messaging
            if other_user.id == self.request.user.id:
                raise PermissionDenied("You cannot message yourself")

            # Debug logging
            print(f"[ChatRoom Debug] Current user: {self.request.user.id} ({self.request.user.email})")
            print(f"[ChatRoom Debug] Other user: {other_user.id} ({other_user.email})")

            # Get or create chat room
            chat_room = ChatRoom.objects.filter(
                (Q(user1=self.request.user) & Q(user2=other_user)) |
                (Q(user1=other_user) & Q(user2=self.request.user))
            ).first()

            if chat_room:
                print(f"[ChatRoom Debug] Found existing chat room: {chat_room.id}")
                return chat_room

            # Check if either user follows the other
            can_message = (
                UserFollowing.objects.filter(
                    user=self.request.user, 
                    following_user=other_user
                ).exists() or
                UserFollowing.objects.filter(
                    user=other_user, 
                    following_user=self.request.user
                ).exists()
            )

            print(f"[ChatRoom Debug] Can message: {can_message}")
            
            if not can_message:
                raise PermissionDenied("You can only message users who follow you or who you follow")

            print(f"[ChatRoom Debug] Creating new chat room for users")
            chat_room = ChatRoom.objects.create(
                user1=self.request.user,
                user2=other_user
            )
            return chat_room

        raise Http404("No room_id or user_id provided")

    def get(self, request, *args, **kwargs):
        try:
            if 'user_id' in self.kwargs or 'room_id' in self.kwargs:
                instance = self.get_object()
                serializer = self.get_serializer(instance)
                return Response(serializer.data)
            return super().get(request, *args, **kwargs)
        except Http404 as e:
            print(f"[ChatRoom Error] HTTP 404: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied as e:
            print(f"[ChatRoom Error] Permission Denied: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            print(f"[ChatRoom Error] Unexpected error: {str(e)}")
            return Response(
                {"error": "Failed to get chat room: " + str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = MessagePagination

    def get_queryset(self):
        try:
            room_id = self.kwargs['room_id']
            room = get_object_or_404(ChatRoom, id=room_id)
            
            # Check if user is part of the chat room
            if self.request.user not in [room.user1, room.user2]:
                raise PermissionDenied("You are not a participant in this chat room")

            # Check if either user follows the other
            other_user = room.user2 if self.request.user == room.user1 else room.user1
            can_message = (
                UserFollowing.objects.filter(
                    user=self.request.user, 
                    following_user=other_user
                ).exists() or
                UserFollowing.objects.filter(
                    user=other_user, 
                    following_user=self.request.user
                ).exists()
            )
            
            if not can_message:
                raise PermissionDenied("You can only message users who follow you or who you follow")
                
            return Message.objects.filter(room=room).order_by('-created_at')
        except Exception as e:
            print(f"[ChatRoom Error] Error getting messages: {str(e)}")
            return Message.objects.none()

    def perform_create(self, serializer):
        try:
            room_id = self.kwargs['room_id']
            room = get_object_or_404(ChatRoom, id=room_id)
            
            # Check if user is part of the chat room
            if self.request.user not in [room.user1, room.user2]:
                raise PermissionDenied("You are not a participant in this chat room")

            # Check if either user follows the other
            other_user = room.user2 if self.request.user == room.user1 else room.user1
            can_message = (
                UserFollowing.objects.filter(
                    user=self.request.user, 
                    following_user=other_user
                ).exists() or
                UserFollowing.objects.filter(
                    user=other_user, 
                    following_user=self.request.user
                ).exists()
            )
            
            if not can_message:
                raise PermissionDenied("You can only message users who follow you or who you follow")

            # Validate file size
            file_data = self.request.data.get('file_data')
            if file_data:
                # Assuming base64 encoded data
                file_size = len(file_data) * 3 / 4  # Approximate size in bytes
                if file_size > 5 * 1024 * 1024:  # 5MB limit
                    raise serializers.ValidationError("File size should be less than 5MB")

            serializer.save(room=room, sender=self.request.user)
            room.save()  # Update the room's updated_at timestamp
        except Exception as e:
            print(f"[ChatRoom Error] Error creating message: {str(e)}")
            raise serializers.ValidationError(str(e))

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except PermissionDenied as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response(
                {"error": "Failed to get messages: " + str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_messages_read(request, room_id):
    try:
        room = get_object_or_404(ChatRoom, id=room_id)
        
        # Check if user is part of the chat room
        if request.user not in [room.user1, room.user2]:
            return Response(
                {'error': 'You are not a participant in this chat room'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if either user follows the other
        other_user = room.user2 if request.user == room.user1 else room.user1
        can_message = (
            UserFollowing.objects.filter(
                user=request.user, 
                following_user=other_user
            ).exists() or
            UserFollowing.objects.filter(
                user=other_user, 
                following_user=request.user
            ).exists()
        )
        
        if not can_message:
            return Response(
                {'error': 'You can only message users who follow you or who you follow'},
                status=status.HTTP_403_FORBIDDEN
            )

        Message.objects.filter(
            room=room,
            sender=other_user,
            is_read=False
        ).update(is_read=True)

        return Response({'status': 'success'})
        
    except Exception as e:
        print(f"[ChatRoom Error] Error marking messages as read: {str(e)}")
        return Response(
            {'error': f'Failed to mark messages as read: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_messageable_users(request):
    # Get users who follow you or who you follow
    following_ids = UserFollowing.objects.filter(
        user=request.user
    ).values_list('following_user_id', flat=True)
    
    followers_ids = UserFollowing.objects.filter(
        following_user=request.user
    ).values_list('user_id', flat=True)
    
    # Combine both sets of users
    messageable_ids = set(following_ids) | set(followers_ids)
    messageable_users = User.objects.filter(id__in=messageable_ids)

    data = [{
        'id': user.id,
        'full_name': user.get_full_name(),
        'email': user.email,
        'profile_photo': user.profile_photo.url if user.profile_photo else None
    } for user in messageable_users]

    return Response(data)
