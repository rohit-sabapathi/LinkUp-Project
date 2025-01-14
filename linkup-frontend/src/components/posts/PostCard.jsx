import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { HeartIcon, ChatBubbleLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { postsAPI } from '../../services/postsApi';

const PostCard = ({ post, onPostUpdate }) => {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);

  if (!post || !post.author) {
    return null;
  }

  const hasLiked = post.likes?.includes(user?.id);

  const handleLike = async () => {
    if (isLiking || !user) return;

    try {
      setIsLiking(true);
      const updatedPost = {
        ...post,
        likes: hasLiked 
          ? post.likes.filter(id => id !== user.id)
          : [...(post.likes || []), user.id],
        like_count: hasLiked ? (post.like_count - 1) : (post.like_count + 1)
      };
      onPostUpdate(updatedPost);
      const response = await postsAPI.likePost(post.id);
      onPostUpdate(response.data);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      onPostUpdate(post); // Revert on error
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentClick = async () => {
    if (!showComments) {
      try {
        setIsLoadingComments(true);
        const response = await postsAPI.getComments(post.id);
        setComments(response.data);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      } finally {
        setIsLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isPostingComment) return;

    try {
      setIsPostingComment(true);
      const response = await postsAPI.addComment(post.id, newComment);
      setComments([...comments, response.data]);
      setNewComment('');
      onPostUpdate({ ...post, comment_count: (post.comment_count || 0) + 1 });
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsPostingComment(false);
    }
  };

  const displayName = post.author.full_name || post.author.email || 'Anonymous';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="bg-slate-800 rounded-lg p-4 shadow-lg">
      {/* Post Header */}
      <div className="flex items-center mb-4">
        <Link 
          to={`/profile/${post.author.id}`}
          className="flex items-center hover:text-blue-500 transition-colors"
        >
          {post.author.profile_photo ? (
            <img 
              src={post.author.profile_photo} 
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover mr-3"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center mr-3">
              <span className="text-lg font-medium text-slate-200">
                {initial}
              </span>
            </div>
          )}
          <div>
            <h3 className="font-medium text-slate-200">{displayName}</h3>
            <p className="text-sm text-slate-400">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </Link>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-slate-200 whitespace-pre-wrap">{post.content}</p>
        {post.media && (
          <img 
            src={post.media} 
            alt="Post content" 
            className="mt-3 rounded-lg max-h-96 w-full object-cover"
          />
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center space-x-4 mt-4">
        <button
          onClick={handleLike}
          disabled={isLiking || !user}
          className={`flex items-center space-x-1 text-sm ${
            hasLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
          } transition-colors disabled:opacity-50`}
        >
          {hasLiked ? (
            <HeartIconSolid className="w-6 h-6" />
          ) : (
            <HeartIcon className="w-6 h-6" />
          )}
          <span>{post.like_count || 0}</span>
        </button>

        <button
          onClick={handleCommentClick}
          className="flex items-center space-x-1 hover:text-blue-500 transition-colors"
        >
          <ChatBubbleLeftIcon className="h-6 w-6" />
          <span>{post.comment_count || 0}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 space-y-4">
          {isLoadingComments ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-slate-700 rounded p-3">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center mr-2">
                        <span className="text-sm font-medium text-slate-200">
                          {comment.author.full_name?.[0] || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">
                          {comment.author.full_name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <p className="text-slate-300">{comment.content}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={isPostingComment || !newComment.trim()}
                  className={`p-2 rounded-lg ${
                    isPostingComment || !newComment.trim()
                      ? 'bg-slate-700 text-slate-500'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } transition-colors`}
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;
