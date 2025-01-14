import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usersAPI } from '../../services/usersApi';
import { postsAPI } from '../../services/postsApi';
import { useAuth } from '../../contexts/AuthContext';
import UserList from './UserList';
import FollowButton from './FollowButton';
import PostCard from '../posts/PostCard';
import { FaPencilAlt, FaTrash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const UserProfile = () => {
  const { userId } = useParams();
  const { user: currentUser, updateProfile } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    bio: '',
    department: '',
    graduation_year: '',
    user_type: '',
    profile_photo: null
  });

  const isOwnProfile = Number(currentUser?.id) === Number(userId);

  useEffect(() => {
    if (user) {
      setEditForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        username: user.username || '',
        bio: user.bio || '',
        department: user.department || '',
        graduation_year: user.graduation_year || '',
        user_type: user.user_type || '',
        profile_photo: null
      });
    }
  }, [user]);

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


  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    
    Object.keys(editForm).forEach(key => {
      if (editForm[key] !== null && editForm[key] !== undefined && (key !== 'profile_photo' || editForm[key])) {
        formData.append(key, editForm[key]);
      }
    });

    try {
      await updateProfile(formData);
      setUser(prev => ({ ...prev, ...editForm }));
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profile_photo' && files) {
      setEditForm(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await postsAPI.deletePost(postId);
        setUserPosts(posts => posts.filter(post => post.id !== postId));
        toast.success('Post deleted successfully');
      } catch (error) {
        toast.error('Failed to delete post');
      }
    }
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
          {isOwnProfile ? (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-blue-500 hover:text-blue-400 transition-colors"
              title="Edit Profile"
            >
              <FaPencilAlt />
            </button>
          ) : (
            <FollowButton
              userId={user.id}
              initialIsFollowing={user.is_following}
              onFollowChange={handleFollowChange}
            />
          )}
        </div>

        {isEditing && isOwnProfile && (
          <form onSubmit={handleEditSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={editForm.first_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md bg-slate-700 border-slate-600 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={editForm.last_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md bg-slate-700 border-slate-600 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400">Username</label>
                <input
                  type="text"
                  name="username"
                  value={editForm.username}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md bg-slate-700 border-slate-600 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md bg-slate-700 border-slate-600 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400">Department</label>
                <input
                  type="text"
                  name="department"
                  value={editForm.department}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md bg-slate-700 border-slate-600 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400">Graduation Year</label>
                <input
                  type="number"
                  name="graduation_year"
                  value={editForm.graduation_year}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md bg-slate-700 border-slate-600 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400">User Type</label>
                <select
                  name="user_type"
                  value={editForm.user_type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md bg-slate-700 border-slate-600 text-slate-200"
                >
                  <option value="ALUMNI">Alumni</option>
                  <option value="STUDENT">Student</option>
                  <option value="FACULTY">Faculty</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400">Profile Photo</label>
                <input
                  type="file"
                  name="profile_photo"
                  onChange={handleInputChange}
                  accept="image/*"
                  className="mt-1 block w-full text-sm text-slate-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-500 file:text-slate-200
                    hover:file:bg-blue-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400">Bio</label>
              <textarea
                name="bio"
                value={editForm.bio}
                onChange={handleInputChange}
                rows="3"
                className="mt-1 block w-full rounded-md bg-slate-700 border-slate-600 text-slate-200"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-slate-600 text-slate-200 rounded-md hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
        
        {/* Additional Info */}
        {!isEditing && (
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
        )}
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
                <div key={post.id} className="relative">
                  <PostCard 
                    post={post}
                    onPostUpdate={handlePostUpdate}
                  />
                  {isOwnProfile && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="absolute top-4 right-4 p-2 text-red-500 hover:text-red-400 transition-colors bg-slate-800 rounded-full"
                      title="Delete Post"
                    >
                      <FaTrash size={14} />
                    </button>
                  )}
                </div>
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
