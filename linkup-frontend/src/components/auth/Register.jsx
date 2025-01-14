import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Google from './Google';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password2: '',
    firstName: '',
    lastName: '',
    userType: 'STUDENT',
    profilePhoto: null,
    bio: '',
    graduationYear: '',
    department: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      profilePhoto: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password2) {
      return setError('Passwords do not match');
    }

    if (!formData.username.trim()) {
      return setError('Username is required');
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('email', formData.email);
      formDataToSend.append('username', formData.username);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('password2', formData.password2);
      formDataToSend.append('first_name', formData.firstName);
      formDataToSend.append('last_name', formData.lastName);
      formDataToSend.append('user_type', formData.userType);
      formDataToSend.append('bio', formData.bio || '');
      formDataToSend.append('graduation_year', formData.graduationYear || '');
      formDataToSend.append('department', formData.department || '');
      
      if (formData.profilePhoto) {
        formDataToSend.append('profile_photo', formData.profilePhoto);
      }

      await register(formDataToSend);
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err.response?.data);
      const errorMessage = err.response?.data?.detail || 
        Object.entries(err.response?.data || {})
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ') ||
        'Failed to register. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-200">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Or{' '}
            <Link to="/login" className="font-medium text-blue-500 hover:text-blue-400">
              sign in to your account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500 text-white p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-200">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-700 bg-slate-800 text-slate-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-200">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-700 bg-slate-800 text-slate-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-700 bg-slate-800 text-slate-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-200">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-700 bg-slate-800 text-slate-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-slate-200">
                User Type
              </label>
              <select
                id="userType"
                name="userType"
                required
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-slate-700 bg-slate-800 text-slate-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.userType}
                onChange={handleChange}
              >
                <option value="STUDENT">Student</option>
                <option value="ALUMNI">Alumni</option>
                <option value="FACULTY">Faculty</option>
              </select>
            </div>

            <div>
              <label htmlFor="profilePhoto" className="block text-sm font-medium text-slate-200">
                Profile Photo
              </label>
              <input
                id="profilePhoto"
                name="profilePhoto"
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-sm text-slate-200
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700"
                onChange={handleFileChange}
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-slate-200">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows="3"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-700 bg-slate-800 text-slate-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.bio}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="graduationYear" className="block text-sm font-medium text-slate-200">
                Graduation Year
              </label>
              <input
                id="graduationYear"
                name="graduationYear"
                type="number"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-700 bg-slate-800 text-slate-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.graduationYear}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-slate-200">
                Department
              </label>
              <input
                id="department"
                name="department"
                type="text"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-700 bg-slate-800 text-slate-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.department}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-200">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-700 bg-slate-800 text-slate-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password2" className="block text-sm font-medium text-slate-200">
                Confirm Password
              </label>
              <input
                id="password2"
                name="password2"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-700 bg-slate-800 text-slate-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.password2}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
      <Google />
    </div>
  );
};

export default Register;
