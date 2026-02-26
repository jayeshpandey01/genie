import { HiMagnifyingGlass, HiExclamationTriangle } from "react-icons/hi2";

export default function EmptyState({ 
    type = "no-results", 
    title, 
    description, 
    action,
    className = ""
}) {
    const getEmptyStateContent = () => {
        switch (type) {
            case "no-results":
                return {
                    icon: <HiMagnifyingGlass className="h-12 w-12 text-gray-400" />,
                    title: title || "No results found",
                    description: description || "Try adjusting your search or filters to find what you're looking for.",
                    suggestions: [
                        "Check your spelling",
                        "Try different keywords",
                        "Remove some filters",
                        "Browse categories instead"
                    ]
                };
            case "no-listings":
                return {
                    icon: <div className="text-6xl text-gray-300">📦</div>,
                    title: title || "No listings yet",
                    description: description || "Be the first to post an item in this category!",
                    suggestions: []
                };
            case "error":
                return {
                    icon: <HiExclamationTriangle className="h-12 w-12 text-red-400" />,
                    title: title || "Something went wrong",
                    description: description || "We're having trouble loading the listings. Please try again.",
                    suggestions: []
                };
            case "no-favorites":
                return {
                    icon: <div className="text-6xl text-gray-300">❤️</div>,
                    title: title || "No favorites yet",
                    description: description || "Items you favorite will appear here for easy access.",
                    suggestions: []
                };
            default:
                return {
                    icon: <div className="text-6xl text-gray-300">🔍</div>,
                    title: title || "Nothing here",
                    description: description || "There's nothing to show right now.",
                    suggestions: []
                };
        }
    };

    const content = getEmptyStateContent();

    return (
        <div className={`text-center py-12 px-4 ${className}`}>
            <div className="max-w-md mx-auto">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                    {content.icon}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {content.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 mb-6">
                    {content.description}
                </p>

                {/* Suggestions */}
                {content.suggestions.length > 0 && (
                    <div className="mb-6">
                        <p className="text-sm font-medium text-gray-700 mb-3">Try:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                            {content.suggestions.map((suggestion, index) => (
                                <li key={index}>• {suggestion}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Action Button */}
                {action && (
                    <div className="space-y-3">
                        {action}
                    </div>
                )}

                {/* Default Actions based on type */}
                {!action && type === "no-results" && (
                    <div className="space-y-3">
                        <button
                            onClick={() => window.location.href = '/marketplace'}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                        >
                            Browse All Categories
                        </button>
                    </div>
                )}

                {!action && type === "no-listings" && (
                    <div className="space-y-3">
                        <button
                            onClick={() => window.location.href = '/marketplace/create'}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                        >
                            Post Your First Item
                        </button>
                    </div>
                )}

                {!action && type === "error" && (
                    <div className="space-y-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}