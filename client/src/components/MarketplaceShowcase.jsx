import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
    HiShoppingBag, 
    HiTruck, 
    HiShieldCheck, 
    HiCurrencyDollar,
    HiArrowRight,
    HiStar,
    HiHeart
} from "react-icons/hi2";

export default function MarketplaceShowcase() {
    const [featuredListings, setFeaturedListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFeaturedListings();
    }, []);

    const fetchFeaturedListings = async () => {
        try {
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch('/api/marketplace/listings?limit=8&sortBy=createdAt&sortOrder=desc', {
                credentials: 'include',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.success) {
                setFeaturedListings(data.listings || []);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('Featured listings request timed out');
            } else {
                console.error('Error fetching featured listings:', error);
            }
            // Set empty array on error to prevent loading state
            setFeaturedListings([]);
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { name: 'Electronics', slug: 'electronics', icon: '📱', color: 'bg-blue-100 text-blue-600' },
        { name: 'Furniture', slug: 'furniture', icon: '🛋️', color: 'bg-purple-100 text-purple-600' },
        { name: 'Vehicles', slug: 'vehicles', icon: '🚗', color: 'bg-red-100 text-red-600' },
        { name: 'Clothing', slug: 'clothing', icon: '👕', color: 'bg-pink-100 text-pink-600' },
        { name: 'Books', slug: 'books', icon: '📚', color: 'bg-green-100 text-green-600' },
        { name: 'Sports', slug: 'sports', icon: '⚽', color: 'bg-orange-100 text-orange-600' },
        { name: 'Home & Garden', slug: 'home-garden', icon: '🏡', color: 'bg-teal-100 text-teal-600' },
        { name: 'Other', slug: 'other', icon: '🎁', color: 'bg-gray-100 text-gray-600' }
    ];

    const features = [
        {
            icon: <HiTruck className="w-8 h-8" />,
            title: "Local Pickup",
            description: "Meet sellers nearby"
        },
        {
            icon: <HiShieldCheck className="w-8 h-8" />,
            title: "Verified Sellers",
            description: "Trusted community members"
        },
        {
            icon: <HiCurrencyDollar className="w-8 h-8" />,
            title: "Best Prices",
            description: "Great deals on used items"
        },
        {
            icon: <HiShoppingBag className="w-8 h-8" />,
            title: "Easy Listing",
            description: "Sell in minutes"
        }
    ];

    return (
        <div className="py-16 bg-gradient-to-b from-[#FFFFEE] to-blue-50">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mb-4">
                        <HiShoppingBag className="w-5 h-5" />
                        <span>New Feature</span>
                    </div>
                    <h2 className="text-5xl font-bold text-gray-900 mb-4 font-[NeuwMachina]">
                        Buy & Sell Marketplace
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Discover amazing deals from your local community. Buy pre-loved items or sell things you no longer need.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {features.map((feature, index) => (
                        <div 
                            key={index}
                            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 group"
                        >
                            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                {feature.icon}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600 text-sm">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Categories Section */}
                <div className="mb-16">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-3xl font-bold text-gray-900 font-[NeuwMachina]">
                            Shop by Category
                        </h3>
                        <Link 
                            to="/marketplace"
                            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 group"
                        >
                            View All
                            <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        {categories.map((category) => (
                            <Link
                                key={category.slug}
                                to={`/marketplace/category/${category.slug}`}
                                className="group"
                            >
                                <div className="bg-white rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:-translate-y-1">
                                    <div className={`w-16 h-16 ${category.color} rounded-xl flex items-center justify-center text-3xl mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                                        {category.icon}
                                    </div>
                                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {category.name}
                                    </h4>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Featured Listings */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-3xl font-bold text-gray-900 font-[NeuwMachina]">
                            Featured Items
                        </h3>
                        <Link 
                            to="/marketplace"
                            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 group"
                        >
                            Browse All
                            <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                                    <div className="w-full h-48 bg-gray-200"></div>
                                    <div className="p-4 space-y-3">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : featuredListings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {featuredListings.slice(0, 8).map((listing) => (
                                <Link
                                    key={listing._id}
                                    to={`/marketplace/listing/${listing._id}`}
                                    className="group"
                                >
                                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:-translate-y-2">
                                        {/* Image */}
                                        <div className="relative overflow-hidden h-48 bg-gray-100">
                                            {listing.imageUrls && listing.imageUrls.length > 0 ? (
                                                <img
                                                    src={listing.imageUrls[0].urls.medium || listing.imageUrls[0].urls.thumbnail}
                                                    alt={listing.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                    onError={(e) => {
                                                        e.target.onerror = null; // Prevent infinite loop
                                                        e.target.src = '/placeholder-service.svg';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <HiShoppingBag className="w-16 h-16" />
                                                </div>
                                            )}
                                            
                                            {/* Condition Badge */}
                                            <div className="absolute top-3 left-3">
                                                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 capitalize">
                                                    {listing.condition}
                                                </span>
                                            </div>

                                            {/* Favorite Button */}
                                            <button 
                                                className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    // Add to favorites logic
                                                }}
                                            >
                                                <HiHeart className="w-5 h-5 text-gray-600 hover:text-red-500" />
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                                {listing.title}
                                            </h4>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-2xl font-bold text-blue-600">
                                                    ₹{listing.price}
                                                </span>
                                                {listing.seller && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <HiStar className="w-4 h-4 text-yellow-400" />
                                                        <span>Verified</span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                                {listing.description}
                                            </p>
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    📍 {listing.location}
                                                </span>
                                                <span className="capitalize px-2 py-1 bg-gray-100 rounded-full">
                                                    {listing.category}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                            <HiShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h4 className="text-xl font-semibold text-gray-900 mb-2">
                                No listings yet
                            </h4>
                            <p className="text-gray-600 mb-6">
                                Be the first to post an item to our marketplace!
                            </p>
                            <Link
                                to="/marketplace/create"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                            >
                                Post Your First Item
                                <HiArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    )}
                </div>

                {/* CTA Section */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-4xl font-bold mb-4 font-[NeuwMachina]">
                            Start Buying & Selling Today
                        </h3>
                        <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
                            Join thousands of users buying and selling in your local community. It's free, fast, and secure!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/marketplace"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-100 transition-colors font-semibold text-lg"
                            >
                                Browse Marketplace
                                <HiArrowRight className="w-6 h-6" />
                            </Link>
                            <Link
                                to="/marketplace/create"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl hover:bg-white/10 transition-colors font-semibold text-lg"
                            >
                                Sell an Item
                                <HiShoppingBag className="w-6 h-6" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
