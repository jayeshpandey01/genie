import { useState, useEffect, useRef } from 'react';

/**
 * Simple in-memory cache implementation
 */
class MemoryCache {
    constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default TTL
        this.cache = new Map();
        this.defaultTTL = defaultTTL;
    }

    set(key, value, ttl = this.defaultTTL) {
        const expiresAt = Date.now() + ttl;
        this.cache.set(key, {
            value,
            expiresAt
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            return null;
        }

        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    has(key) {
        const item = this.cache.get(key);
        if (!item) {
            return false;
        }

        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    delete(key) {
        return this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    size() {
        // Clean expired items first
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiresAt) {
                this.cache.delete(key);
            }
        }
        return this.cache.size;
    }
}

// Global cache instance
const globalCache = new MemoryCache();

/**
 * Custom hook for caching data with automatic expiration
 * @param {string} key - Cache key
 * @param {Function} fetchFunction - Function to fetch data when not in cache
 * @param {Object} options - Cache options
 * @returns {Object} { data, loading, error, refresh, clearCache }
 */
export function useCache(key, fetchFunction, options = {}) {
    const {
        ttl = 5 * 60 * 1000, // 5 minutes default
        dependencies = [],
        enabled = true,
        staleWhileRevalidate = false
    } = options;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchFunctionRef = useRef(fetchFunction);
    const mountedRef = useRef(true);

    // Update fetch function ref when it changes
    useEffect(() => {
        fetchFunctionRef.current = fetchFunction;
    }, [fetchFunction]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const fetchData = async (useCache = true) => {
        if (!enabled) return;

        // Check cache first
        if (useCache && globalCache.has(key)) {
            const cachedData = globalCache.get(key);
            setData(cachedData);
            setError(null);
            
            // If stale-while-revalidate, fetch in background
            if (staleWhileRevalidate) {
                fetchData(false); // Fetch without using cache
            }
            return cachedData;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await fetchFunctionRef.current();
            
            if (mountedRef.current) {
                setData(result);
                globalCache.set(key, result, ttl);
            }
            
            return result;
        } catch (err) {
            if (mountedRef.current) {
                setError(err);
                console.error(`Cache fetch error for key "${key}":`, err);
            }
            throw err;
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    };

    const refresh = () => {
        return fetchData(false);
    };

    const clearCache = () => {
        globalCache.delete(key);
    };

    // Initial fetch and refetch on dependencies change
    useEffect(() => {
        fetchData();
    }, [key, enabled, ...dependencies]);

    return {
        data,
        loading,
        error,
        refresh,
        clearCache
    };
}

/**
 * Hook for caching marketplace categories
 */
export function useCachedCategories() {
    return useCache(
        'marketplace-categories',
        async () => {
            const response = await fetch('/api/marketplace/categories', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                return data.categories;
            }
            throw new Error(data.message || 'Failed to fetch categories');
        },
        {
            ttl: 10 * 60 * 1000, // 10 minutes for categories
            staleWhileRevalidate: true
        }
    );
}

/**
 * Hook for caching filter metadata
 */
export function useCachedFilterMetadata() {
    return useCache(
        'marketplace-filter-metadata',
        async () => {
            const response = await fetch('/api/marketplace/listings?limit=1', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                return data.filters;
            }
            throw new Error(data.message || 'Failed to fetch filter metadata');
        },
        {
            ttl: 5 * 60 * 1000, // 5 minutes for filter metadata
            staleWhileRevalidate: true
        }
    );
}

/**
 * Hook for caching search suggestions
 */
export function useCachedSearchSuggestions(query) {
    const cacheKey = `search-suggestions-${query}`;
    
    return useCache(
        cacheKey,
        async () => {
            if (!query || query.length < 2) {
                return [];
            }
            
            try {
                const response = await fetch(`/api/marketplace/search/suggestions?q=${encodeURIComponent(query)}`, {
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    // If suggestions endpoint doesn't exist, return empty array
                    console.warn('Search suggestions endpoint not available');
                    return [];
                }
                
                const data = await response.json();
                if (data.success) {
                    return data.suggestions || [];
                }
                return [];
            } catch (error) {
                // Silently fail and return empty suggestions
                console.warn('Search suggestions failed:', error.message);
                return [];
            }
        },
        {
            ttl: 2 * 60 * 1000, // 2 minutes for search suggestions
            dependencies: [query],
            enabled: query && query.length >= 2
        }
    );
}

/**
 * Clear all marketplace-related cache
 */
export function clearMarketplaceCache() {
    globalCache.delete('marketplace-categories');
    globalCache.delete('marketplace-filter-metadata');
    
    // Clear search suggestion caches
    for (const [key] of globalCache.cache.entries()) {
        if (key.startsWith('search-suggestions-')) {
            globalCache.delete(key);
        }
    }
}

export { globalCache };
export default useCache;