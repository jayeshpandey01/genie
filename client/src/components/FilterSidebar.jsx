import { useState, useEffect, memo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { HiXMark } from "react-icons/hi2";
import { useCachedFilterMetadata } from "../hooks/useCache";

const FilterSidebar = memo(function FilterSidebar({ 
    filters = {}, 
    onFilterChange, 
    categories = [], 
    onClose,
    className = ""
}) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [localFilters, setLocalFilters] = useState(filters);

    // Use cached filter metadata for price ranges and conditions
    const { data: filterMetadata } = useCachedFilterMetadata();

    // Update local filters when props change
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    // Initialize filters from URL params on mount only
    useEffect(() => {
        const urlFilters = {};
        
        // Extract filters from URL
        const category = searchParams.get('category');
        const priceMin = searchParams.get('priceMin');
        const priceMax = searchParams.get('priceMax');
        const condition = searchParams.get('condition');
        const location = searchParams.get('location');

        if (category) urlFilters.category = category;
        if (priceMin) urlFilters.priceMin = parseInt(priceMin);
        if (priceMax) urlFilters.priceMax = parseInt(priceMax);
        if (condition) urlFilters.condition = condition.split(',');
        if (location) urlFilters.location = location;

        if (Object.keys(urlFilters).length > 0) {
            setLocalFilters(urlFilters);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    const handleFilterChange = useCallback((filterType, value) => {
        setLocalFilters(prevFilters => {
            const newFilters = { ...prevFilters };
            
            if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
                delete newFilters[filterType];
            } else {
                newFilters[filterType] = value;
            }

            // Call parent callback with new filters
            if (onFilterChange) {
                onFilterChange(newFilters);
            }

            // Update URL params
            updateUrlParams(newFilters);

            return newFilters;
        });
    }, [onFilterChange]);

    // Handle multiple filter changes at once (for price ranges)
    const handleMultipleFilterChanges = useCallback((changes) => {
        setLocalFilters(prevFilters => {
            const newFilters = { ...prevFilters };
            
            Object.entries(changes).forEach(([filterType, value]) => {
                if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
                    delete newFilters[filterType];
                } else {
                    newFilters[filterType] = value;
                }
            });

            // Call parent callback with new filters
            if (onFilterChange) {
                onFilterChange(newFilters);
            }

            // Update URL params
            updateUrlParams(newFilters);

            return newFilters;
        });
        
        if (onClose) {
            onClose();
        }
    }, [onFilterChange, onClose]);

    const updateUrlParams = useCallback((newFilters) => {
        const newParams = new URLSearchParams(searchParams);
        
        // Clear existing filter params
        ['category', 'priceMin', 'priceMax', 'condition', 'location'].forEach(param => {
            newParams.delete(param);
        });

        // Add new filter params
        Object.keys(newFilters).forEach(key => {
            if (newFilters[key] !== null && newFilters[key] !== undefined && newFilters[key] !== '') {
                if (Array.isArray(newFilters[key])) {
                    if (newFilters[key].length > 0) {
                        newParams.set(key, newFilters[key].join(','));
                    }
                } else {
                    newParams.set(key, newFilters[key].toString());
                }
            }
        });

        // Reset to page 1 when filters change
        newParams.set('page', '1');

        setSearchParams(newParams, { replace: true });
    }, [searchParams, setSearchParams]);

    const clearAllFilters = useCallback(() => {
        const emptyFilters = {};
        setLocalFilters(emptyFilters);
        
        if (onFilterChange) {
            onFilterChange(emptyFilters);
        }
        
        // Clear filter params from URL but keep search
        const newParams = new URLSearchParams();
        const searchParam = searchParams.get('search');
        if (searchParam) {
            newParams.set('search', searchParam);
        }
        newParams.set('page', '1');
        setSearchParams(newParams, { replace: true });
        
        if (onClose) {
            onClose();
        }
    }, [onFilterChange, searchParams, setSearchParams, onClose]);

    const clearFilter = useCallback((filterType) => {
        handleFilterChange(filterType, null);
    }, [handleFilterChange]);

    const conditions = [
        { value: 'new', label: 'New' },
        { value: 'like-new', label: 'Like New' },
        { value: 'good', label: 'Good' },
        { value: 'fair', label: 'Fair' },
        { value: 'poor', label: 'Poor' }
    ];

    const priceRanges = [
        { min: 0, max: 1000, label: 'Under ₹1,000' },
        { min: 1000, max: 5000, label: '₹1,000 - ₹5,000' },
        { min: 5000, max: 10000, label: '₹5,000 - ₹10,000' },
        { min: 10000, max: 25000, label: '₹10,000 - ₹25,000' },
        { min: 25000, max: 50000, label: '₹25,000 - ₹50,000' },
        { min: 50000, max: null, label: 'Over ₹50,000' }
    ];

    const hasActiveFilters = Object.keys(localFilters).length > 0;

    return (
        <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
            <div className="p-4 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                    <div className="flex items-center space-x-2">
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Clear All
                            </button>
                        )}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1 text-gray-400 hover:text-gray-600 md:hidden"
                            >
                                <HiXMark className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Active Filters */}
                {hasActiveFilters && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Active Filters:</h4>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(localFilters).map(([key, value]) => {
                                let displayValue = value;
                                if (key === 'condition' && Array.isArray(value)) {
                                    displayValue = value.join(', ');
                                } else if (key === 'category') {
                                    const category = categories.find(c => c.slug === value);
                                    displayValue = category ? category.name : value;
                                } else if (key === 'priceMin') {
                                    displayValue = `Min: $${value}`;
                                } else if (key === 'priceMax') {
                                    displayValue = `Max: $${value}`;
                                }

                                return (
                                    <span
                                        key={key}
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                        {displayValue}
                                        <button
                                            onClick={() => clearFilter(key)}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                            <HiXMark className="h-3 w-3" />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Category Filter */}
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Category</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="category"
                                value=""
                                checked={!localFilters.category}
                                onChange={() => handleFilterChange('category', null)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">All Categories</span>
                        </label>
                        {categories.map((category) => (
                            <label key={category.slug} className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="category"
                                    value={category.slug}
                                    checked={localFilters.category === category.slug}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                    {category.name}
                                    {category.listingCount > 0 && (
                                        <span className="text-gray-500 ml-1">({category.listingCount})</span>
                                    )}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Quick Price Ranges */}
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
                    <div className="space-y-2 mb-4">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="priceRange"
                                checked={!localFilters.priceMin && !localFilters.priceMax}
                                onChange={() => {
                                    handleMultipleFilterChanges({
                                        priceMin: null,
                                        priceMax: null
                                    });
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Any Price</span>
                        </label>
                        {priceRanges.map((range, index) => (
                            <label key={index} className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="priceRange"
                                    checked={
                                        localFilters.priceMin === range.min && 
                                        localFilters.priceMax === range.max
                                    }
                                    onChange={() => {
                                        handleMultipleFilterChanges({
                                            priceMin: range.min,
                                            priceMax: range.max
                                        });
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="ml-2 text-sm text-gray-700">{range.label}</span>
                            </label>
                        ))}
                    </div>

                    {/* Custom Price Range */}
                    <div className="space-y-3 pt-3 border-t border-gray-200">
                        <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Custom Range</h5>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Min Price</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={localFilters.priceMin || ''}
                                    onChange={(e) => {
                                        const value = e.target.value ? parseInt(e.target.value) : null;
                                        handleFilterChange('priceMin', value);
                                    }}
                                    placeholder="₹0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Max Price</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={localFilters.priceMax || ''}
                                    onChange={(e) => {
                                        const value = e.target.value ? parseInt(e.target.value) : null;
                                        handleFilterChange('priceMax', value);
                                    }}
                                    placeholder="Any"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Condition Filter */}
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Condition</h4>
                    <div className="space-y-2">
                        {conditions.map((condition) => (
                            <label key={condition.value} className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    value={condition.value}
                                    checked={localFilters.condition?.includes(condition.value) || false}
                                    onChange={(e) => {
                                        const currentConditions = localFilters.condition || [];
                                        const newConditions = e.target.checked
                                            ? [...currentConditions, condition.value]
                                            : currentConditions.filter(c => c !== condition.value);
                                        handleFilterChange('condition', newConditions.length > 0 ? newConditions : null);
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">{condition.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Location Filter */}
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Location</h4>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={localFilters.location || ''}
                            onChange={(e) => handleFilterChange('location', e.target.value || null)}
                            placeholder="Enter city, state, or zip..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        <p className="text-xs text-gray-500">
                            Search by city, state, or ZIP code to find items near you.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default FilterSidebar;
