import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        // Get the token from URL if present
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (token) {
            // Handle the token if present
            fetch('http://localhost:8000/api/auth/google/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            })
            .then(response => response.json())
            .then(async data => {
                if (data.token) {
                    // Store tokens
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('refreshToken', data.refresh);
                    
                    // Update auth context using login
                    await login(null, null, data.user);
                    
                    // Show success message
                    toast.success(data.message || 'Authentication successful!');
                    
                    // Redirect to home
                    navigate('/');
                } else {
                    throw new Error(data.error || 'Authentication failed');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                toast.error(error.message || 'An error occurred during authentication');
                navigate('/login');
            });
        } else {
            toast.error('No authentication token found');
            navigate('/login');
        }
    }, [navigate, login]);

    return (
        <div className="flex justify-center items-center min-h-screen bg-slate-900">
            <div className="text-center text-slate-200">
                <h2 className="text-2xl font-semibold mb-4">Processing your login...</h2>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
        </div>
    );
};

export default GoogleCallback; 