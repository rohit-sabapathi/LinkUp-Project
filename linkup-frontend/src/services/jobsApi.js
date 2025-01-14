import { api } from './api';

export const jobsAPI = {
  // Get all job postings
  getJobs: async (filters = {}) => {
    try {
      const response = await api.get('/jobs/', { params: filters });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }
  },

  // Get a specific job posting
  getJob: (jobId) =>
    api.get(`/jobs/${jobId}/`),

  // Create a new job posting
  createJob: async (jobData) => {
    try {
      const response = await api.post('/jobs/', jobData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  },

  // Update a job posting
  updateJob: async (jobId, jobData) => {
    try {
      const response = await api.patch(`/jobs/${jobId}/`, jobData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  },

  // Delete a job posting
  deleteJob: (jobId) =>
    api.delete(`/jobs/${jobId}/`),

  // Get all applications for a job (for alumni)
  getJobApplications: (jobId) =>
    api.get(`/jobs/${jobId}/applications/`),

  // Get all applications by the current user (for students)
  getMyApplications: () =>
    api.get('/applications/'),

  // Apply for a job
  applyForJob: (jobId, applicationData) =>
    api.post(`/jobs/${jobId}/apply/`, applicationData),

  // Update application status (for alumni)
  updateApplicationStatus: (applicationId, status) =>
    api.post(`/applications/${applicationId}/update_status/`, { status }),
};
