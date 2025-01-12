import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatAPI } from '../../services/chatApi';
import { PlusIcon } from '@heroicons/react/24/outline';

const NewChatButton = ({ onChatCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchMessageableUsers();
    }
  }, [isOpen]);

  const fetchMessageableUsers = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getMessageableUsers();
      setUsers(response.data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = async (userId) => {
    try {
      setLoading(true);
      console.log('Creating chat room with user:', userId);
      const response = await chatAPI.createChatRoom(userId);
      console.log('Chat room response:', response);
      
      if (response && response.data && response.data.id) {
        setIsOpen(false);
        if (onChatCreated) {
          onChatCreated();
        }
        navigate(`/messages/${response.data.id}`);
      } else {
        console.error('Invalid response from server:', response);
        setError('Failed to create chat room - invalid response');
      }
    } catch (error) {
      console.error('Failed to create chat room:', error);
      setError(error.message || 'Failed to create chat room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-300 hover:text-white focus:outline-none"
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-800 rounded-lg shadow-lg py-1 z-50">
          <div className="px-4 py-2 text-sm font-medium text-slate-200 border-b border-slate-700">
            New Message
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="px-4 py-2 text-sm text-red-500">
                {error}
              </div>
            ) : users.length === 0 ? (
              <div className="px-4 py-2 text-sm text-slate-400">
                No users available to message
              </div>
            ) : (
              users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  className="w-full px-4 py-2 text-left hover:bg-slate-700 focus:outline-none transition-colors duration-150"
                >
                  <div className="flex items-center space-x-3">
                    {user.profile_photo ? (
                      <img
                        src={user.profile_photo}
                        alt={user.full_name || user.email}
                        className="w-8 h-8 rounded-full object-cover bg-slate-600"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email)}&background=475569&color=fff`;
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white">
                        {(user.full_name || user.email)[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {user.full_name || user.email}
                      </p>
                      {user.full_name && (
                        <p className="text-xs text-slate-400 truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewChatButton; 