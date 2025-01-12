import { useState } from 'react';
import { usersAPI } from '../../services/usersApi';
import { toast } from 'react-hot-toast';

const FollowButton = ({ userId, initialIsFollowing, initialRequestSent, onFollowChange }) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [requestSent, setRequestSent] = useState(initialRequestSent);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollowClick = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (isFollowing) {
        await usersAPI.unfollowUser(userId);
        toast.success('Unfollowed successfully');
        setIsFollowing(false);
        setRequestSent(false);
      } else {
        const response = await usersAPI.followUser(userId);
        if (response.data.status === 'follow_request_sent') {
          toast.success('Follow request sent');
          setRequestSent(true);
        }
      }
      if (onFollowChange) {
        onFollowChange(isFollowing ? false : true);
      }
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
      toast.error(error.message || 'Failed to update follow status');
      // Revert the optimistic update if it failed
      if (onFollowChange) {
        onFollowChange(isFollowing);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) {
      return isFollowing ? 'Unfollowing...' : 'Following...';
    }
    if (isFollowing) {
      return 'Following';
    }
    if (requestSent) {
      return 'Requested';
    }
    return 'Follow';
  };

  const getButtonStyle = () => {
    if (isFollowing) {
      return 'bg-slate-700 text-slate-200 hover:bg-red-600 focus:ring-red-500';
    }
    if (requestSent) {
      return 'bg-slate-600 text-slate-200 cursor-not-allowed';
    }
    return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
  };

  return (
    <button
      onClick={handleFollowClick}
      disabled={isLoading || requestSent}
      className={`px-4 py-1.5 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${getButtonStyle()} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
    >
      {isLoading ? (
        <span className="flex items-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {getButtonText()}
        </span>
      ) : (
        <span>{getButtonText()}</span>
      )}
    </button>
  );
};

export default FollowButton;
