import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  if (!isAdmin) {
    navigate('/');
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-slate-200 mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Events Management Card */}
        <div className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition">
          <h2 className="text-xl font-semibold text-slate-200 mb-4">Events</h2>
          <p className="text-slate-400 mb-4">Create and manage alumni events</p>
          <button
            onClick={() => navigate('/admin/events')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Manage Events
          </button>
        </div>

        {/* Donations Management Card */}
        <div className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition">
          <h2 className="text-xl font-semibold text-slate-200 mb-4">Donations</h2>
          <p className="text-slate-400 mb-4">Manage donation campaigns</p>
          <button
            onClick={() => navigate('/admin/donations')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Manage Donations
          </button>
        </div>

        {/* User Management Card */}
        <div className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition">
          <h2 className="text-xl font-semibold text-slate-200 mb-4">Users</h2>
          <p className="text-slate-400 mb-4">Manage user accounts and roles</p>
          <button
            onClick={() => navigate('/admin/users')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Manage Users
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
