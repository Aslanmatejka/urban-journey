import React, { useEffect, useState } from 'react';
import Button from '../common/Button';
import dataService from '../../utils/dataService';

function AdminDashboard() {
  const [pendingListings, setPendingListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionStatus, setActionStatus] = useState({});

  useEffect(() => {
    fetchPendingListings();
  }, []);

  async function fetchPendingListings() {
    setLoading(true);
    setError(null);
    try {
      const listings = await dataService.getFoodListings({ status: 'pending' });
      setPendingListings(listings);
    } catch (err) {
      setError('Failed to fetch pending listings.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(listingId, approve) {
    setActionStatus({ ...actionStatus, [listingId]: 'loading' });
    try {
      await dataService.updateFoodListingStatus(listingId, approve ? 'approved' : 'declined');
      setActionStatus({ ...actionStatus, [listingId]: approve ? 'approved' : 'declined' });
      // Optionally send notification to user if declined
      if (!approve) {
        await dataService.sendDeclineNotification(listingId);
      }
      // Refresh list
      fetchPendingListings();
    } catch (err) {
      setActionStatus({ ...actionStatus, [listingId]: 'error' });
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard: Pending Food Submissions</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <div className="space-y-6">
        {pendingListings.length === 0 && !loading ? (
          <div className="text-gray-600">No pending submissions.</div>
        ) : (
          pendingListings.map(listing => (
            <div key={listing.id} className="bg-white rounded shadow p-6 border">
              <div className="font-bold text-lg mb-2">{listing.title}</div>
              <div className="mb-2">{listing.description}</div>
              <img src={listing.image_url} alt={listing.title} className="w-32 h-32 object-cover mb-2" />
              <div className="mb-2">Donor: {listing.donor?.name || 'N/A'}</div>
              <div className="flex gap-4 mt-4">
                <Button variant="success" onClick={() => handleReview(listing.id, true)} disabled={actionStatus[listing.id] === 'loading'}>
                  Approve
                </Button>
                <Button variant="danger" onClick={() => handleReview(listing.id, false)} disabled={actionStatus[listing.id] === 'loading'}>
                  Decline
                </Button>
                {actionStatus[listing.id] === 'approved' && <span className="text-green-600 ml-2">Approved</span>}
                {actionStatus[listing.id] === 'declined' && <span className="text-red-600 ml-2">Declined</span>}
                {actionStatus[listing.id] === 'error' && <span className="text-red-600 ml-2">Error</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
