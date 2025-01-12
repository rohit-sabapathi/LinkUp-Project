from django.urls import path
from .views import (
    ChatRoomListCreateView,
    MessageListCreateView,
    mark_messages_read,
    get_messageable_users,
)

urlpatterns = [
    path('rooms/', ChatRoomListCreateView.as_view(), name='chat-rooms-list'),
    path('rooms/new/<int:user_id>/', ChatRoomListCreateView.as_view(), name='chat-room-create'),
    path('rooms/<int:room_id>/', ChatRoomListCreateView.as_view(), name='chat-room-detail'),
    path('rooms/<int:room_id>/messages/', MessageListCreateView.as_view(), name='room-messages'),
    path('rooms/<int:room_id>/read/', mark_messages_read, name='mark-messages-read'),
    path('messageable-users/', get_messageable_users, name='messageable-users'),
]
