import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { authAPI } from '../../services/api';

const Google = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const handleLoginSuccess = async (credentialResponse) => {
    const googleToken = credentialResponse.credential;

    try {
      const response = await authAPI.googleAuth(googleToken);
      const { token, refresh, user: userData, message } = response.data;

      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refresh);
      
      // Update auth context
      setUser(userData);
      
      // Show success message
      toast.success(message || 'Authentication successful!');
      
      // Redirect to home
      navigate('/');
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.response?.data?.error || "An error occurred while processing your request.");
    }
  };

  const handleLoginFailure = (error) => {
    console.error("Google Login Error:", error);
    toast.error("Login Failed! Please try again.");
  };

  return (
    <GoogleOAuthProvider 
      clientId="4582919422-hefn2gjscgp09oig7roo3e3m7qiqsnm3.apps.googleusercontent.com"
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <GoogleLogin
          onSuccess={handleLoginSuccess}
          onError={handleLoginFailure}
          useOneTap
          flow="implicit"
          auto_select={false}
          context="signin"
          theme="filled_black"
          text="signin_with"
          shape="rectangular"
          locale="en"
        />
      </div>
    </GoogleOAuthProvider>
  );
};

export default Google;

