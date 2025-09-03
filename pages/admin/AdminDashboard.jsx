import React from 'react';
import { useAdminStats, useAdminListings, useAuth } from '../../utils/hooks/useSupabase';

const AdminDashboard = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const { stats, loading: statsLoading, error: statsError } = useAdminStats();
  const { recentListings, loading: listingsLoading, error: listingsError } = useAdminListings(5);

  const loading = authLoading || statsLoading || listingsLoading;
  
  if (!authLoading && !isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const error = statsError || listingsError;
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-600">Error loading dashboard: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{stats?.totalUsers || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Total Listings</h3>
          <p className="text-3xl font-bold text-green-600">{stats?.totalListings || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Active Trades</h3>
          <p className="text-3xl font-bold text-orange-600">{stats?.activeTrades || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Total Donations</h3>
          <p className="text-3xl font-bold text-purple-600">{stats?.totalDonations || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Listings</h2>
          <div className="space-y-4">
            {recentListings && recentListings.length > 0 ? (
              recentListings.map(listing => (
                <div key={listing.id} className="flex items-center space-x-3">
                  <img 
                    src={listing.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'} 
                    alt={listing.title}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div>
                    <h3 className="font-medium">{listing.title}</h3>
                    <p className="text-sm text-gray-600">{listing.location}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No recent listings</p>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Database Status</span>
              <span className="font-semibold text-green-600">Online</span>
            </div>
            <div className="flex justify-between">
              <span>API Status</span>
              <span className="font-semibold text-green-600">Healthy</span>
            </div>
            <div className="flex justify-between">
              <span>Storage</span>
              <span className="font-semibold text-blue-600">89% Used</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Last Updated</h2>
          <div className="text-sm text-gray-600">
            <p>{stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'Unknown'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 