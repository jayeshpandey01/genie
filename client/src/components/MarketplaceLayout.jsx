import { useState, useEffect, memo, useMemo } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { HiAdjustmentsHorizontal } from "react-icons/hi2";
import { MdClose } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import SearchBar from "./SearchBar";
import FilterSidebar from "./FilterSidebar";
import { useCachedCategories } from "../hooks/useCache";

const MarketplaceLayout = memo(function MarketplaceLayout({ 
    children, 
    showFilters = true, 
    searchQuery = "", 
    onSearchChange,
    filters,
    onFilterChange,
    categories = []
}) {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const { isAuthenticated, user } = useAuth();

    // Use cached categories if none provided
    const { data: cachedCategories } = useCachedCategories();
    const effectiveCategories = categories.length > 0 ? categories : (cachedCategories || []);

    // Update local search when prop changes
    useEffect(() => {
        setLocalSearchQuery(searchQuery);
    }, [searchQuery]);

    // Memoized breadcrumb generation for performance
    const breadcrumbs = useMemo(() => {
        const pathSegments = location.pathname.split('/').filter(Boolean);
        const crumbs = [{ name: 'Home', path: '/' }];
        
        if (pathSegments.length > 0) {
            crumbs.push({ name: 'Marketplace', path: '/marketplace' });
            
            if (pathSegments.length > 1) {
                // Add category breadcrumb if present
                if (pathSegments[1] === 'category' && pathSegments[2]) {
                    const categoryName = pathSegments[2].replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
                    crumbs.push({ 
                        name: categoryName, 
                        path: `/marketplace/category/${pathSegments[2]}` 
                    });
                }
                // Add listing breadcrumb if present
                if (pathSegments[1] === 'listing' && pathSegments[2]) {
                    crumbs.push({ 
                        name: 'Listing Details', 
                        path: `/marketplace/listing/${pathSegments[2]}` 
                    });
                }
                // Add my-listings breadcrumb
                if (pathSegments[1] === 'my-listings') {
                    crumbs.push({ 
                        name: 'My Listings', 
                        path: '/marketplace/my-listings' 
                    });
                }
                // Add create listing breadcrumb
                if (pathSegments[1] === 'create') {
                    crumbs.push({ 
                        name: 'Post New Item', 
                        path: '/marketplace/create' 
                    });
                }
                // Add edit listing breadcrumb
                if (pathSegments[1] === 'edit' && pathSegments[2]) {
                    crumbs.push({ 
                        name: 'Edit Listing', 
                        path: `/marketplace/edit/${pathSegments[2]}` 
                    });
                }
            }
        }
        
        return crumbs;
    }, [location.pathname]);

    // Handle search change
    const handleSearchChange = (newValue) => {
        setLocalSearchQuery(newValue);
    };

    const toggleMobileFilters = () => {
        setShowMobileFilters(!showMobileFilters);
    };

    return (
        <div className="min-h-screen bg-[#FFFFEE] flex flex-col">
            {/* Breadcrumb Navigation */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <nav className="flex" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2">
                        {breadcrumbs.map((crumb, index) => (
                            <li key={crumb.path} className="flex items-center">
                                {index > 0 && (
                                    <span className="mx-2 text-gray-400">/</span>
                                )}
                                {index === breadcrumbs.length - 1 ? (
                                    <span className="text-gray-500 font-medium">
                                        {crumb.name}
                                    </span>
                                ) : (
                                    <a
                                        href={crumb.path}
                                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                    >
                                        {crumb.name}
                                    </a>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            </div>

            {/* Search Bar */}
            <div className="bg-white border-b border-gray-200 px-4 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex gap-4 items-center justify-between">
                        <SearchBar
                            value={localSearchQuery}
                            onChange={handleSearchChange}
                            onSubmit={(query) => {
                                if (onSearchChange) {
                                    onSearchChange(query);
                                }
                                // Update URL params
                                const newParams = new URLSearchParams(searchParams);
                                if (query.trim()) {
                                    newParams.set('search', query.trim());
                                } else {
                                    newParams.delete('search');
                                }
                                setSearchParams(newParams);
                            }}
                            placeholder="Search for items in your city..."
                            showAutocomplete={true}
                            className="flex-1"
                        />
                        
                        {/* User Actions */}
                        <div className="flex items-center gap-4">
                            {isAuthenticated && user ? (
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-600">
                                        Welcome, {user.first_name}
                                    </span>
                                    <button 
                                        onClick={() => navigate('/marketplace/my-listings')}
                                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                    >
                                        My Listings
                                    </button>
                                    <button 
                                        onClick={() => navigate('/marketplace/create')}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                    >
                                        Post Item
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-600">
                                        Sign in to post items
                                    </span>
                                    <button 
                                        onClick={() => {
                                            // This will trigger the main login modal
                                            const loginEvent = new CustomEvent('openLogin');
                                            window.dispatchEvent(loginEvent);
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                    >
                                        Sign In
                                    </button>
                                </div>
                            )}
                            
                            {showFilters && (
                                <button
                                    type="button"
                                    onClick={toggleMobileFilters}
                                    className="md:hidden px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                                >
                                    <HiAdjustmentsHorizontal className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow max-w-7xl mx-auto px-4 py-6 w-full">
                <div className="flex gap-6">
                    {/* Filter Sidebar - Desktop */}
                    {showFilters && (
                        <div className="hidden md:block w-64 flex-shrink-0">
                            <FilterSidebar 
                                filters={filters}
                                onFilterChange={onFilterChange}
                                categories={effectiveCategories}
                                className="p-4"
                            />
                        </div>
                    )}

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {children}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Overlay */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="fixed inset-0 bg-black bg-opacity-50" onClick={toggleMobileFilters} />
                    <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                            <button
                                onClick={toggleMobileFilters}
                                className="p-2 text-gray-400 hover:text-gray-600"
                            >
                                <MdClose className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-4">
                            <FilterSidebar 
                                filters={filters}
                                onFilterChange={onFilterChange}
                                categories={effectiveCategories}
                                onClose={toggleMobileFilters}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default MarketplaceLayout;