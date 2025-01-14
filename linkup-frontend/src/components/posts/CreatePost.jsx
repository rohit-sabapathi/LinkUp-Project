import { useState } from 'react';
import { PhotoIcon } from '@heroicons/react/24/solid';
import { postsAPI } from '../../services/postsApi';
import { useAuth } from '../../contexts/AuthContext';

const CreatePost = ({ onPostCreated = () => {} }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !media) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('content', content);
      if (media) {
        formData.append('media', media);
      }

      const response = await postsAPI.createPost(formData);
      setContent('');
      setMedia(null);
      setMediaPreview('');
      onPostCreated(response.data);
    } catch (err) {
      console.error('Failed to create post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-4">
      <div className="flex items-center space-x-3 mb-4">
        <img
          src={user?.profile_photo || '/default-avatar.png'}
          alt={user?.full_name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="text-slate-200 font-medium">{user?.full_name}</div>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full bg-slate-700 text-slate-200 rounded-lg p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {mediaPreview && (
          <div className="mt-3 relative">
            <img
              src={mediaPreview}
              alt="Preview"
              className="rounded-lg max-h-60 w-full object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setMedia(null);
                setMediaPreview('');
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        {error && (
          <div className="mt-3 text-red-500 text-sm">{error}</div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <label className="cursor-pointer text-slate-300 hover:text-blue-500 transition-colors">
            <PhotoIcon className="h-6 w-6" />
            <input
              type="file"
              accept="image/*"
              onChange={handleMediaChange}
              className="hidden"
            />
          </label>

          <button
            type="submit"
            disabled={loading || (!content.trim() && !media)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
