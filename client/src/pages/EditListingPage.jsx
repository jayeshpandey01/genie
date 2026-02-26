import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import MarketplaceLayout from "../components/MarketplaceLayout";
import ListingForm from "../components/ListingForm";
import Loader from "../components/Loader";

export default function EditListingPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { showError } = useToast();
    
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/marketplace');
            return;
        }
        
        if (id) {
            fetchListing();
        }
    }, [id, isAuthenticated, navigate]);

    const fetchListing = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`/api/marketplace/listings/${id}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Listing not found');
                } else if (response.status === 403) {
                    throw new Error('You can only edit your own listings');
                } else {
                    throw new Error('Failed to fetch listing');
                }
            }
            
            const data = await response.json();
            
            if (data.success && data.listing) {
                // Check if user owns this listing
                if (data.listing.seller._id !== user._id) {
                    throw new Error('You can only edit your own listings');
                }
                setListing(data.listing);
            } else {
                throw new Error(data.message || 'Failed to fetch listing');
            }
        } catch (err) {
            console.error('Error fetching listing:', err);
            setError(err.message);
            showError(err.message);
            
            // For demonstration, show mock data
            if (err.message.includes('Failed to fetch')) {
                setListing({
                    _id: id,
                    title: 'Sample Listing for Editing',
                    description: 'This is a sample listing being edited for demonstration purposes.',
                    price: 15000,
                    condition: 'good',
                    location: 'Mumbai, Maharashtra',
                    images: [],
                    category: 'electronics',
                    status: 'active',
                    seller: {
                        _id: user?._id || 'mock-user',
                        first_name: user?.first_name || 'Demo',
                        last_name: user?.last_name || 'User'
                    }
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (updatedListing) => {
        // Navigate to the updated listing
        navigate(`/marketplace/listing/${updatedListing._id}`);
    };

    const handleCancel = () => {
        navigate(`/marketplace/listing/${id}`);
    };

    if (!isAuthenticated) {
        return null;
    }

    if (loading) {
        return (
            <MarketplaceLayout showFilters={false}>
                <div className="max-w-4xl mx-auto">
                    <div className="text-center py-12">
                        <Loader />
                        <p className="text-gray-600 mt-4">Loading listing...</p>
                    </div>
                </div>
            </MarketplaceLayout>
        );
    }

    if (error && !listing) {
        return (
            <MarketplaceLayout showFilters={false}>
                <div className="max-w-4xl mx-auto">
                    <div className="text-center py-12">
                        <div className="text-red-600 text-lg font-semibold mb-2">
                            Error Loading Listing
                        </div>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <div className="space-x-4">
                            <button
                                onClick={fetchListing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => navigate('/marketplace/my-listings')}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Back to My Listings
                            </button>
                        </div>
                    </div>
                </div>
            </MarketplaceLayout>
        );
    }

    return (
        <MarketplaceLayout showFilters={false}>
            <div className="max-w-4xl mx-auto">
                {/* Demo Notice */}
                {error && listing && (
                    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="text-yellow-800">
                            <strong>Demo Mode:</strong> Unable to load real listing data. Showing sample content for demonstration.
                        </div>
                        <div className="text-sm text-yellow-700 mt-1">
                            Error: {error}
                        </div>
                    </div>
                )}
                
                <ListingForm 
                    listing={listing}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                />
            </div>
        </MarketplaceLayout>
    );
}