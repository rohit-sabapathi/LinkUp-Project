import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatRoom, Message
from .serializers import MessageSerializer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return

        self.room_id = self.scope['url_route']['kwargs']['room_id']
        
        # Verify user can participate in this chat
        if not await self.can_participate():
            await self.close()
            return

        self.room_name = await self.get_room_name()
        self.room_group_name = f'chat_{self.room_name}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        # Verify user can still participate
        if not await self.can_participate():
            await self.close()
            return

        # Save message to database
        saved_message = await self.save_message(message)
        message_data = await self.get_message_data(saved_message)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message_data
            }
        )

    async def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))

    @database_sync_to_async
    def can_participate(self):
        try:
            chat_room = ChatRoom.objects.get(id=self.room_id)
            return chat_room.can_participate(self.user)
        except ChatRoom.DoesNotExist:
            return False

    @database_sync_to_async
    def get_room_name(self):
        chat_room = ChatRoom.objects.get(id=self.room_id)
        return chat_room.room_name

    @database_sync_to_async
    def save_message(self, content):
        chat_room = ChatRoom.objects.get(id=self.room_id)
        return Message.objects.create(
            room=chat_room,
            sender=self.user,
            content=content
        )

    @database_sync_to_async
    def get_message_data(self, message):
        return MessageSerializer(message).data
