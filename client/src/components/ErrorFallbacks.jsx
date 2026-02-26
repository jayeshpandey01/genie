import { HiExclamationTriangle, HiLockClosed, HiMagnifyingGlass, HiPhoto, HiArrowPath, HiHome, HiWifi } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';

// Generic error fallback
export function GenericErrorFallback({ error, retry, title, message, showRetry = true }) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
            <HiExclamationTriangle className="h-16 w-16 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {title || 'Something went wrong'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
                {message || 'An unexpected error occurred. Please try again.'}
            </p>
            {showRetry && (
                <button
                    onClick={retry}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                    <HiArrowPath className="h-4 w-4 mr-2" />
                    Try Again
                </button>
            )}
        </div>
    );
}

// Network error fallback
export function NetworkErrorFallback({ retry }) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
            <HiWifi className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Connection Problem
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
                Unable to connect to the server. Please check your internet connection and try again.
            </p>
            <div className="space-y-3">
                <button
                    onClick={retry}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                    <HiArrowPath className="h-4 w-4 mr-2" />
                    Try Again
                </button>
                <div className="text-sm text-gray-500">
                    <p>If the problem persists:</p>
                    <ul className="mt-2 space-y-1">
                        <li>• Check your internet connection</li>
                        <li>• Try refreshing the page</li>
                        <li>• Contact support if the issue continues</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

// Authentication error fallback
export function AuthErrorFallback({ message = "Please log in to continue" }) {
    const handleLogin = () => {
        const loginEvent = new CustomEvent('openLogin');
        window.dispatchEvent(loginEvent);
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
            <HiLockClosed className="h-16 w-16 text-yellow-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Required
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
                {message}
            </p>
            <div className="space-x-3">
                <button
                    onClick={handleLogin}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                    Log In
                </button>
                <button
                    onClick={() => {
                        const registerEvent = new CustomEvent('openRegister');
                        window.dispatchEvent(registerEvent);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                    Sign Up
                </button>
            </div>
        </div>
    );
}

// Empty state fallback (no data)
export function EmptyStateFallback({ 
    title = "No items found", 
    message = "There are no items to display at the moment.",
    actionLabel,
    onAction,
    icon: Icon = HiMagnifyingGlass
}) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
            <Icon className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {title}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
                {message}
            </p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

// Listing not found fallback
export function ListingNotFoundFallback() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">📦</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Listing Not Found
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
                This listing may have been sold, removed, or the link might be incorrect.
            </p>
            <div className="space-x-3">
                <button
                    onClick={() => navigate('/marketplace')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                    <HiHome className="h-4 w-4 mr-2" />
                    Browse Marketplace
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                    Go Back
                </button>
            </div>
        </div>
    );
}

// Image loading error fallback
export function ImageErrorFallback({ retry, showRetry = true }) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg min-h-[200px]">
            <HiPhoto className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm mb-4">
                Unable to load image
            </p>
            {showRetry && (
                <button
                    onClick={retry}
                    className="text-xs text-blue-600 hover:text-blue-700 underline"
                >
                    Try again
                </button>
            )}
        </div>
    );
}

// Search error fallback
export function SearchErrorFallback({ retry, onClearSearch }) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
            <HiMagnifyingGlass className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Search Unavailable
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
                Search functionality is temporarily unavailable. You can browse all listings or try again.
            </p>
            <div className="space-x-3">
                <button
                    onClick={retry}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                    <HiArrowPath className="h-4 w-4 mr-2" />
                    Try Search Again
                </button>
                {onClearSearch && (
                    <button
                        onClick={onClearSearch}
                        className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                        Browse All Listings
                    </button>
                )}
            </div>
        </div>
    );
}

// Form submission error fallback
export function FormErrorFallback({ error, retry, onCancel }) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
                <HiExclamationTriangle className="h-6 w-6 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                    <h4 className="text-red-800 font-medium mb-2">
                        Submission Failed
                    </h4>
                    <p className="text-red-700 text-sm mb-4">
                        {error?.message || 'Unable to submit the form. Please check your input and try again.'}
                    </p>
                    <div className="space-x-3">
                        <button
                            onClick={retry}
                            className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                        >
                            <HiArrowPath className="h-4 w-4 mr-2" />
                            Try Again
                        </button>
                        {onCancel && (
                            <button
                                onClick={onCancel}
                                className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Server maintenance fallback
export function MaintenanceFallback() {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
            <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🔧</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Temporary Maintenance
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
                We're currently performing maintenance to improve your experience. Please try again in a few minutes.
            </p>
            <div className="text-sm text-gray-500">
                <p>Expected downtime: 5-10 minutes</p>
                <p className="mt-2">Thank you for your patience!</p>
            </div>
        </div>
    );
}

export default {
    GenericErrorFallback,
    NetworkErrorFallback,
    AuthErrorFallback,
    EmptyStateFallback,
    ListingNotFoundFallback,
    ImageErrorFallback,
    SearchErrorFallback,
    FormErrorFallback,
    MaintenanceFallback
};