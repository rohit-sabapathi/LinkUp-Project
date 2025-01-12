import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { chatAPI } from '../../services/chatApi';
import ChatRoomList from './ChatRoomList';
import ChatRoom from './ChatRoom';
import NewChatButton from './NewChatButton';

const MessagesPage = () => {
  const { roomId } = useParams();
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchChatRooms();
  }, []);

  const fetchChatRooms = async () => {
    try {
      const response = await chatAPI.getChatRooms();
      setChatRooms(response.data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
      setError('Failed to load chat rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (roomId, message) => {
    setChatRooms(rooms => rooms.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          last_message: message,
          updated_at: new Date().toISOString()
        };
      }
      return room;
    }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-900">
      {/* Chat List Sidebar */}
      <div className="w-1/3 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-200">Messages</h2>
          <NewChatButton onChatCreated={fetchChatRooms} />
        </div>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-500">
            {error}
          </div>
        ) : (
          <ChatRoomList
            chatRooms={chatRooms}
            selectedRoomId={roomId ? parseInt(roomId) : null}
          />
        )}
      </div>

      {/* Chat Room or Welcome Screen */}
      <div className="flex-1 flex flex-col">
        {roomId ? (
          <ChatRoom
            roomId={parseInt(roomId)}
            onNewMessage={handleNewMessage}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <svg
              className="h-16 w-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-lg">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage; 