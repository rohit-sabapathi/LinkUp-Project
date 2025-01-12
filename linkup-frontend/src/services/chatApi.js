import { api } from './api';

export const chatAPI = {
  // Get all chat rooms for the current user
  getChatRooms: async () => {
    try {
      const response = await api.get('/chat/rooms/');
      console.log('Get chat rooms response:', response);
      return response;
    } catch (error) {
      console.error('Error getting chat rooms:', error);
      throw error;
    }
  },

  // Get an existing chat room by ID
  getChatRoom: async (roomId) => {
    try {
      console.log('Getting chat room:', roomId);
      const response = await api.get(`/chat/rooms/${roomId}/`);
      console.log('Get chat room response:', response);
      
      if (!response || !response.data) {
        throw new Error('No response from server');
      }
      
      // If we got an error message in the response
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      // Check if we have a valid response with a chat room object
      if (!response.data.id || !response.data.user1 || !response.data.user2) {
        throw new Error('Invalid chat room data received');
      }
      
      return response;
    } catch (error) {
      console.error('Error getting chat room:', error);
      throw error;
    }
  },

  // Create a new chat room with a user
  createChatRoom: async (userId) => {
    try {
      console.log('Creating chat room with user:', userId);
      const response = await api.get(`/chat/rooms/new/${userId}/`);
      console.log('Create chat room response:', response);
      
      if (!response || !response.data) {
        throw new Error('No response from server');
      }
      
      // If we got an error message in the response
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      // Check if we have a valid response with a chat room object
      if (!response.data.id || !response.data.user1 || !response.data.user2) {
        throw new Error('Invalid chat room data received');
      }
      
      return response;
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  },

  // Get messages for a specific chat room
  getMessages: async (roomId, page = 1) => {
    try {
      const response = await api.get(`/chat/rooms/${roomId}/messages/`, {
        params: { page }
      });
      console.log('Get messages response:', response);
      return response;
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  },

  // Send a message in a chat room
  sendMessage: async (roomId, messageData) => {
    try {
      // Ensure content is a string
      if (messageData.content === undefined) {
        messageData.content = '';
      }
      
      const response = await api.post(`/chat/rooms/${roomId}/messages/`, messageData);
      console.log('Send message response:', response);
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Mark messages in a room as read
  markAsRead: async (roomId) => {
    try {
      const response = await api.post(`/chat/rooms/${roomId}/read/`);
      console.log('Mark as read response:', response);
      return response;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  // Get the list of users the current user can message (mutual followers)
  getMessageableUsers: async () => {
    try {
      const response = await api.get('/chat/messageable-users/');
      console.log('Get messageable users response:', response);
      return response;
    } catch (error) {
      console.error('Error getting messageable users:', error);
      throw error;
    }
  },
}; 