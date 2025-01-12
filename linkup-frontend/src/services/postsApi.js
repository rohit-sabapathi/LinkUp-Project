import { api } from './api';

export const postsAPI = {
  // Get all posts
  getPosts: () => 
    api.get('/posts/'),
  
  // Get user's posts
  getUserPosts: (userId) =>
    api.get(`/posts/user/${userId}/`),
  
  // Create a new post
  createPost: (postData) => 
    api.post('/posts/', postData, {
      headers: {
        'Content-Type': postData instanceof FormData ? 'multipart/form-data' : 'application/json',
      },
    }),
  
  // Like/unlike a post
  likePost: (postId) => 
    api.post(`/posts/${postId}/like/`),
  
  // Save/unsave a post
  savePost: (postId) => 
    api.post(`/posts/${postId}/save/`),
  
  // Get saved posts
  getSavedPosts: () => 
    api.get('/posts/saved/'),
  
  // Add a comment
  addComment: (postId, content) => 
    api.post(`/posts/${postId}/comments/`, { content }),
  
  // Like/unlike a comment
  likeComment: (postId, commentId) => 
    api.post(`/posts/${postId}/comments/${commentId}/like/`),
  
  // Get comments for a post
  getComments: (postId) =>
    api.get(`/posts/${postId}/comments/`),
};
