import { useState, useRef, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import { HiHeart, HiOutlineHeart, HiMapPin, HiClock } from "react-icons/hi2";
import ProgressiveImage from "./ProgressiveImage";
import { ListingCardSkeleton } from "./SkeletonLoaders";

const ListingCard = memo(function ListingCard({ 
    listing, 
    onFavorite, 
    showSellerInfo = true, 
    compact = false 
}) {
    const [isFavorited, setIsFavorited] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const imgRef = useRef(null);
    const cardRef = useRef(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                threshold: 0.1,
                rootMargin: '50px'
            }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const handleFavoriteClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsFavorited(!isFavorited);
        if (onFavorite) {
            onFavorite(listing._id);
        }
    };

    const handleImageLoad = () => {
        setImageLoaded(true);
    };

    const handleImageError = (e) => {
        console.error('Failed to load image:', e.target.src);
        setImageError(true);
        setImageLoaded(true);
        // Set fallback image
        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjUgNzVIMTc1VjEyNUgxMjVWNzVaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0xNDAgOTBIMTYwVjExMEgxNDBWOTBaIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QkEwIiBmb250LXNpemU9IjEyIiBmb250LWZhbWlseT0iQXJpYWwiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
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
            month: 'short',
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

    // Mock listing data for demonstration
    const mockListing = {
        _id: '1',
        title: 'iPhone 14 Pro Max - Excellent Condition',
        description: 'Barely used iPhone 14 Pro Max in excellent condition. Comes with original box and charger.',
        price: 89999,
        condition: 'like-new',
        location: 'Mumbai, Maharashtra',
        images: ['/api/placeholder/300/200'],
        seller: {
            first_name: 'Rajesh',
            last_name: 'Kumar'
        },
        createdAt: new Date().toISOString(),
        category: 'electronics'
    };

    const displayListing = listing || mockListing;

    return (
        <Link 
            to={`/marketplace/listing/${displayListing._id}`}
            className="block group"
            ref={cardRef}
        >
            <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ${compact ? 'h-auto' : 'h-full'}`}>
                {/* Image */}
                <div className={`relative ${compact ? 'h-32' : 'h-48'} bg-gray-100 overflow-hidden`}>
                    {/* Loading skeleton */}
                    {!imageLoaded && isVisible && (
                        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                            <div className="text-gray-400 text-sm">Loading...</div>
                        </div>
                    )}

                    {displayListing.images && displayListing.images.length > 0 && isVisible ? (
                        <ProgressiveImage
                            src={displayListing.images[0]}
                            alt={displayListing.title}
                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300`}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                            lazy={true}
                        />
                    ) : !isVisible ? (
                        // Placeholder before intersection
                        <div className="w-full h-full bg-gray-100"></div>
                    ) : (
                        // No image placeholder
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <div className="text-center">
                                <div className="text-3xl text-gray-300 mb-2">🖼️</div>
                                <span className="text-gray-400 text-sm">No Image</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Favorite Button */}
                    <button
                        onClick={handleFavoriteClick}
                        className="absolute top-2 right-2 p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all shadow-sm"
                        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                    >
                        {isFavorited ? (
                            <HiHeart className="h-5 w-5 text-red-500" />
                        ) : (
                            <HiOutlineHeart className="h-5 w-5 text-gray-600" />
                        )}
                    </button>

                    {/* Condition Badge */}
                    <div className="absolute top-2 left-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(displayListing.condition)}`}>
                            {formatCondition(displayListing.condition)}
                        </span>
                    </div>

                    {/* Multiple Images Indicator */}
                    {displayListing.images && displayListing.images.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                            +{displayListing.images.length - 1} more
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className={`p-4 ${compact ? 'space-y-2' : 'space-y-3'}`}>
                    {/* Price */}
                    <div className="flex items-center justify-between">
                        <span className={`font-bold text-gray-900 ${compact ? 'text-lg' : 'text-xl'}`}>
                            {formatPrice(displayListing.price)}
                        </span>
                        <div className="flex items-center text-gray-500 text-sm">
                            <HiClock className="h-4 w-4 mr-1" />
                            {formatDate(displayListing.createdAt)}
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className={`font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors ${compact ? 'text-sm' : 'text-base'}`}>
                        {displayListing.title}
                    </h3>

                    {/* Description - only show in non-compact mode */}
                    {!compact && (
                        <p className="text-gray-600 text-sm line-clamp-2">
                            {displayListing.description}
                        </p>
                    )}

                    {/* Location */}
                    <div className="flex items-center text-gray-500 text-sm">
                        <HiMapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{displayListing.location}</span>
                    </div>

                    {/* Seller Info */}
                    {showSellerInfo && displayListing.seller && (
                        <div className="pt-2 border-t border-gray-100">
                            <span className="text-sm text-gray-600">
                                Seller: {displayListing.seller.first_name} {displayListing.seller.last_name}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
});

export default ListingCard;