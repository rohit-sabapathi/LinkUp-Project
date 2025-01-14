import { api } from './api';

export const notificationAPI = {
  getNotifications: () => 
    api.get('/auth/notifications/'),

  markAsRead: (notificationId) =>
    api.post(`/auth/notifications/${notificationId}/read/`),

  handleFollowRequest: (requestId, action) =>
    api.post('/auth/follow-request/handle/', {
      request_id: requestId,
      action: action // 'accept' or 'decline'
    }),
}; 