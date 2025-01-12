import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { usersAPI } from '../../services/usersApi';
import UserCard from './UserCard';

const UserSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const response = await usersAPI.searchUsers(searchQuery);
      setSearchResults(response.data);
    } catch (err) {
      console.error('Failed to search users:', err);
      setError('Failed to search users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = (userId, isFollowing) => {
    setSearchResults(results =>
      results.map(user =>
        user.id === userId ? { ...user, is_following: isFollowing } : user
      )
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full bg-slate-800 text-slate-200 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="absolute right-2 top-1.5 px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="text-red-500 text-center mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {searchResults.map(user => (
          <UserCard
            key={user.id}
            user={user}
            onFollowChange={(isFollowing) => handleFollowChange(user.id, isFollowing)}
          />
        ))}
        {searchResults.length === 0 && searchQuery && !loading && !error && (
          <div className="text-center text-slate-400 py-8">
            No users found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch;
