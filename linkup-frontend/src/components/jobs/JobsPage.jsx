import { Routes, Route } from 'react-router-dom';
import JobList from './JobList';
import JobDetail from './JobDetail';
import JobForm from './JobForm';

const JobsPage = () => {
  return (
    <Routes>
      <Route index element={<JobList />} />
      <Route path="create" element={<JobForm />} />
      <Route path=":id" element={<JobDetail />} />
      <Route path=":id/edit" element={<JobForm />} />
    </Routes>
  );
};

export default JobsPage;
