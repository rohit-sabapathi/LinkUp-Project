import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import NotificationBell from '../notifications/NotificationBell';
import { ChatBubbleLeftIcon, BriefcaseIcon, CalendarIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't show navbar on auth pages
  if (isAuthPage) {
    return null;
  }

  return (
    <nav className="bg-slate-800 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-blue-500 text-2xl font-bold">
              LinkUp
            </Link>
            
            {/* Only show these links if user is logged in */}
            {user && (
              <div className="ml-10 flex items-center space-x-4">
                <Link
                  to="/"
                  className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Feed
                </Link>
                <Link
                  to="/jobs"
                  className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
                >
                  <BriefcaseIcon className="h-5 w-5" />
                  <span>Jobs</span>
                </Link>
                <Link
                  to="/search"
                  className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Search
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  to="/events"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors ${
                    location.pathname.startsWith('/events') ? 'bg-slate-700 text-blue-400' : 'text-slate-300'
                  }`}
                >
                  <CalendarIcon className="h-5 w-5" />
                  Events
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                <Link
                  to="/messages"
                  className="p-2 text-slate-300 hover:text-slate-100 focus:outline-none"
                >
                  <ChatBubbleLeftIcon className="h-6 w-6" />
                </Link>
                <NotificationBell />
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white"
                  >
                    <span className="sr-only">Open user menu</span>
                    {user.profile_photo ? (
                      <img
                        src={user.profile_photo}
                        alt={user.full_name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-white">
                        {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                      </div>
                    )}
                  </button>

                  {isMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-slate-700 ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Link
                        to={`/profile/${user.id}`}
                        className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-600"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Your Profile
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-600"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
