import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import GoogleCallback from './components/auth/GoogleCallback';
import Feed from './components/posts/Feed';
import UserProfile from './components/users/UserProfile';
import UserSearch from './components/users/UserSearch';
import AdminDashboard from './components/admin/AdminDashboard';
import JobsPage from './components/jobs/JobsPage';
import MessagesPage from './components/chat/MessagesPage';
import EventList from './components/events/EventList';
import EventDetail from './components/events/EventDetail';
import EventForm from './components/events/EventForm';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/auth/google/callback'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      {!isAuthPage && <Navbar />}
      <main className={`container mx-auto px-4 ${isAuthPage ? '' : 'py-6'}`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Feed />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/profile/:userId"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <UserSearch />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/jobs/*"
            element={
              <ProtectedRoute>
                <JobsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages/:roomId"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/*"
            element={
              <ProtectedRoute>
                <Routes>
                  <Route index element={<EventList />} />
                  <Route path=":id" element={<EventDetail />} />
                  <Route path="create" element={<EventForm />} />
                  <Route path=":id/edit" element={<EventForm />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <AuthProvider>
        <Router>
          <AppContent />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1e293b',
                color: '#e2e8f0',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#e2e8f0',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#e2e8f0',
                },
              },
            }}
          />
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;
