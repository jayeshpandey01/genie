import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import MarketplaceLayout from "../components/MarketplaceLayout";
import ListingCard from "../components/ListingCard";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import InfiniteScroll, { useInfiniteScroll } from "../components/InfiniteScroll";

export default function CategoryPage() {
    const { category } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [filters, setFilters] = useState({});
    const [categories, setCategories] = useState([]);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryInfo, setCategoryInfo] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
        limit: 12
    });
    const [viewMode, setViewMode] = useState('pagination');

    // Detect mobile for default view mode
    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        setViewMode(isMobile ? 'infinite' : 'pagination');
    }, []);

    // Fetch function for API calls
    const fetchCategoryListings = async (params = {}) => {
        const queryParams = new URLSearchParams();
        
        // Add pagination params
        queryParams.set('page', params.page || searchParams.get('page') || '1');
        queryParams.set('limit', params.limit || searchParams.get('limit') || '12');
        
        // Add search and filter params
        if (searchQuery) queryParams.set('search', searchQuery);
        if (filters.priceMin) queryParams.set('priceMin', filters.priceMin);
        if (filters.priceMax) queryParams.set('priceMax', filters.priceMax);
        if (filters.condition && filters.condition.length > 0) {
            queryParams.set('condition', filters.condition.join(','));
        }
        if (filters.location) queryParams.set('location', filters.location);

        const response = await fetch(`/api/marketplace/categories/${category}/listings?${queryParams}`, {
            credentials: 'include'
        });
        
        return await response.json();
    };

    // Infinite scroll hook
    const infiniteScrollData = useInfiniteScroll({
        fetchFunction: fetchCategoryListings,
        pageSize: 12,
        dependencies: [category, searchQuery, filters]
    });

    // Fetch real data from API (for pagination mode)
    useEffect(() => {
        if (viewMode !== 'pagination') return;

        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Fetch categories and category-specific listings
                const [categoriesResponse, listingsResponse] = await Promise.all([
                    fetch('/api/marketplace/categories', { credentials: 'include' }),
                    fetchCategoryListings()
                ]);

                // Handle categories
                if (categoriesResponse.ok) {
                    const categoriesData = await categoriesResponse.json();
                    if (categoriesData.success) {
                        setCategories(categoriesData.categories);
                        // Find current category info
                        const currentCategory = categoriesData.categories.find(cat => cat.slug === category);
                        setCategoryInfo(currentCategory);
                    }
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
                    // Update category info if available
                    if (listingsResponse.category) {
                        setCategoryInfo(listingsResponse.category);
                    }
                } else {
                    console.error('Failed to fetch category listings:', listingsResponse.message);
                    setListings([]);
                }

            } catch (error) {
                console.error('Error fetching category data:', error);
                setListings([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [category, searchQuery, filters, searchParams, viewMode]);

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
                        const currentCategory = data.categories.find(cat => cat.slug === category);
                        setCategoryInfo(currentCategory);
                    }
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, [category, viewMode]);

    // Initialize filters from URL params
    useEffect(() => {
        const initialFilters = { category }; // Set current category as filter
        
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
    }, [searchParams, category]);

    const handleSearchChange = (query) => {
        setSearchQuery(query);
        // Update URL params
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
            if (key === 'category') return; // Don't update category in URL for category page
            
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
                    <div className="text-lg text-gray-600">Loading category...</div>
                </div>
            </MarketplaceLayout>
        );
    }

    // Get current listings based on view mode
    const currentListings = viewMode === 'infinite' ? infiniteScrollData.items : listings;

    if (!categoryInfo) {
        return (
            <MarketplaceLayout showFilters={false}>
                <EmptyState
                    type="error"
                    title="Category Not Found"
                    description="The category you're looking for doesn't exist or may have been removed."
                    action={
                        <button
                            onClick={() => window.location.href = '/marketplace'}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                        >
                            Browse All Categories
                        </button>
                    }
                />
            </MarketplaceLayout>
        );
    }

    return (
        <MarketplaceLayout
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFilterChange={handleFilterChange}
            categories={categories}
        >
            <div className="space-y-6">
                {/* Category Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{categoryInfo.name}</h1>
                        <p className="text-gray-600 mt-1">
                            {viewMode === 'pagination' ? pagination.totalItems : infiniteScrollData.items.length} items available
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
                {Object.keys(filters).filter(key => key !== 'category').length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-gray-600">Active filters:</span>
                        {Object.entries(filters).filter(([key]) => key !== 'category').map(([key, value]) => (
                            <span
                                key={key}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                                {key}: {Array.isArray(value) ? value.join(', ') : value}
                            </span>
                        ))}
                    </div>
                )}

                {/* Listings Grid */}
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
                                type="no-results"
                                title={`No ${categoryInfo.name.toLowerCase()} found`}
                                description="Try adjusting your filters or check back later for new listings."
                                action={
                                    <button
                                        onClick={() => navigate('/marketplace/create')}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                                    >
                                        Post First {categoryInfo.name} Item
                                    </button>
                                }
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
                                type="no-results"
                                title={`No ${categoryInfo?.name?.toLowerCase() || 'items'} found`}
                                description="Try adjusting your filters or check back later for new listings."
                                action={
                                    <button
                                        onClick={() => navigate('/marketplace/create')}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                                    >
                                        Post First {categoryInfo?.name || 'Item'}
                                    </button>
                                }
                            />
                        }
                    />
                )}
            </div>
        </MarketplaceLayout>
    );
}