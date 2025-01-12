import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import FollowButton from './FollowButton';

const UserCard = ({ user, onFollowChange }) => {
  const { currentUser } = useAuth();
  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div className="bg-slate-800 rounded-lg p-4 flex items-center justify-between">
      <Link to={`/profile/${user.id}`} className="flex items-center space-x-3 flex-1">
        {user.profile_photo ? (
          <img
            src={user.profile_photo}
            alt={user.full_name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center">
            <span className="text-xl text-slate-300">
              {user.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <h3 className="text-slate-200 font-medium">{user.full_name}</h3>
          <p className="text-slate-400 text-sm">{user.email}</p>
        </div>
      </Link>
      
      {!isOwnProfile && (
        <FollowButton
          userId={user.id}
          initialIsFollowing={user.is_following}
          onFollowChange={onFollowChange}
        />
      )}
    </div>
  );
};

export default UserCard;
