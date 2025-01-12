import { useState, useEffect, useCallback } from 'react';
import UserCard from './UserCard';
import { usersAPI } from '../../services/usersApi';
import { useAuth } from '../../contexts/AuthContext';
import { useInView } from 'react-intersection-observer';

const UserList = ({ type = 'followers', userId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextPage, setNextPage] = useState(null);
  const { currentUser } = useAuth();
  const { ref, inView } = useInView();

  const fetchUsers = useCallback(async (url = null) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await (type === 'followers' 
        ? usersAPI.getFollowers(userId, url)
        : usersAPI.getFollowing(userId, url)
      );
      
      if (url) {
        setUsers(prev => [...prev, ...response.data.results]);
      } else {
        setUsers(response.data.results);
      }
      setNextPage(response.data.next);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [type, userId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (inView && nextPage && !loading) {
      fetchUsers(nextPage);
    }
  }, [inView, nextPage, loading, fetchUsers]);

  const handleFollowChange = (userId, isFollowing) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, is_following: isFollowing }
          : user
      )
    );
  };

  if (error && users.length === 0) {
    return (
      <div className="text-center text-red-500 py-4">
        {error}
      </div>
    );
  }

  if (!users.length && !loading) {
    return (
      <div className="text-center text-slate-400 py-4">
        {type === 'followers'
          ? 'No followers yet'
          : 'Not following anyone yet'
        }
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map(user => (
        <UserCard
          key={user.id}
          user={user}
          onFollowChange={(isFollowing) => handleFollowChange(user.id, isFollowing)}
        />
      ))}
      
      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Intersection observer target */}
      {nextPage && !loading && (
        <div ref={ref} className="h-4" />
      )}
    </div>
  );
};

export default UserList;
