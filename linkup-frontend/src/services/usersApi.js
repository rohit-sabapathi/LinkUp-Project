import { api } from './api';

export const usersAPI = {
  // User profile
  getUserProfile: (userId) => 
    api.get(`/auth/profile/${userId}/`),
  
  // Update user profile
  updateUserProfile: (userId, data) => 
    api.patch(`/auth/profile/${userId}/`, data),
  
  // Follow/unfollow
  followUser: (userId) => 
    api.post('/auth/follow/', { user_id: userId })
      .then(response => {
        if (response.data.status !== 'follow_request_sent') {
          throw new Error(response.data.error || 'Failed to follow user');
        }
        return response;
      }),
  
  unfollowUser: (userId) => 
    api.post('/auth/unfollow/', { user_id: userId })
      .then(response => {
        if (response.data.status !== 'unfollowed') {
          throw new Error(response.data.error || 'Failed to unfollow user');
        }
        return response;
      }),
  
  // Get followers/following with pagination support
  getFollowers: (userId, url = null) => 
    url ? api.get(url) : api.get(`/auth/followers/${userId}/`),
  
  getFollowing: (userId, url = null) => 
    url ? api.get(url) : api.get(`/auth/following/${userId}/`),
  
  // Search users
  searchUsers: (query) => 
    api.get('/auth/search/', { params: { search: query } }),
};
