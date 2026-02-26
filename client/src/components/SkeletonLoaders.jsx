// Base skeleton component
export function Skeleton({ className = "", animate = true }) {
    return (
        <div 
            className={`bg-gray-200 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
        />
    );
}

// Listing card skeleton
export function ListingCardSkeleton({ compact = false }) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Image skeleton */}
            <Skeleton className={`w-full ${compact ? 'h-32' : 'h-48'}`} />
            
            {/* Content skeleton */}
            <div className={`p-4 space-y-3 ${compact ? 'space-y-2' : 'space-y-3'}`}>
                {/* Price and date */}
                <div className="flex items-center justify-between">
                    <Skeleton className={`${compact ? 'h-5 w-20' : 'h-6 w-24'}`} />
                    <Skeleton className="h-4 w-16" />
                </div>
                
                {/* Title */}
                <Skeleton className={`${compact ? 'h-4 w-3/4' : 'h-5 w-4/5'}`} />
                
                {/* Description - only in non-compact mode */}
                {!compact && (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                )}
                
                {/* Location */}
                <Skeleton className="h-4 w-1/2" />
                
                {/* Seller info */}
                <div className="pt-2 border-t border-gray-100">
                    <Skeleton className="h-4 w-1/3" />
                </div>
            </div>
        </div>
    );
}

// Listing detail skeleton
export function ListingDetailSkeleton() {
    return (
        <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image gallery skeleton */}
                <div className="space-y-4">
                    <Skeleton className="w-full aspect-square rounded-lg" />
                    <div className="flex space-x-2">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="w-20 h-20 rounded-lg" />
                        ))}
                    </div>
                </div>
                
                {/* Content skeleton */}
                <div className="space-y-6">
                    {/* Header */}
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <div className="flex items-center space-x-4">
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-6 w-20" />
                        </div>
                        <div className="flex items-center space-x-6">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                    </div>
                    
                    {/* Description */}
                    <div className="space-y-3">
                        <Skeleton className="h-6 w-32" />
                        <div className="space-y-2">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-4 w-full" />
                            ))}
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                    
                    {/* Seller info */}
                    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                        <Skeleton className="h-6 w-40" />
                        <div className="space-y-3">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-5 w-36" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    
                    {/* Contact button */}
                    <Skeleton className="h-12 w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
}

// Search results skeleton
export function SearchResultsSkeleton({ count = 6 }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(count)].map((_, i) => (
                <ListingCardSkeleton key={i} />
            ))}
        </div>
    );
}

// Filter sidebar skeleton
export function FilterSidebarSkeleton() {
    return (
        <div className="space-y-6">
            {/* Categories */}
            <div className="space-y-3">
                <Skeleton className="h-5 w-20" />
                <div className="space-y-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-6" />
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Price range */}
            <div className="space-y-3">
                <Skeleton className="h-5 w-16" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                </div>
            </div>
            
            {/* Condition */}
            <div className="space-y-3">
                <Skeleton className="h-5 w-18" />
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-2">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Location */}
            <div className="space-y-3">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-8 w-full" />
            </div>
        </div>
    );
}

// Image carousel skeleton
export function ImageCarouselSkeleton({ showThumbnails = true }) {
    return (
        <div className="space-y-4">
            {/* Main image */}
            <Skeleton className="w-full aspect-square rounded-lg" />
            
            {/* Thumbnails */}
            {showThumbnails && (
                <div className="flex space-x-2 overflow-x-auto">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="w-16 h-16 rounded flex-shrink-0" />
                    ))}
                </div>
            )}
        </div>
    );
}

// Form skeleton
export function FormSkeleton() {
    return (
        <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
            </div>
            
            {/* Description */}
            <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-24 w-full" />
            </div>
            
            {/* Category and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
            
            {/* Condition and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-18" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
            
            {/* Image upload */}
            <div className="space-y-2">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-32 w-full rounded-lg" />
            </div>
            
            {/* Submit button */}
            <Skeleton className="h-12 w-32" />
        </div>
    );
}

// Table skeleton (for admin views)
export function TableSkeleton({ rows = 5, columns = 4 }) {
    return (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                    <tr>
                        {[...Array(columns)].map((_, i) => (
                            <th key={i} className="px-6 py-3">
                                <Skeleton className="h-4 w-20" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {[...Array(rows)].map((_, rowIndex) => (
                        <tr key={rowIndex}>
                            {[...Array(columns)].map((_, colIndex) => (
                                <td key={colIndex} className="px-6 py-4">
                                    <Skeleton className="h-4 w-full" />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Stats cards skeleton (for dashboard)
export function StatsCardsSkeleton({ count = 4 }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                        <Skeleton className="h-12 w-12 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Pagination skeleton
export function PaginationSkeleton() {
    return (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-16" />
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex space-x-2">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-8 w-8" />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Breadcrumb skeleton
export function BreadcrumbSkeleton() {
    return (
        <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
                {[...Array(3)].map((_, i) => (
                    <li key={i} className="flex items-center">
                        {i > 0 && <span className="mx-2 text-gray-400">/</span>}
                        <Skeleton className="h-4 w-16" />
                    </li>
                ))}
            </ol>
        </nav>
    );
}

export default {
    Skeleton,
    ListingCardSkeleton,
    ListingDetailSkeleton,
    SearchResultsSkeleton,
    FilterSidebarSkeleton,
    ImageCarouselSkeleton,
    FormSkeleton,
    TableSkeleton,
    StatsCardsSkeleton,
    PaginationSkeleton,
    BreadcrumbSkeleton
};