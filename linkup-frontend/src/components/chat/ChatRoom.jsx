import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatAPI } from '../../services/chatApi';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { PaperAirplaneIcon, PhotoIcon } from '@heroicons/react/24/solid';

const ChatRoom = ({ roomId, onNewMessage }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [room, setRoom] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId || isNaN(roomId)) {
      navigate('/messages');
      return;
    }
    fetchRoom();
    fetchMessages();
    const interval = setInterval(fetchNewMessages, 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  }, [messages]);

  const fetchRoom = async () => {
    try {
      if (!roomId || isNaN(roomId)) {
        throw new Error('Invalid room ID');
      }
      const response = await chatAPI.getChatRoom(roomId);
      setRoom(response.data);
    } catch (error) {
      console.error('Failed to fetch room:', error);
      navigate('/messages');
    }
  };

  const fetchMessages = async (loadMore = false) => {
    try {
      if (!roomId || isNaN(roomId)) {
        throw new Error('Invalid room ID');
      }
      setLoading(true);
      const response = await chatAPI.getMessages(roomId, loadMore ? page + 1 : 1);
      const { results, next } = response.data;
      
      if (loadMore) {
        setMessages(prev => [...results.reverse(), ...prev]);
        setPage(prev => prev + 1);
      } else {
        setMessages(results.reverse());
        setPage(1);
      }
      
      setHasMore(!!next);
      setError(null);

      // Mark messages as read
      await chatAPI.markAsRead(roomId);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      if (error.response?.status === 403 || error.message === 'Invalid room ID') {
        navigate('/messages');
      }
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchNewMessages = async () => {
    try {
      const response = await chatAPI.getMessages(roomId);
      const newMessages = response.data.results;
      
      // Only update if there are new messages
      if (newMessages.length > messages.length) {
        setMessages(newMessages.reverse());
        await chatAPI.markAsRead(roomId);
      }
    } catch (error) {
      console.error('Failed to fetch new messages:', error);
    }
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container.scrollTop === 0 && hasMore && !loading) {
      fetchMessages(true);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || sending) return;

    try {
      setSending(true);
      let messageData = {
        content: newMessage.trim() || ''  // Ensure content is always a string
      };

      if (selectedFile) {
        const reader = new FileReader();
        
        const fileData = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        const base64Data = fileData.split(',')[1];
        messageData = {
          ...messageData,
          file_data: base64Data,
          file_type: selectedFile.type,
          file_name: selectedFile.name
        };
      }

      const response = await chatAPI.sendMessage(roomId, messageData);
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onNewMessage(roomId, response.data);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(error.response?.data?.detail || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = (message) => {
    const isOwnMessage = message.sender.id === user.id;
    return (
      <div
        key={message.id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[70%] rounded-lg px-4 py-2 ${
            isOwnMessage
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-200'
          }`}
        >
          {message.file_type && message.file_type.startsWith('image/') ? (
            <img 
              src={`data:${message.file_type};base64,${message.file_data}`}
              alt="Shared image"
              className="max-w-full rounded-lg mb-2"
            />
          ) : message.file_type && message.file_type.startsWith('video/') ? (
            <video 
              controls 
              className="max-w-full rounded-lg mb-2"
            >
              <source src={`data:${message.file_type};base64,${message.file_data}`} type={message.file_type} />
              Your browser does not support the video tag.
            </video>
          ) : null}
          {message.content && <p className="text-sm">{message.content}</p>}
          <p className="text-xs mt-1 opacity-75">
            {format(new Date(message.created_at), 'h:mm a')}
          </p>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  const otherUser = room?.other_user;

  return (
    <>
      {/* Chat Header */}
      {otherUser && (
        <div className="p-4 border-b border-slate-700 flex items-center space-x-3">
          {otherUser.profile_photo ? (
            <img
              src={otherUser.profile_photo}
              alt={otherUser.full_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white">
              {otherUser.first_name[0].toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-lg font-medium text-slate-200">
              {otherUser.full_name}
            </h3>
            <p className="text-sm text-slate-400">{otherUser.email}</p>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4"
        onScroll={handleScroll}
      >
        {loading && !messages.length ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {messages.map(message => renderMessage(message))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-700">
        <div className="flex space-x-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-700 text-slate-200 rounded-lg px-4 py-2 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PhotoIcon className="h-5 w-5" />
          </button>
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedFile) || sending}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <PaperAirplaneIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        {selectedFile && (
          <div className="mt-2 text-sm text-slate-400">
            Selected file: {selectedFile.name}
            <button
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="ml-2 text-red-500 hover:text-red-400"
            >
              Remove
            </button>
          </div>
        )}
      </form>
    </>
  );
};

export default ChatRoom; 