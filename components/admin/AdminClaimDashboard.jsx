import React, { useEffect, useState } from 'react';
import Button from '../common/Button';
import dataService from '../../utils/dataService';

function AdminClaimDashboard() {
  const [pendingClaims, setPendingClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionStatus, setActionStatus] = useState({});

  useEffect(() => {
    fetchPendingClaims();
  }, []);

  async function fetchPendingClaims() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await dataService.supabase
        .from('food_claims')
        .select('*, food_listings(title, description, image_url)')
        .eq('status', 'pending');
      if (error) throw error;
      setPendingClaims(data);
    } catch (err) {
      setError('Failed to fetch pending claims.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(claimId, approve) {
    setActionStatus({ ...actionStatus, [claimId]: 'loading' });
    try {
      await dataService.updateFoodClaimStatus(claimId, approve ? 'approved' : 'declined');
      setActionStatus({ ...actionStatus, [claimId]: approve ? 'approved' : 'declined' });
      // Refresh list
      fetchPendingClaims();
    } catch (err) {
      setActionStatus({ ...actionStatus, [claimId]: 'error' });
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard: Pending Food Claims</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <div className="space-y-6">
        {pendingClaims.length === 0 && !loading ? (
          <div className="text-gray-600">No pending claims.</div>
        ) : (
          pendingClaims.map(claim => (
            <div key={claim.id} className="bg-white rounded shadow p-6 border">
              <div className="font-bold text-lg mb-2">{claim.food_listings?.title || 'Food Item'}</div>
              <div className="mb-2">{claim.food_listings?.description}</div>
              <img src={claim.food_listings?.image_url} alt={claim.food_listings?.title} className="w-32 h-32 object-cover mb-2" />
              <div className="mb-2">Claimer: {claim.requester_name}</div>
              <div className="mb-2">Email: {claim.requester_email}</div>
              <div className="mb-2">Phone: {claim.requester_phone}</div>
              <div className="mb-2">Members: {claim.members_count}</div>
              <div className="mb-2">Pickup/Dropoff: {claim.pickup_time || claim.dropoff_time} at {claim.pickup_place || claim.dropoff_place}</div>
              <div className="flex gap-4 mt-4">
                <Button variant="success" onClick={() => handleReview(claim.id, true)} disabled={actionStatus[claim.id] === 'loading'}>
                  Approve
                </Button>
                <Button variant="danger" onClick={() => handleReview(claim.id, false)} disabled={actionStatus[claim.id] === 'loading'}>
                  Decline
                </Button>
                {actionStatus[claim.id] === 'approved' && <span className="text-green-600 ml-2">Approved</span>}
                {actionStatus[claim.id] === 'declined' && <span className="text-red-600 ml-2">Declined</span>}
                {actionStatus[claim.id] === 'error' && <span className="text-red-600 ml-2">Error</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminClaimDashboard;
