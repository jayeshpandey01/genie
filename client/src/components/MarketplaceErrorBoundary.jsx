import ErrorBoundary from './ErrorBoundary';
import { HiHome, HiArrowPath } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';

export default function MarketplaceErrorBoundary({ children, section = 'marketplace' }) {
    const navigate = useNavigate();

    const handleError = (error, errorInfo) => {
        // Log marketplace-specific error context
        console.error(`Marketplace ${section} error:`, {
            error: error.message,
            section,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });

        // Report to error tracking service if available
        if (window.gtag) {
            window.gtag('event', 'exception', {
                description: `Marketplace ${section}: ${error.message}`,
                fatal: false
            });
        }
    };

    const fallbackRenderer = (error, retry) => {
        const getSectionTitle = () => {
            switch (section) {
                case 'listings': return 'Listings';
                case 'search': return 'Search';
                case 'filters': return 'Filters';
                case 'detail': return 'Listing Details';
                case 'form': return 'Listing Form';
                case 'images': return 'Image Gallery';
                case 'contact': return 'Contact Form';
                case 'admin': return 'Admin Panel';
                default: return 'Marketplace';
            }
        };

        const getSectionMessage = () => {
            switch (section) {
                case 'listings':
                    return 'Unable to load marketplace listings. This could be due to a network issue or server problem.';
                case 'search':
                    return 'Search functionality is temporarily unavailable. Please try browsing categories instead.';
                case 'filters':
                    return 'Filter options could not be loaded. You can still browse all listings.';
                case 'detail':
                    return 'This listing could not be loaded. It may have been removed or there could be a connection issue.';
                case 'form':
                    return 'The listing form encountered an error. Please check your input and try again.';
                case 'images':
                    return 'Image gallery could not be loaded. The listing information is still available below.';
                case 'contact':
                    return 'Contact form is temporarily unavailable. You can try calling the seller directly.';
                case 'admin':
                    return 'Admin panel encountered an error. Please check your permissions and try again.';
                default:
                    return 'The marketplace section encountered an unexpected error.';
            }
        };

        const getRecoveryActions = () => {
            const actions = [
                {
                    label: 'Try Again',
                    action: retry,
                    icon: HiArrowPath,
                    primary: true
                }
            ];

            // Add section-specific recovery actions
            switch (section) {
                case 'detail':
                    actions.push({
                        label: 'Back to Listings',
                        action: () => navigate('/marketplace'),
                        icon: HiHome
                    });
                    break;
                case 'form':
                    actions.push({
                        label: 'Back to Marketplace',
                        action: () => navigate('/marketplace'),
                        icon: HiHome
                    });
                    break;
                case 'search':
                case 'filters':
                    actions.push({
                        label: 'View All Listings',
                        action: () => navigate('/marketplace'),
                        icon: HiHome
                    });
                    break;
                default:
                    actions.push({
                        label: 'Go to Homepage',
                        action: () => navigate('/'),
                        icon: HiHome
                    });
            }

            return actions;
        };

        const recoveryActions = getRecoveryActions();

        return (
            <div className="min-h-[300px] flex items-center justify-center p-6">
                <div className="text-center max-w-lg">
                    <div className="mb-6">
                        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {getSectionTitle()} Error
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {getSectionMessage()}
                        </p>
                    </div>

                    <div className="space-y-3">
                        {recoveryActions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={index}
                                    onClick={action.action}
                                    className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                                        action.primary
                                            ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
                                    }`}
                                >
                                    <Icon className="h-4 w-4 mr-2" />
                                    {action.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Development error details */}
                    {process.env.NODE_ENV === 'development' && (
                        <details className="mt-6 text-left">
                            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                                Development Error Details
                            </summary>
                            <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-32">
                                <div className="mb-2">
                                    <strong>Section:</strong> {section}
                                </div>
                                <div className="mb-2">
                                    <strong>Error:</strong> {error?.message || 'Unknown error'}
                                </div>
                                <div className="mb-2">
                                    <strong>URL:</strong> {window.location.href}
                                </div>
                            </div>
                        </details>
                    )}
                </div>
            </div>
        );
    };

    return (
        <ErrorBoundary
            onError={handleError}
            fallback={fallbackRenderer}
            title={`${section.charAt(0).toUpperCase() + section.slice(1)} Error`}
            showDetails={process.env.NODE_ENV === 'development'}
        >
            {children}
        </ErrorBoundary>
    );
}