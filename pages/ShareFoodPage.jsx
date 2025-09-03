import React from "react";
import Button from "../components/common/Button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, useFoodListings } from "../utils/hooks/useSupabase";
import { reportError } from "../utils/helpers";
import FoodForm from "../components/food/FoodForm";
import ErrorBoundary from "../components/common/ErrorBoundary";
import dataService from '../utils/dataService';

function ShareFoodPageContent() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user: authUser, isAuthenticated } = useAuth();
    const { createListing, updateListing, listings } = useFoodListings({}, 100); // Limit to 100 listings
    const searchParams = new URLSearchParams(location.search);
    const [activeTab, setActiveTab] = React.useState('individual');
    const [loading, setLoading] = React.useState(false);
    const [initialData, setInitialData] = React.useState(null);
    const [isEditing, setIsEditing] = React.useState(false);

    React.useEffect(() => {
        // Check if we're editing an existing listing
        const editId = searchParams.get('edit');
        if (editId && listings.length > 0) {
            const listing = listings.find(l => l.id === parseInt(editId));
            if (listing) {
                setInitialData(listing);
                setIsEditing(true);
            }
        }
    }, [searchParams, listings]);

    const handleSubmit = async (formData) => {
        setLoading(true);
        try {
            if (!authUser || !isAuthenticated) {
                throw new Error('User not authenticated');
            }

            let imageUrl = formData.image_url || null;

            // If there's a new image file, upload it first
            if (formData.image && typeof formData.image !== 'string') {
                const { success, url } = await dataService.uploadFile(formData.image, 'food-images');
                if (!success) {
                    throw new Error('Failed to upload image');
                }
                imageUrl = url;
            }

            const listingData = {
                ...formData,
                user_id: authUser.id,
                status: 'pending',
                image_url: imageUrl,
            };
            delete listingData.image; // Remove the file object

            if (isEditing && initialData) {
                // Update existing listing
                await updateListing(initialData.id, listingData);
            } else {
                // Create new listing
                await createListing(listingData);
            }

            // Redirect to profile page
            navigate('/profile');
        } catch (error) {
            console.error('Create/update listing error:', error);
            reportError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Impact based on claimed food
    const [impact, setImpact] = React.useState({
        foodWasteReduced: 0,
        neighborsHelped: 0,
        people: 0,
        schoolStaff: 0,
        students: 0
    });

    React.useEffect(() => {
        async function fetchClaimImpact() {
            try {
                // Fetch approved claims and their food quantities and impact data
                const { data: claims, error } = await dataService.supabase
                    .from('food_claims')
                    .select('food_id, members_count, people, school_staff, students, food_listings(quantity)')
                    .eq('status', 'approved');
                if (error || !claims) return;
                // Sum quantities from claimed food
                const foodWasteReduced = claims.reduce((sum, claim) => sum + (claim.food_listings?.quantity || 0), 0);
                const neighborsHelped = claims.length;
                const people = claims.reduce((sum, claim) => sum + (claim.people || 0), 0);
                const schoolStaff = claims.reduce((sum, claim) => sum + (claim.school_staff || 0), 0);
                const students = claims.reduce((sum, claim) => sum + (claim.students || 0), 0);
                setImpact({ foodWasteReduced, neighborsHelped, people, schoolStaff, students });
            } catch (err) {
                setImpact({ foodWasteReduced: 0, neighborsHelped: 0, people: 0, schoolStaff: 0, students: 0 });
            }
        }
        fetchClaimImpact();
    }, []);

    return (
        <div data-name="share-food-page" className="max-w-4xl mx-auto py-10 px-4">
            <div className="mb-4 flex justify-end">
                <Button onClick={() => navigate('/find')} variant="secondary" className="mr-2">Find Food</Button>
            </div>
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold text-green-700 drop-shadow-sm mb-2">{isEditing ? 'Edit Listing' : 'Share Food'}</h1>
                <p className="mt-2 text-lg text-gray-600">
                    {isEditing
                        ? 'Update your food listing information.'
                        : 'Share your surplus food with families and organizations in need. All donations are reviewed and must be approved.'}
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                {!isEditing && (
                    <div className="border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
                        <nav className="flex justify-center" role="tablist">
                            <button
                                onClick={() => setActiveTab('individual')}
                                className={`px-6 py-4 text-center w-1/2 font-semibold text-base border-b-2 transition-colors duration-200 focus:outline-none ${
                                    activeTab === 'individual'
                                        ? 'border-green-500 text-green-700 bg-white shadow-sm'
                                        : 'border-transparent text-gray-500 hover:text-green-600 hover:border-green-300 bg-green-50'
                                }`}
                                role="tab"
                                aria-selected={activeTab === 'individual'}
                                aria-controls="individual-panel"
                            >
                                <i className="fas fa-utensils mr-2" aria-hidden="true"></i>
                                Individual/Organization Donation
                            </button>
                        </nav>
                    </div>
                )}

                <div className="p-8 md:p-10">
                    <div
                        role="tabpanel"
                        id="individual-panel"
                        aria-labelledby="individual-tab"
                        hidden={!isEditing && activeTab !== 'individual'}
                    >
                        {(isEditing || activeTab === 'individual') && (
                            <FoodForm
                                initialData={initialData}
                                onSubmit={handleSubmit}
                                loading={loading}
                            />
                        )}
                    </div>
                </div>
                {/* Impact Section */}
                <div className="border-t border-gray-200 mt-8 pt-8 bg-gradient-to-r from-green-50 to-green-100 rounded-b-2xl">
                    <h2 className="text-2xl font-bold text-green-700 mb-4 text-center">Impact Made</h2>
                    <div className="flex flex-col md:flex-row justify-center items-center gap-8">
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-extrabold text-green-600">{impact.foodWasteReduced} lb</span>
                            <span className="text-lg text-gray-700 mt-2">Food Waste Reduced</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-extrabold text-green-600">{impact.neighborsHelped}</span>
                            <span className="text-lg text-gray-700 mt-2">Neighbors Helped</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-extrabold text-green-600">{impact.people}</span>
                            <span className="text-lg text-gray-700 mt-2">People</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-extrabold text-green-600">{impact.schoolStaff}</span>
                            <span className="text-lg text-gray-700 mt-2">School Staff</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-extrabold text-green-600">{impact.students}</span>
                            <span className="text-lg text-gray-700 mt-2">Students</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ShareFoodPage() {
    return (
        <ErrorBoundary>
            <ShareFoodPageContent />
        </ErrorBoundary>
    );
}

export default ShareFoodPage;
