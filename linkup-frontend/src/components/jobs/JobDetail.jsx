import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsAPI } from '../../services/jobsApi';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getJob(id);
      setJob(response.data);
    } catch (error) {
      console.error('Failed to fetch job:', error);
      toast.error('Failed to load job details');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    window.open(job.application_url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-slate-800 rounded-lg p-8">
        {/* Job Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-200 mb-4">{job.title}</h1>
          <div className="flex flex-wrap gap-4 text-slate-400 mb-4">
            <span>{job.company}</span>
            <span>•</span>
            <span>{job.location}</span>
            <span>•</span>
            <span>{job.job_type}</span>
            <span>•</span>
            <span>{job.experience_level}</span>
          </div>
          {job.salary_range && (
            <p className="text-slate-300 mb-4">
              Salary Range: {job.salary_range}
            </p>
          )}
          <p className="text-sm text-slate-400">
            Posted on {format(new Date(job.created_at), 'MMMM d, yyyy')}
          </p>
        </div>

        {/* Job Description */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-200 mb-4">Description</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 whitespace-pre-wrap">{job.description}</p>
          </div>
        </div>

        {/* Job Requirements */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-200 mb-4">Requirements</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 whitespace-pre-wrap">{job.requirements}</p>
          </div>
        </div>

        {/* Apply Button */}
        {user && user.user_type !== 'ALUMNI' && (
          <div className="mt-8 pt-8 border-t border-slate-700">
            <button
              onClick={handleApply}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply on Company Website
            </button>
            <p className="text-sm text-slate-400 text-center mt-2">
              You will be redirected to the company's job application portal
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetail; 