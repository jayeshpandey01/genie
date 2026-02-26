import { useState, useEffect } from "react";
import { HiMapPin, HiClock, HiHeart, HiOutlineHeart, HiPhone, HiEye } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import ImageCarousel from "./ImageCarousel";

export default function ListingDetail({ 
    listingId, 
    onContactSeller, 
    onEdit, 
    onDelete,
    listing: propListing
}) {
    const [listing, setListing] = useState(propListing);
    const [loading, setLoading] = useState(!propListing);
    const [isFavorited, setIsFavorited] = useState(false);
    const [error, setError] = useState(null);
    const { isAuthenticated, user } = useAuth();

    // Fetch listing data if not provided as prop
    useEffect(() => {
        if (!propListing && listingId) {
            fetchListing();
        }
    }, [listingId, propListing]);

    // Mock listing data for demonstration when API fails
    const getMockListing = () => ({
        _id: listingId || 'mock-listing-1',
        title: 'Sample Marketplace Listing',
        description: 'This is a sample listing to demonstrate the marketplace functionality. The actual listing data could not be loaded from the server.',
        price: 25000,
        condition: 'good',
        location: 'Mumbai, Maharashtra',
        images: [],
        seller: {
            _id: 'mock-seller',
            first_name: 'Rajesh',
            last_name: 'Kumar',
            phone: '+91 98765 43210'
        },
        createdAt: new Date().toISOString(),
        category: 'electronics',
        status: 'active',
        views: 42
    });
    const fetchListing = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`/api/marketplace/listings/${listingId}`);
            
            // Check if response is HTML (error page) instead of JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Server returned ${response.status}: Expected JSON but received ${contentType || 'unknown content type'}`);
            }
            
            if (!response.ok) {
                // Try to parse error response
                let errorMessage = 'Failed to fetch listing';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (parseError) {
                    errorMessage = `Server error (${response.status}): ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            
            // Validate response structure
            if (!data.success || !data.listing) {
                throw new Error('Invalid response format from server');
            }
            
            setListing(data.listing);
        } catch (err) {
            console.error('Error fetching listing:', err);
            
            // Provide more specific error messages
            let userFriendlyError = err.message;
            if (err.message.includes('Failed to fetch')) {
                userFriendlyError = 'Unable to connect to server. Please check your internet connection.';
            } else if (err.message.includes('Unexpected token')) {
                userFriendlyError = 'Server error: Received invalid response format.';
            } else if (err.message.includes('404')) {
                userFriendlyError = 'Listing not found or may have been removed.';
            } else if (err.message.includes('500')) {
                userFriendlyError = 'Server error. Please try again later.';
            }
            
            setError(userFriendlyError);
            
            // Fallback to mock data for demonstration purposes
            console.log('Using mock data for demonstration');
            setListing(getMockListing());
        } finally {
            setLoading(false);
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
            month: 'long',
            day: 'numeric'
        });
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

    const handleFavoriteClick = async () => {
        try {
            const response = await fetch(`/api/marketplace/listings/${listing._id}/favorite`, {
                method: isFavorited ? 'DELETE' : 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setIsFavorited(!isFavorited);
            }
        } catch (err) {
            console.error('Error updating favorite status:', err);
        }
    };

    const handleContactSeller = () => {
        if (onContactSeller) {
            onContactSeller(listing);
        }
    };

    const handleEdit = () => {
        if (onEdit) {
            onEdit(listing);
        }
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete(listing._id);
        }
    };

    // Check if current user is the seller
    const isOwner = user && listing && user._id === listing.seller._id;

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Image skeleton */}
                    <div className="space-y-4">
                        <div className="aspect-square bg-gray-200 rounded-lg"></div>
                        <div className="flex space-x-2">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Content skeleton */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                        </div>
                        <div className="space-y-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-4 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                        <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !listing) {
        return (
            <div className="text-center py-12">
                <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Listing</div>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                    onClick={fetchListing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h2>
                <p className="text-gray-600">The listing you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* API Error Notice */}
            {error && listing && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <div className="text-yellow-800">
                            <strong>Demo Mode:</strong> Unable to load real listing data. Showing sample content for demonstration.
                        </div>
                    </div>
                    <div className="text-sm text-yellow-700 mt-1">
                        Error: {error}
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image Gallery */}
                <div className="space-y-4">
                    <ImageCarousel
                        images={listing.images || []}
                        alt={listing.title}
                        showThumbnails={true}
                        className="w-full"
                    />
                </div>

                {/* Listing Details */}
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <div className="flex items-start justify-between mb-4">
                            <h1 className="text-3xl font-bold text-gray-900 pr-4">{listing.title}</h1>
                            <div className="flex items-center space-x-2">
                                {/* Favorite Button - only show for authenticated non-owners */}
                                {isAuthenticated && !isOwner && (
                                    <button
                                        onClick={handleFavoriteClick}
                                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                                        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                                    >
                                        {isFavorited ? (
                                            <HiHeart className="h-6 w-6 text-red-500" />
                                        ) : (
                                            <HiOutlineHeart className="h-6 w-6 text-gray-600" />
                                        )}
                                    </button>
                                )}
                                
                                {/* Owner Actions */}
                                {isOwner && (
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={handleEdit}
                                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 mb-4">
                            <span className="text-4xl font-bold text-blue-600">
                                {formatPrice(listing.price)}
                            </span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(listing.condition)}`}>
                                {formatCondition(listing.condition)}
                            </span>
                        </div>

                        <div className="flex items-center space-x-6 text-gray-600 flex-wrap gap-2">
                            <div className="flex items-center">
                                <HiMapPin className="h-5 w-5 mr-1 flex-shrink-0" />
                                <span>{listing.location}</span>
                            </div>
                            <div className="flex items-center">
                                <HiClock className="h-5 w-5 mr-1 flex-shrink-0" />
                                <span>Posted {formatDate(listing.createdAt)}</span>
                            </div>
                            {listing.views && (
                                <div className="flex items-center text-sm">
                                    <HiEye className="h-4 w-4 mr-1" />
                                    <span>{listing.views} views</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
                        <div className="prose prose-gray max-w-none">
                            <p className="whitespace-pre-line text-gray-700 leading-relaxed">
                                {listing.description}
                            </p>
                        </div>
                    </div>

                    {/* Seller Information */}
                    {listing.seller && (
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Seller Information</h2>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-gray-600">Seller: </span>
                                    <span className="font-medium text-gray-900">
                                        {listing.seller.first_name} {listing.seller.last_name}
                                    </span>
                                </div>
                                
                                {listing.seller.phone && (
                                    <div className="flex items-center text-gray-600">
                                        <HiPhone className="h-5 w-5 mr-2" />
                                        <span>{listing.seller.phone}</span>
                                    </div>
                                )}

                                {/* Seller Stats */}
                                {listing.seller.marketplaceProfile && (
                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                        {listing.seller.marketplaceProfile.totalListings > 0 && (
                                            <span>{listing.seller.marketplaceProfile.totalListings} listings</span>
                                        )}
                                        {listing.seller.marketplaceProfile.rating > 0 && (
                                            <span>⭐ {listing.seller.marketplaceProfile.rating.toFixed(1)}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Contact Button - only show for authenticated non-owners */}
                    {isAuthenticated && !isOwner && (
                        <div className="space-y-3">
                            <button
                                onClick={handleContactSeller}
                                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-semibold text-lg"
                            >
                                Contact Seller
                            </button>
                            <p className="text-sm text-gray-500 text-center">
                                Always meet in a safe, public location when buying or selling items. Prefer cash transactions and verify items before payment.
                            </p>
                        </div>
                    )}

                    {/* Login prompt for unauthenticated users */}
                    {!isAuthenticated && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                            <p className="text-blue-800 mb-3">
                                Please log in to contact the seller or save this listing.
                            </p>
                            <div className="space-x-3">
                                <button
                                    onClick={() => {
                                        const loginEvent = new CustomEvent('openLogin');
                                        window.dispatchEvent(loginEvent);
                                    }}
                                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Log In
                                </button>
                                <button
                                    onClick={() => {
                                        const registerEvent = new CustomEvent('openRegister');
                                        window.dispatchEvent(registerEvent);
                                    }}
                                    className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Sign Up
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Status indicator for owners */}
                    {isOwner && listing.status && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <span className="text-yellow-800 font-medium">
                                    Status: {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}