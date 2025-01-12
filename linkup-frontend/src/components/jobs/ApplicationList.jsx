import { useState, useEffect } from 'react';
import { jobsAPI } from '../../services/jobsApi';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const ApplicationList = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getMyApplications();
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      await jobsAPI.updateApplicationStatus(applicationId, newStatus);
      toast.success('Application status updated');
      fetchApplications();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update application status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'viewed':
        return 'bg-blue-500';
      case 'shortlisted':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-200 mb-8">
        {user?.user_type === 'ALUMNI' ? 'Job Applications Received' : 'My Job Applications'}
      </h1>

      {applications.length === 0 ? (
        <div className="text-center text-slate-400">
          No applications found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {applications.map(application => (
            <div
              key={application.id}
              className="bg-slate-800 rounded-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-200">
                    {application.job.title}
                  </h3>
                  <p className="text-slate-400">{application.job.company}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-3 py-1 rounded-full text-sm text-white ${getStatusColor(application.status)}`}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </span>
                  <span className="text-sm text-slate-400 mt-2">
                    Applied on {format(new Date(application.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>

              {user?.user_type === 'ALUMNI' && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Applicant</h4>
                  <div className="flex items-center space-x-3">
                    {application.applicant.profile_photo ? (
                      <img
                        src={application.applicant.profile_photo}
                        alt={application.applicant.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white">
                        {application.applicant.first_name[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-slate-200">{application.applicant.full_name}</p>
                      <p className="text-sm text-slate-400">{application.applicant.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Cover Letter</h4>
                <p className="text-slate-300 whitespace-pre-wrap">{application.cover_letter}</p>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Resume</h4>
                <a
                  href={application.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  View Resume
                </a>
              </div>

              {user?.user_type === 'ALUMNI' && (
                <div className="mt-6 flex justify-end space-x-4">
                  <select
                    value={application.status}
                    onChange={(e) => handleStatusUpdate(application.id, e.target.value)}
                    className="bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="viewed">Viewed</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationList; 