import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsAPI } from '../../services/jobsApi';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    job_type: '',
    experience_level: '',
    location: '',
    search: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await jobsAPI.getJobs(filters);
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search jobs by title, company, or description..."
                className="w-full bg-slate-700 text-slate-200 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="mb-8 bg-slate-800 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            name="job_type"
            value={filters.job_type}
            onChange={handleFilterChange}
            className="bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Job Types</option>
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>

          <select
            name="experience_level"
            value={filters.experience_level}
            onChange={handleFilterChange}
            className="bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Experience Levels</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
            <option value="lead">Lead</option>
            <option value="manager">Manager</option>
          </select>

          <input
            type="text"
            name="location"
            value={filters.location}
            onChange={handleFilterChange}
            placeholder="Location"
            className="bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Create Job Button (for alumni) */}
      {user?.user_type === 'ALUMNI' && (
        <Link
          to="/jobs/create"
          className="inline-block mb-8 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Post a Job
        </Link>
      )}

      {/* Job List */}
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center text-slate-400">
          No jobs found matching your criteria
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {jobs.map(job => (
            <div
              key={job.id}
              className="block bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <Link
                    to={`/jobs/${job.id}`}
                    className="text-xl font-semibold text-slate-200 mb-2 hover:text-blue-400"
                  >
                    {job.title}
                  </Link>
                  <p className="text-slate-400 mb-2">{job.company}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-sm">
                      {job.job_type}
                    </span>
                    <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-sm">
                      {job.experience_level}
                    </span>
                    <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-sm">
                      {job.location}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-slate-400">
                  Posted {format(new Date(job.created_at), 'MMM d, yyyy')}
                </div>
              </div>
              <p className="text-slate-300 line-clamp-2 mb-4">{job.description}</p>
              <div className="flex justify-end">
                <a
                  href={job.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Now
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobList; 