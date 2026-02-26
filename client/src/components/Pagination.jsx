import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
    HiChevronLeft, 
    HiChevronRight, 
    HiChevronDoubleLeft, 
    HiChevronDoubleRight 
} from "react-icons/hi2";

export default function Pagination({ 
    currentPage = 1, 
    totalPages = 1, 
    totalItems = 0, 
    hasNext = false, 
    hasPrev = false, 
    limit = 12,
    onPageChange,
    onLimitChange,
    showPageSizeControls = true,
    showItemCount = true,
    className = ""
}) {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    // Page size options
    const pageSizeOptions = [12, 24, 48, 96];

    // Calculate visible page numbers
    const getVisiblePages = () => {
        const delta = 2; // Number of pages to show on each side of current page
        const range = [];
        const rangeWithDots = [];

        // Calculate start and end of visible range
        let start = Math.max(1, currentPage - delta);
        let end = Math.min(totalPages, currentPage + delta);

        // Adjust range if we're near the beginning or end
        if (currentPage <= delta + 1) {
            end = Math.min(totalPages, 2 * delta + 2);
        }
        if (currentPage >= totalPages - delta) {
            start = Math.max(1, totalPages - 2 * delta - 1);
        }

        // Create range array
        for (let i = start; i <= end; i++) {
            range.push(i);
        }

        // Add first page and dots if needed
        if (start > 1) {
            rangeWithDots.push(1);
            if (start > 2) {
                rangeWithDots.push('...');
            }
        }

        // Add main range
        rangeWithDots.push(...range);

        // Add last page and dots if needed
        if (end < totalPages) {
            if (end < totalPages - 1) {
                rangeWithDots.push('...');
            }
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    const handlePageChange = async (page) => {
        if (page === currentPage || page < 1 || page > totalPages || isLoading) {
            return;
        }

        setIsLoading(true);

        try {
            // Update URL parameters
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set('page', page.toString());
            setSearchParams(newSearchParams);

            // Call parent callback if provided
            if (onPageChange) {
                await onPageChange(page);
            }
        } catch (error) {
            console.error('Error changing page:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLimitChange = async (newLimit) => {
        if (newLimit === limit || isLoading) {
            return;
        }

        setIsLoading(true);

        try {
            // Calculate new page to maintain roughly the same position
            const currentItemStart = (currentPage - 1) * limit + 1;
            const newPage = Math.max(1, Math.ceil(currentItemStart / newLimit));

            // Update URL parameters
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set('limit', newLimit.toString());
            newSearchParams.set('page', newPage.toString());
            setSearchParams(newSearchParams);

            // Call parent callback if provided
            if (onLimitChange) {
                await onLimitChange(newLimit, newPage);
            }
        } catch (error) {
            console.error('Error changing page size:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Don't render if there's only one page and no items
    if (totalPages <= 1 && totalItems === 0) {
        return null;
    }

    const visiblePages = getVisiblePages();
    const startItem = totalItems > 0 ? (currentPage - 1) * limit + 1 : 0;
    const endItem = Math.min(currentPage * limit, totalItems);

    return (
        <div className={`bg-white border-t border-gray-200 px-4 py-3 sm:px-6 ${className}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                {/* Mobile pagination */}
                <div className="flex flex-1 justify-between sm:hidden">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!hasPrev || isLoading}
                        className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!hasNext || isLoading}
                        className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>

                {/* Desktop pagination */}
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    {/* Item count and page size controls */}
                    <div className="flex items-center space-x-4">
                        {showItemCount && (
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing{' '}
                                    <span className="font-medium">{startItem}</span>
                                    {' '}to{' '}
                                    <span className="font-medium">{endItem}</span>
                                    {' '}of{' '}
                                    <span className="font-medium">{totalItems}</span>
                                    {' '}results
                                </p>
                            </div>
                        )}

                        {showPageSizeControls && (
                            <div className="flex items-center space-x-2">
                                <label htmlFor="page-size" className="text-sm text-gray-700">
                                    Show:
                                </label>
                                <select
                                    id="page-size"
                                    value={limit}
                                    onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                                    disabled={isLoading}
                                    className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                >
                                    {pageSizeOptions.map(size => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Page navigation */}
                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            {/* First page button */}
                            <button
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage === 1 || isLoading}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="First page"
                            >
                                <HiChevronDoubleLeft className="h-5 w-5" />
                            </button>

                            {/* Previous page button */}
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={!hasPrev || isLoading}
                                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Previous page"
                            >
                                <HiChevronLeft className="h-5 w-5" />
                            </button>

                            {/* Page numbers */}
                            {visiblePages.map((page, index) => {
                                if (page === '...') {
                                    return (
                                        <span
                                            key={`dots-${index}`}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                        >
                                            ...
                                        </span>
                                    );
                                }

                                const isCurrentPage = page === currentPage;
                                return (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        disabled={isLoading}
                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                            isCurrentPage
                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        aria-label={`Page ${page}`}
                                        aria-current={isCurrentPage ? 'page' : undefined}
                                    >
                                        {page}
                                    </button>
                                );
                            })}

                            {/* Next page button */}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={!hasNext || isLoading}
                                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Next page"
                            >
                                <HiChevronRight className="h-5 w-5" />
                            </button>

                            {/* Last page button */}
                            <button
                                onClick={() => handlePageChange(totalPages)}
                                disabled={currentPage === totalPages || isLoading}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Last page"
                            >
                                <HiChevronDoubleRight className="h-5 w-5" />
                            </button>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Loading indicator */}
            {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Loading...</span>
                    </div>
                </div>
            )}
        </div>
    );
}