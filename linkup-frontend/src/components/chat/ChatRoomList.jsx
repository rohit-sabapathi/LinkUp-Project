import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const ChatRoomList = ({ chatRooms, selectedRoomId }) => {
  if (!chatRooms.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        No messages yet
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {chatRooms.map(room => (
        <Link
          key={room.id}
          to={`/messages/${room.id}`}
          className={`block border-b border-slate-700 hover:bg-slate-800 transition-colors ${
            selectedRoomId === room.id ? 'bg-slate-800' : ''
          }`}
        >
          <div className="p-4 flex items-start space-x-3">
            {/* User Avatar */}
            {room.other_user.profile_photo ? (
              <img
                src={room.other_user.profile_photo}
                alt={`${room.other_user.first_name} ${room.other_user.last_name}`}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center text-white">
                {room.other_user.first_name[0].toUpperCase()}
              </div>
            )}

            {/* Chat Info */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className="text-slate-200 font-medium truncate">
                  {room.other_user.first_name} {room.other_user.last_name}
                </h3>
                {room.last_message && (
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                    {format(new Date(room.last_message.created_at), 'MMM d, h:mm a')}
                  </span>
                )}
              </div>

              <div className="flex items-center mt-1">
                {room.last_message ? (
                  <p className="text-sm text-slate-400 truncate">
                    {room.last_message.content}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    No messages yet
                  </p>
                )}

                {room.unread_count > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {room.unread_count}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ChatRoomList; 