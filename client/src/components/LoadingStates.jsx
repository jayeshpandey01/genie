import { HiArrowPath } from 'react-icons/hi2';

// Spinner component
export function Spinner({ size = 'md', color = 'blue' }) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12'
    };

    const colorClasses = {
        blue: 'border-blue-600',
        gray: 'border-gray-600',
        white: 'border-white',
        red: 'border-red-600',
        green: 'border-green-600'
    };

    return (
        <div 
            className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`}
            role="status"
            aria-label="Loading"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
}

// Loading overlay
export function LoadingOverlay({ message = "Loading...", transparent = false }) {
    return (
        <div className={`absolute inset-0 flex items-center justify-center z-50 ${
            transparent ? 'bg-white bg-opacity-75' : 'bg-white'
        }`}>
            <div className="text-center">
                <Spinner size="lg" />
                <p className="mt-3 text-gray-600 text-sm">{message}</p>
            </div>
        </div>
    );
}

// Button loading state
export function LoadingButton({ 
    children, 
    loading = false, 
    disabled = false, 
    className = "", 
    loadingText = "Loading...",
    ...props 
}) {
    return (
        <button
            {...props}
            disabled={loading || disabled}
            className={`inline-flex items-center justify-center ${className} ${
                loading || disabled ? 'opacity-75 cursor-not-allowed' : ''
            }`}
        >
            {loading && (
                <Spinner size="sm" color="white" />
            )}
            <span className={loading ? 'ml-2' : ''}>
                {loading ? loadingText : children}
            </span>
        </button>
    );
}

// Page loading state
export function PageLoading({ message = "Loading page..." }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FFFFEE]">
            <div className="text-center">
                <Spinner size="xl" />
                <p className="mt-4 text-gray-600 text-lg">{message}</p>
            </div>
        </div>
    );
}

// Section loading state
export function SectionLoading({ 
    message = "Loading...", 
    height = "300px",
    showSpinner = true 
}) {
    return (
        <div 
            className="flex items-center justify-center bg-gray-50 rounded-lg"
            style={{ minHeight: height }}
        >
            <div className="text-center">
                {showSpinner && <Spinner size="lg" />}
                <p className={`text-gray-600 ${showSpinner ? 'mt-3' : ''}`}>
                    {message}
                </p>
            </div>
        </div>
    );
}

// Inline loading state
export function InlineLoading({ message = "Loading..." }) {
    return (
        <div className="flex items-center space-x-2 text-gray-600">
            <Spinner size="sm" />
            <span className="text-sm">{message}</span>
        </div>
    );
}

// Progress bar
export function ProgressBar({ 
    progress = 0, 
    showPercentage = true, 
    color = 'blue',
    height = 'h-2'
}) {
    const colorClasses = {
        blue: 'bg-blue-600',
        green: 'bg-green-600',
        red: 'bg-red-600',
        yellow: 'bg-yellow-600'
    };

    return (
        <div className="w-full">
            <div className={`w-full bg-gray-200 rounded-full ${height}`}>
                <div 
                    className={`${height} ${colorClasses[color]} rounded-full transition-all duration-300 ease-out`}
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
            </div>
            {showPercentage && (
                <div className="text-right mt-1">
                    <span className="text-sm text-gray-600">
                        {Math.round(progress)}%
                    </span>
                </div>
            )}
        </div>
    );
}

// Upload progress
export function UploadProgress({ 
    files = [], 
    onCancel,
    title = "Uploading files..." 
}) {
    const totalProgress = files.length > 0 
        ? files.reduce((sum, file) => sum + (file.progress || 0), 0) / files.length 
        : 0;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">{title}</h4>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Cancel
                    </button>
                )}
            </div>
            
            <div className="space-y-3">
                {files.map((file, index) => (
                    <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-700 truncate">{file.name}</span>
                            <span className="text-gray-500">
                                {file.progress === 100 ? 'Complete' : `${Math.round(file.progress || 0)}%`}
                            </span>
                        </div>
                        <ProgressBar 
                            progress={file.progress || 0} 
                            showPercentage={false}
                            color={file.progress === 100 ? 'green' : 'blue'}
                            height="h-1"
                        />
                    </div>
                ))}
                
                {files.length > 1 && (
                    <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm font-medium">
                            <span className="text-gray-900">Overall Progress</span>
                            <span className="text-gray-700">{Math.round(totalProgress)}%</span>
                        </div>
                        <ProgressBar 
                            progress={totalProgress} 
                            showPercentage={false}
                            color="blue"
                            height="h-2"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// Search loading state
export function SearchLoading() {
    return (
        <div className="flex items-center justify-center py-8">
            <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <HiArrowPath className="h-5 w-5 animate-spin" />
                    <span>Searching...</span>
                </div>
            </div>
        </div>
    );
}

// Form submission loading
export function FormSubmissionLoading({ message = "Saving..." }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                <div className="text-center">
                    <Spinner size="lg" />
                    <p className="mt-3 text-gray-900 font-medium">{message}</p>
                    <p className="mt-1 text-gray-600 text-sm">Please wait...</p>
                </div>
            </div>
        </div>
    );
}

// Image loading placeholder
export function ImageLoading({ className = "" }) {
    return (
        <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
            <div className="text-gray-400 text-center">
                <div className="text-2xl mb-1">📷</div>
                <div className="text-xs">Loading...</div>
            </div>
        </div>
    );
}

// Lazy loading wrapper
export function LazyLoadWrapper({ 
    children, 
    loading = false, 
    error = null, 
    retry,
    height = "200px",
    loadingComponent = null 
}) {
    if (error) {
        return (
            <div 
                className="flex items-center justify-center bg-gray-50 rounded-lg"
                style={{ minHeight: height }}
            >
                <div className="text-center">
                    <p className="text-gray-600 mb-2">Failed to load</p>
                    {retry && (
                        <button
                            onClick={retry}
                            className="text-sm text-blue-600 hover:text-blue-700 underline"
                        >
                            Try again
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (loading) {
        return loadingComponent || (
            <SectionLoading height={height} />
        );
    }

    return children;
}

// Infinite scroll loading
export function InfiniteScrollLoading() {
    return (
        <div className="flex justify-center py-6">
            <div className="text-center">
                <Spinner size="md" />
                <p className="mt-2 text-gray-600 text-sm">Loading more...</p>
            </div>
        </div>
    );
}

export default {
    Spinner,
    LoadingOverlay,
    LoadingButton,
    PageLoading,
    SectionLoading,
    InlineLoading,
    ProgressBar,
    UploadProgress,
    SearchLoading,
    FormSubmissionLoading,
    ImageLoading,
    LazyLoadWrapper,
    InfiniteScrollLoading
};