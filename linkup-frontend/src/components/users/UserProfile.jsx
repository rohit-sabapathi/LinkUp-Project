import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usersAPI } from '../../services/usersApi';
import { postsAPI } from '../../services/postsApi';
import { useAuth } from '../../contexts/AuthContext';
import UserList from './UserList';
import FollowButton from './FollowButton';
import PostCard from '../posts/PostCard';

const UserProfile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const isOwnProfile = Number(currentUser?.id) === Number(userId);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await usersAPI.getUserProfile(userId);
        setUser(response.data);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserPosts = async () => {
      try {
        setLoadingPosts(true);
        const response = await postsAPI.getUserPosts(userId);
        setUserPosts(response.data);
      } catch (err) {
        console.error('Failed to fetch user posts:', err);
      } finally {
        setLoadingPosts(false);
      }
    };

    if (userId) {
      fetchUserData();
      fetchUserPosts();
    }
  }, [userId]);

  const handleFollowChange = (isFollowing) => {
    setUser(prev => ({ ...prev, is_following: isFollowing }));
  };

  const handlePostUpdate = (updatedPost) => {
    setUserPosts(posts =>
      posts.map(post =>
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center text-red-500 py-8">
        {error || 'User not found'}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {user.profile_photo ? (
              <img
                src={user.profile_photo}
                alt={user.full_name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-600 flex items-center justify-center">
                <span className="text-3xl text-slate-300">
                  {user.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-200">{user.full_name}</h1>
              <p className="text-slate-400">{user.email}</p>
              {user.bio && (
                <p className="text-slate-300 mt-2">{user.bio}</p>
              )}
              <div className="flex items-center space-x-4 mt-4">
                <div>
                  <div className="text-lg font-semibold text-slate-200">
                    {user.followers_count || 0}
                  </div>
                  <div className="text-sm text-slate-400">Followers</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-200">
                    {user.following_count || 0}
                  </div>
                  <div className="text-sm text-slate-400">Following</div>
                </div>
              </div>
            </div>
          </div>
          {!isOwnProfile && (
            <FollowButton
              userId={user.id}
              initialIsFollowing={user.is_following}
              onFollowChange={handleFollowChange}
            />
          )}
        </div>
        
        {/* Additional Info */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          {user.department && (
            <div className="text-slate-400">
              <span className="block text-slate-500">Department</span>
              {user.department}
            </div>
          )}
          {user.graduation_year && (
            <div className="text-slate-400">
              <span className="block text-slate-500">Graduation Year</span>
              {user.graduation_year}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-4 px-1 relative ${
              activeTab === 'posts'
                ? 'text-blue-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Posts
            {activeTab === 'posts' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`py-4 px-1 relative ${
              activeTab === 'followers'
                ? 'text-blue-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Followers
            {activeTab === 'followers' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`py-4 px-1 relative ${
              activeTab === 'following'
                ? 'text-blue-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Following
            {activeTab === 'following' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : userPosts.length > 0 ? (
              userPosts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post}
                  onPostUpdate={handlePostUpdate}
                />
              ))
            ) : (
              <div className="text-center text-slate-400 py-8">
                No posts yet
              </div>
            )}
          </div>
        )}
        {activeTab === 'followers' && <UserList type="followers" userId={user.id} />}
        {activeTab === 'following' && <UserList type="following" userId={user.id} />}
      </div>
    </div>
  );
};

export default UserProfile;
