import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MarketplaceLayout from "../components/MarketplaceLayout";
import ListingCard from "../components/ListingCard";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import InfiniteScroll, { useInfiniteScroll } from "../components/InfiniteScroll";

export default function MarketplacePage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [filters, setFilters] = useState({});
    const [categories, setCategories] = useState([]);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
        limit: 12
    });
    const [viewMode, setViewMode] = useState('pagination'); // 'pagination' or 'infinite'
    const { isAuthenticated, user } = useAuth();

    // Detect mobile for default view mode
    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        setViewMode(isMobile ? 'infinite' : 'pagination');
    }, []);

    // Fetch function for API calls
    const fetchListings = async (params = {}) => {
        const queryParams = new URLSearchParams();
        
        // Add pagination params
        queryParams.set('page', params.page || searchParams.get('page') || '1');
        queryParams.set('limit', params.limit || searchParams.get('limit') || '12');
        
        // Add search and filter params
        if (searchQuery) queryParams.set('search', searchQuery);
        if (filters.category) queryParams.set('category', filters.category);
        if (filters.priceMin) queryParams.set('priceMin', filters.priceMin);
        if (filters.priceMax) queryParams.set('priceMax', filters.priceMax);
        if (filters.condition && filters.condition.length > 0) {
            queryParams.set('condition', filters.condition.join(','));
        }
        if (filters.location) queryParams.set('location', filters.location);

        const response = await fetch(`/api/marketplace/listings?${queryParams}`, {
            credentials: 'include'
        });
        
        return await response.json();
    };

    // Infinite scroll hook
    const infiniteScrollData = useInfiniteScroll({
        fetchFunction: fetchListings,
        pageSize: 12,
        dependencies: [searchQuery, filters]
    });

    // Fetch real data from API (for pagination mode)
    useEffect(() => {
        if (viewMode !== 'pagination') return;

        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Fetch categories and listings in parallel
                const [categoriesResponse, listingsResponse] = await Promise.all([
                    fetch('/api/marketplace/categories', { credentials: 'include' }),
                    fetchListings()
                ]);

                // Handle categories
                if (categoriesResponse.ok) {
                    const categoriesData = await categoriesResponse.json();
                    if (categoriesData.success) {
                        setCategories(categoriesData.categories);
                    }
                } else {
                    // Fallback to mock categories
                    setCategories([
                        { slug: 'electronics', name: 'Electronics', listingCount: 0 },
                        { slug: 'furniture', name: 'Furniture', listingCount: 0 },
                        { slug: 'vehicles', name: 'Vehicles', listingCount: 0 },
                        { slug: 'clothing', name: 'Clothing', listingCount: 0 },
                        { slug: 'books', name: 'Books', listingCount: 0 },
                        { slug: 'sports', name: 'Sports', listingCount: 0 },
                        { slug: 'home-garden', name: 'Home & Garden', listingCount: 0 },
                        { slug: 'other', name: 'Other', listingCount: 0 }
                    ]);
                }

                // Handle listings
                if (listingsResponse.success) {
                    setListings(listingsResponse.listings || []);
                    setPagination(listingsResponse.pagination || {
                        currentPage: 1,
                        totalPages: 1,
                        totalItems: 0,
                        hasNext: false,
                        hasPrev: false,
                        limit: 12
                    });
                } else {
                    console.error('Failed to fetch listings:', listingsResponse.message);
                    setListings([]);
                }

            } catch (error) {
                console.error('Error fetching marketplace data:', error);
                // Set fallback data
                setCategories([
                    { slug: 'electronics', name: 'Electronics', listingCount: 0 },
                    { slug: 'furniture', name: 'Furniture', listingCount: 0 },
                    { slug: 'vehicles', name: 'Vehicles', listingCount: 0 },
                    { slug: 'clothing', name: 'Clothing', listingCount: 0 },
                    { slug: 'books', name: 'Books', listingCount: 0 },
                    { slug: 'sports', name: 'Sports', listingCount: 0 },
                    { slug: 'home-garden', name: 'Home & Garden', listingCount: 0 },
                    { slug: 'other', name: 'Other', listingCount: 0 }
                ]);
                setListings([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [searchQuery, filters, searchParams, viewMode]);

    // Fetch categories for infinite scroll mode
    useEffect(() => {
        if (viewMode !== 'infinite') return;

        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/marketplace/categories', { credentials: 'include' });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setCategories(data.categories);
                    }
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, [viewMode]);

    // Initialize filters from URL params
    useEffect(() => {
        const initialFilters = {};
        
        if (searchParams.get('category')) {
            initialFilters.category = searchParams.get('category');
        }
        if (searchParams.get('priceMin')) {
            initialFilters.priceMin = parseInt(searchParams.get('priceMin'));
        }
        if (searchParams.get('priceMax')) {
            initialFilters.priceMax = parseInt(searchParams.get('priceMax'));
        }
        if (searchParams.get('condition')) {
            initialFilters.condition = searchParams.get('condition').split(',');
        }
        if (searchParams.get('location')) {
            initialFilters.location = searchParams.get('location');
        }
        
        setFilters(initialFilters);
    }, [searchParams]);

    const handleSearchChange = (query) => {
        setSearchQuery(query);
        // The debouncing is now handled in the SearchBar component
        // Update URL params immediately for better UX
        const newSearchParams = new URLSearchParams(searchParams);
        if (query) {
            newSearchParams.set('search', query);
        } else {
            newSearchParams.delete('search');
        }
        newSearchParams.set('page', '1'); // Reset to first page
        setSearchParams(newSearchParams);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        // Update URL params
        const newSearchParams = new URLSearchParams(searchParams);
        
        // Update filter params
        Object.keys(newFilters).forEach(key => {
            if (newFilters[key] && newFilters[key] !== '') {
                if (Array.isArray(newFilters[key])) {
                    newSearchParams.set(key, newFilters[key].join(','));
                } else {
                    newSearchParams.set(key, newFilters[key]);
                }
            } else {
                newSearchParams.delete(key);
            }
        });
        
        newSearchParams.set('page', '1'); // Reset to first page
        setSearchParams(newSearchParams);
    };

    const handlePageChange = async (page) => {
        if (viewMode === 'pagination') {
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set('page', page.toString());
            setSearchParams(newSearchParams);
        }
    };

    const handleLimitChange = async (newLimit, newPage = 1) => {
        if (viewMode === 'pagination') {
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set('limit', newLimit.toString());
            newSearchParams.set('page', newPage.toString());
            setSearchParams(newSearchParams);
        }
    };

    const toggleViewMode = () => {
        setViewMode(prev => prev === 'pagination' ? 'infinite' : 'pagination');
    };

    if (loading && viewMode === 'pagination') {
        return (
            <MarketplaceLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-600">Loading marketplace...</div>
                </div>
            </MarketplaceLayout>
        );
    }

    // Get current listings based on view mode
    const currentListings = viewMode === 'infinite' ? infiniteScrollData.items : listings;
    const isCurrentlyLoading = viewMode === 'infinite' ? infiniteScrollData.loading : loading;

    return (
        <MarketplaceLayout
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFilterChange={handleFilterChange}
            categories={categories}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
                        <p className="text-gray-600 mt-1">
                            Discover great deals from our community
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {/* View Mode Toggle */}
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">View:</span>
                            <button
                                onClick={toggleViewMode}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                {viewMode === 'pagination' ? 'Pages' : 'Infinite'}
                            </button>
                        </div>
                        
                        <button 
                            onClick={() => navigate('/marketplace/create')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                        >
                            Post Item
                        </button>
                    </div>
                </div>

                {/* Active Filters Display */}
                {Object.keys(filters).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-gray-600">Active filters:</span>
                        {Object.entries(filters).map(([key, value]) => (
                            <span
                                key={key}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                                {key}: {Array.isArray(value) ? value.join(', ') : value}
                            </span>
                        ))}
                    </div>
                )}

                {/* Categories Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                    {categories.map((category) => (
                        <Link
                            key={category.slug}
                            to={`/marketplace/category/${category.slug}`}
                            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group"
                        >
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {category.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                {category.listingCount} items
                            </p>
                        </Link>
                    ))}
                </div>

                {/* Featured Listings */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Recent Listings</h2>
                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                            View All
                        </button>
                    </div>
                    
                    {viewMode === 'pagination' ? (
                        // Pagination Mode
                        <>
                            {currentListings.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {currentListings.map((listing) => (
                                            <ListingCard
                                                key={listing._id}
                                                listing={listing}
                                                onFavorite={(listingId) => console.log('Favorited:', listingId)}
                                            />
                                        ))}
                                    </div>
                                    
                                    {/* Pagination Component */}
                                    <Pagination
                                        currentPage={pagination.currentPage}
                                        totalPages={pagination.totalPages}
                                        totalItems={pagination.totalItems}
                                        hasNext={pagination.hasNext}
                                        hasPrev={pagination.hasPrev}
                                        limit={pagination.limit}
                                        onPageChange={handlePageChange}
                                        onLimitChange={handleLimitChange}
                                        showPageSizeControls={true}
                                        showItemCount={true}
                                    />
                                </>
                            ) : (
                                <EmptyState
                                    type="no-listings"
                                    title="No listings available"
                                    description="Be the first to post an item to our marketplace!"
                                />
                            )}
                        </>
                    ) : (
                        // Infinite Scroll Mode
                        <InfiniteScroll
                            items={infiniteScrollData.items}
                            hasMore={infiniteScrollData.hasMore}
                            loading={infiniteScrollData.loading}
                            onLoadMore={infiniteScrollData.loadMore}
                            error={infiniteScrollData.error}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            renderItem={(listing) => (
                                <ListingCard
                                    key={listing._id}
                                    listing={listing}
                                    onFavorite={(listingId) => console.log('Favorited:', listingId)}
                                />
                            )}
                            emptyComponent={
                                <EmptyState
                                    type="no-listings"
                                    title="No listings available"
                                    description="Be the first to post an item to our marketplace!"
                                />
                            }
                        />
                    )}
                </div>
            </div>
        </MarketplaceLayout>
    );
}