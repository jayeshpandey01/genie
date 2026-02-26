import { useState, useEffect, useRef, useCallback } from "react";
import { HiArrowUp } from "react-icons/hi2";

export default function InfiniteScroll({
    items = [],
    hasMore = false,
    loading = false,
    onLoadMore,
    renderItem,
    loadingComponent,
    emptyComponent,
    errorComponent,
    error = null,
    threshold = 0.8,
    className = "",
    containerClassName = "",
    showBackToTop = true,
    backToTopThreshold = 500
}) {
    const [showBackToTopButton, setShowBackToTopButton] = useState(false);
    const observerRef = useRef(null);
    const loadingRef = useRef(null);
    const containerRef = useRef(null);

    // Intersection Observer for infinite scroll
    const lastItemRef = useCallback((node) => {
        if (loading) return;
        if (observerRef.current) observerRef.current.disconnect();
        
        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && onLoadMore) {
                    onLoadMore();
                }
            },
            {
                threshold: threshold,
                rootMargin: '100px'
            }
        );
        
        if (node) observerRef.current.observe(node);
    }, [loading, hasMore, onLoadMore, threshold]);

    // Handle scroll for back-to-top button
    useEffect(() => {
        const handleScroll = () => {
            if (showBackToTop) {
                setShowBackToTopButton(window.scrollY > backToTopThreshold);
            }
        };

        if (showBackToTop) {
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        }
    }, [showBackToTop, backToTopThreshold]);

    // Scroll to top function
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // Default loading component
    const defaultLoadingComponent = (
        <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Loading more items...</span>
            </div>
        </div>
    );

    // Default empty component
    const defaultEmptyComponent = (
        <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">Try adjusting your search or filters.</p>
        </div>
    );

    // Default error component
    const defaultErrorComponent = (
        <div className="text-center py-12">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-600 mb-4">{error?.message || 'Failed to load items'}</p>
            <button
                onClick={() => onLoadMore && onLoadMore()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
                Try Again
            </button>
        </div>
    );

    // Show empty state if no items and not loading
    if (items.length === 0 && !loading && !error) {
        return (
            <div className={containerClassName}>
                {emptyComponent || defaultEmptyComponent}
            </div>
        );
    }

    // Show error state
    if (error && items.length === 0) {
        return (
            <div className={containerClassName}>
                {errorComponent || defaultErrorComponent}
            </div>
        );
    }

    return (
        <div ref={containerRef} className={containerClassName}>
            {/* Items grid/list */}
            <div className={className}>
                {items.map((item, index) => {
                    // Attach ref to the last item for intersection observer
                    const isLastItem = index === items.length - 1;
                    
                    return (
                        <div
                            key={item._id || item.id || index}
                            ref={isLastItem ? lastItemRef : null}
                        >
                            {renderItem(item, index)}
                        </div>
                    );
                })}
            </div>

            {/* Loading indicator */}
            {loading && (
                <div ref={loadingRef}>
                    {loadingComponent || defaultLoadingComponent}
                </div>
            )}

            {/* Error state for additional items */}
            {error && items.length > 0 && (
                <div className="text-center py-8">
                    <p className="text-red-600 mb-4">Failed to load more items</p>
                    <button
                        onClick={() => onLoadMore && onLoadMore()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* End of results indicator */}
            {!hasMore && items.length > 0 && !loading && (
                <div className="text-center py-8 border-t border-gray-200">
                    <p className="text-gray-500">You've reached the end of the results</p>
                    <p className="text-sm text-gray-400 mt-1">
                        Showing all {items.length} items
                    </p>
                </div>
            )}

            {/* Back to top button */}
            {showBackToTop && showBackToTopButton && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 hover:scale-110"
                    aria-label="Back to top"
                >
                    <HiArrowUp className="h-5 w-5" />
                </button>
            )}
        </div>
    );
}

// Hook for managing infinite scroll state
export function useInfiniteScroll({
    fetchFunction,
    initialPage = 1,
    pageSize = 12,
    dependencies = []
}) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [currentPage, setCurrentPage] = useState(initialPage);

    // Reset function
    const reset = useCallback(() => {
        setItems([]);
        setCurrentPage(initialPage);
        setHasMore(true);
        setError(null);
    }, [initialPage]);

    // Load more function
    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetchFunction({
                page: currentPage,
                limit: pageSize
            });

            if (response.success) {
                const newItems = response.listings || response.items || [];
                const pagination = response.pagination || {};

                // Append new items (avoid duplicates)
                setItems(prevItems => {
                    const existingIds = new Set(prevItems.map(item => item._id || item.id));
                    const uniqueNewItems = newItems.filter(item => 
                        !existingIds.has(item._id || item.id)
                    );
                    return [...prevItems, ...uniqueNewItems];
                });

                // Update pagination state
                setHasMore(pagination.hasNext || false);
                setCurrentPage(prev => prev + 1);
            } else {
                throw new Error(response.message || 'Failed to fetch items');
            }
        } catch (err) {
            console.error('Error loading more items:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [fetchFunction, currentPage, pageSize, loading, hasMore]);

    // Initial load and reset on dependencies change
    useEffect(() => {
        reset();
    }, dependencies);

    // Load first page when reset
    useEffect(() => {
        if (items.length === 0 && !loading && hasMore) {
            loadMore();
        }
    }, [items.length, loading, hasMore, loadMore]);

    return {
        items,
        loading,
        error,
        hasMore,
        loadMore,
        reset,
        currentPage: currentPage - 1 // Adjust for display (since we increment after successful load)
    };
}