import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiPencil, HiTrash, HiEye, HiClock, HiMapPin } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Loader from "./Loader";
import EmptyState from "./EmptyState";

export default function MyListings() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState({});
    const [showDeleteModal, setShowDeleteModal] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(null);
    
    const { isAuthenticated } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/marketplace');
            return;
        }
        fetchMyListings();
    }, [isAuthenticated, navigate]);

    const fetchMyListings = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/marketplace/listings?seller=me', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch listings');
            }
            
            const data = await response.json();
            
            if (data.success) {
                setListings(data.listings || []);
            } else {
                throw new Error(data.message || 'Failed to fetch listings');
            }
        } catch (err) {
            console.error('Error fetching listings:', err);
            setError(err.message);
            // Show mock data for demonstration
            setListings([
                {
                    _id: 'mock-1',
                    title: 'Sample Listing 1',
                    description: 'This is a sample listing for demonstration purposes.',
                    price: 15000,
                    condition: 'good',
                    location: 'Mumbai, Maharashtra',
                    images: [],
                    status: 'active',
                    views: 25,
                    createdAt: new Date().toISOString(),
                    category: 'electronics'
                },
                {
                    _id: 'mock-2',
                    title: 'Sample Listing 2',
                    description: 'Another sample listing to show the interface.',
                    price: 8500,
                    condition: 'like-new',
                    location: 'Delhi, India',
                    images: [],
                    status: 'sold',
                    views: 42,
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    category: 'furniture'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (listing) => {
        navigate(`/marketplace/edit/${listing._id}`);
    };

    const handleView = (listing) => {
        navigate(`/marketplace/listing/${listing._id}`);
    };

    const handleDelete = async (listingId) => {
        try {
            setActionLoading(prev => ({ ...prev, [listingId]: 'deleting' }));
            
            const response = await fetch(`/api/marketplace/listings/${listingId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete listing');
            }
            
            // Remove from local state
            setListings(prev => prev.filter(listing => listing._id !== listingId));
            showSuccess('Listing deleted successfully');
            setShowDeleteModal(null);
        } catch (err) {
            console.error('Error deleting listing:', err);
            showError(err.message || 'Failed to delete listing');
        } finally {
            setActionLoading(prev => ({ ...prev, [listingId]: null }));
        }
    };

    const handleStatusChange = async (listingId, newStatus) => {
        try {
            setActionLoading(prev => ({ ...prev, [listingId]: 'updating' }));
            
            const response = await fetch(`/api/marketplace/listings/${listingId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update listing status');
            }
            
            const data = await response.json();
            
            // Update local state
            setListings(prev => prev.map(listing => 
                listing._id === listingId 
                    ? { ...listing, status: newStatus }
                    : listing
            ));
            
            showSuccess(`Listing marked as ${newStatus}`);
            setShowStatusModal(null);
        } catch (err) {
            console.error('Error updating status:', err);
            showError(err.message || 'Failed to update listing status');
        } finally {
            setActionLoading(prev => ({ ...prev, [listingId]: null }));
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            'active': 'bg-green-100 text-green-800',
            'sold': 'bg-blue-100 text-blue-800',
            'inactive': 'bg-gray-100 text-gray-800',
            'flagged': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getConditionColor = (condition) => {
        const colors = {
            'new': 'bg-green-100 text-green-800',
            'like-new': 'bg-blue-100 text-blue-800',
            'good': 'bg-yellow-100 text-yellow-800',
            'fair': 'bg-orange-100 text-orange-800',
            'poor': 'bg-red-100 text-red-800'
        };
        return colors[condition] || 'bg-gray-100 text-gray-800';
    };

    const formatCondition = (condition) => {
        return condition.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
                    <p className="text-gray-600 mt-2">Manage your marketplace listings</p>
                </div>
                <Loader />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
                    <p className="text-gray-600 mt-2">
                        Manage your marketplace listings ({listings.length} total)
                    </p>
                </div>
                <button
                    onClick={() => navigate('/marketplace/create')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                >
                    Post New Item
                </button>
            </div>

            {/* Error Notice */}
            {error && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-yellow-800">
                        <strong>Demo Mode:</strong> Unable to load real listing data. Showing sample content for demonstration.
                    </div>
                    <div className="text-sm text-yellow-700 mt-1">
                        Error: {error}
                    </div>
                </div>
            )}

            {/* Listings */}
            {listings.length === 0 ? (
                <EmptyState
                    title="No listings yet"
                    description="You haven't posted any items for sale. Create your first listing to get started!"
                    actionText="Post Your First Item"
                    onAction={() => navigate('/marketplace/create')}
                />
            ) : (
                <div className="space-y-4">
                    {listings.map((listing) => (
                        <div
                            key={listing._id}
                            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start space-x-4">
                                {/* Image */}
                                <div className="flex-shrink-0">
                                    {listing.images && listing.images.length > 0 ? (
                                        <img
                                            src={listing.images[0]}
                                            alt={listing.title}
                                            className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                            <span className="text-gray-400 text-xs">No Image</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                {listing.title}
                                            </h3>
                                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                                {listing.description}
                                            </p>
                                        </div>
                                        
                                        {/* Price and Status */}
                                        <div className="flex flex-col items-end space-y-2 ml-4">
                                            <span className="text-xl font-bold text-gray-900">
                                                {formatPrice(listing.price)}
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}>
                                                {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Meta Information */}
                                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <HiMapPin className="h-4 w-4 mr-1" />
                                            <span>{listing.location}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <HiClock className="h-4 w-4 mr-1" />
                                            <span>Posted {formatDate(listing.createdAt)}</span>
                                        </div>
                                        {listing.views && (
                                            <div className="flex items-center">
                                                <HiEye className="h-4 w-4 mr-1" />
                                                <span>{listing.views} views</span>
                                            </div>
                                        )}
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(listing.condition)}`}>
                                            {formatCondition(listing.condition)}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center space-x-3 mt-4">
                                        <button
                                            onClick={() => handleView(listing)}
                                            className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            <HiEye className="h-4 w-4 mr-1" />
                                            View
                                        </button>
                                        
                                        <button
                                            onClick={() => handleEdit(listing)}
                                            disabled={actionLoading[listing._id]}
                                            className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                                        >
                                            <HiPencil className="h-4 w-4 mr-1" />
                                            Edit
                                        </button>

                                        {listing.status === 'active' && (
                                            <button
                                                onClick={() => setShowStatusModal({ listing, newStatus: 'sold' })}
                                                disabled={actionLoading[listing._id]}
                                                className="inline-flex items-center px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                                            >
                                                Mark as Sold
                                            </button>
                                        )}

                                        {listing.status === 'active' && (
                                            <button
                                                onClick={() => setShowStatusModal({ listing, newStatus: 'inactive' })}
                                                disabled={actionLoading[listing._id]}
                                                className="inline-flex items-center px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50"
                                            >
                                                Deactivate
                                            </button>
                                        )}

                                        {listing.status === 'inactive' && (
                                            <button
                                                onClick={() => setShowStatusModal({ listing, newStatus: 'active' })}
                                                disabled={actionLoading[listing._id]}
                                                className="inline-flex items-center px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                                            >
                                                Reactivate
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setShowDeleteModal(listing)}
                                            disabled={actionLoading[listing._id]}
                                            className="inline-flex items-center px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                                        >
                                            <HiTrash className="h-4 w-4 mr-1" />
                                            Delete
                                        </button>

                                        {actionLoading[listing._id] && (
                                            <span className="text-sm text-gray-500">
                                                {actionLoading[listing._id]}...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Delete Listing
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete &quot;{showDeleteModal.title}&quot;? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(null)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(showDeleteModal._id)}
                                disabled={actionLoading[showDeleteModal._id]}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {actionLoading[showDeleteModal._id] ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Change Confirmation Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Change Listing Status
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to mark &quot;{showStatusModal.listing.title}&quot; as {showStatusModal.newStatus}?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowStatusModal(null)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleStatusChange(showStatusModal.listing._id, showStatusModal.newStatus)}
                                disabled={actionLoading[showStatusModal.listing._id]}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {actionLoading[showStatusModal.listing._id] ? 'Updating...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}