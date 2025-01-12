import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobsAPI } from '../../services/jobsApi';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const JobForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState({
    title: '',
    company: '',
    description: '',
    requirements: '',
    location: '',
    job_type: 'full_time',
    experience_level: 'entry',
    salary_range: '',
    deadline: '',
    application_url: '',
  });

  useEffect(() => {
    if (id) {
      fetchJob();
    }
  }, [id]);

  useEffect(() => {
    if (user?.user_type !== 'ALUMNI') {
      toast.error('Only alumni can create job postings');
      navigate('/jobs');
    }
  }, [user]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!job.title || !job.company || !job.description || !job.requirements || !job.location || !job.application_url) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate application URL
    try {
      new URL(job.application_url);
    } catch (error) {
      toast.error('Please enter a valid application URL');
      return;
    }

    try {
      setLoading(true);
      const jobData = {
        ...job,
        deadline: job.deadline ? new Date(job.deadline).toISOString() : null,
      };

      if (id) {
        await jobsAPI.updateJob(id, jobData);
        toast.success('Job posting updated successfully');
      } else {
        await jobsAPI.createJob(jobData);
        toast.success('Job posting created successfully');
      }
      navigate('/jobs');
    } catch (error) {
      console.error('Failed to save job:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.error || 
                          'Failed to save job posting';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setJob(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading && id) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-slate-800 rounded-lg p-8">
        <h1 className="text-2xl font-bold text-slate-200 mb-8">
          {id ? 'Edit Job Posting' : 'Create New Job Posting'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              name="title"
              value={job.title}
              onChange={handleChange}
              className="w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              name="company"
              value={job.company}
              onChange={handleChange}
              className="w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={job.location}
              onChange={handleChange}
              className="w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Application URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Application URL *
              <span className="text-xs text-slate-400 ml-2">
                (Link to your company's job application portal)
              </span>
            </label>
            <input
              type="url"
              name="application_url"
              value={job.application_url}
              onChange={handleChange}
              placeholder="https://careers.yourcompany.com/job/123"
              className="w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Job Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Job Type *
            </label>
            <select
              name="job_type"
              value={job.job_type}
              onChange={handleChange}
              className="w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Experience Level *
            </label>
            <select
              name="experience_level"
              value={job.experience_level}
              onChange={handleChange}
              className="w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="lead">Lead</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          {/* Salary Range */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Salary Range
            </label>
            <input
              type="text"
              name="salary_range"
              value={job.salary_range}
              onChange={handleChange}
              placeholder="e.g., $50,000 - $70,000"
              className="w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Application Deadline
            </label>
            <input
              type="datetime-local"
              name="deadline"
              value={job.deadline}
              onChange={handleChange}
              className="w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Job Description *
            </label>
            <textarea
              name="description"
              value={job.description}
              onChange={handleChange}
              rows={6}
              className="w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Job Requirements *
            </label>
            <textarea
              name="requirements"
              value={job.requirements}
              onChange={handleChange}
              rows={6}
              className="w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/jobs')}
              className="px-6 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (id ? 'Update Job' : 'Create Job')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobForm; 