import { useToast } from '../context/ToastContext';

// Error types for better categorization
export const ERROR_TYPES = {
    NETWORK: 'NETWORK',
    VALIDATION: 'VALIDATION',
    AUTHENTICATION: 'AUTHENTICATION',
    AUTHORIZATION: 'AUTHORIZATION',
    NOT_FOUND: 'NOT_FOUND',
    SERVER: 'SERVER',
    UNKNOWN: 'UNKNOWN'
};

// Categorize error based on status code and message
export const categorizeError = (error) => {
    if (!error) return ERROR_TYPES.UNKNOWN;

    // Network errors
    if (error.message?.includes('Failed to fetch') || error.message?.includes('Network Error')) {
        return ERROR_TYPES.NETWORK;
    }

    // HTTP status code based categorization
    if (error.status || error.response?.status) {
        const status = error.status || error.response?.status;
        
        switch (status) {
            case 400:
                return ERROR_TYPES.VALIDATION;
            case 401:
                return ERROR_TYPES.AUTHENTICATION;
            case 403:
                return ERROR_TYPES.AUTHORIZATION;
            case 404:
                return ERROR_TYPES.NOT_FOUND;
            case 500:
            case 502:
            case 503:
            case 504:
                return ERROR_TYPES.SERVER;
            default:
                return ERROR_TYPES.UNKNOWN;
        }
    }

    return ERROR_TYPES.UNKNOWN;
};

// Get user-friendly error message
export const getErrorMessage = (error, context = 'general') => {
    const errorType = categorizeError(error);
    const originalMessage = error.message || error.response?.data?.message || 'An error occurred';

    // Context-specific error messages
    const contextMessages = {
        marketplace: {
            [ERROR_TYPES.NETWORK]: 'Unable to connect to marketplace. Please check your internet connection.',
            [ERROR_TYPES.AUTHENTICATION]: 'Please log in to access marketplace features.',
            [ERROR_TYPES.AUTHORIZATION]: 'You don\'t have permission to perform this action.',
            [ERROR_TYPES.NOT_FOUND]: 'The requested listing was not found or has been removed.',
            [ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
            [ERROR_TYPES.SERVER]: 'Marketplace service is temporarily unavailable. Please try again later.',
            [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred in the marketplace.'
        },
        listing: {
            [ERROR_TYPES.NETWORK]: 'Unable to load listing. Please check your connection.',
            [ERROR_TYPES.NOT_FOUND]: 'This listing is no longer available.',
            [ERROR_TYPES.AUTHORIZATION]: 'You can only edit your own listings.',
            [ERROR_TYPES.VALIDATION]: 'Please fill in all required fields correctly.',
            [ERROR_TYPES.SERVER]: 'Unable to save listing. Please try again.',
            [ERROR_TYPES.UNKNOWN]: 'Failed to process listing request.'
        },
        search: {
            [ERROR_TYPES.NETWORK]: 'Search is temporarily unavailable.',
            [ERROR_TYPES.SERVER]: 'Search service is down. Please try browsing categories.',
            [ERROR_TYPES.UNKNOWN]: 'Search failed. Please try again.'
        },
        upload: {
            [ERROR_TYPES.VALIDATION]: 'Invalid file format or size. Please check image requirements.',
            [ERROR_TYPES.SERVER]: 'Image upload failed. Please try again.',
            [ERROR_TYPES.UNKNOWN]: 'Failed to upload images.'
        },
        contact: {
            [ERROR_TYPES.AUTHENTICATION]: 'Please log in to contact sellers.',
            [ERROR_TYPES.VALIDATION]: 'Please fill in all required fields.',
            [ERROR_TYPES.SERVER]: 'Unable to send message. Please try again.',
            [ERROR_TYPES.UNKNOWN]: 'Failed to contact seller.'
        }
    };

    // Get context-specific message or fall back to general
    const messages = contextMessages[context] || contextMessages.general || {};
    const contextMessage = messages[errorType];

    // Return context message if available, otherwise return original message
    return contextMessage || originalMessage;
};

// Retry configuration
export const RETRY_CONFIG = {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffFactor: 2
};

// Determine if error is retryable
export const isRetryableError = (error) => {
    const errorType = categorizeError(error);
    const retryableTypes = [ERROR_TYPES.NETWORK, ERROR_TYPES.SERVER];
    
    // Also check specific status codes
    const status = error.status || error.response?.status;
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    
    return retryableTypes.includes(errorType) || retryableStatuses.includes(status);
};

// Calculate retry delay with exponential backoff
export const calculateRetryDelay = (attempt) => {
    const delay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1);
    return Math.min(delay, RETRY_CONFIG.maxDelay);
};

// Async retry wrapper
export const withRetry = async (fn, context = 'general', customConfig = {}) => {
    const config = { ...RETRY_CONFIG, ...customConfig };
    let lastError;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            // Don't retry if error is not retryable or if this is the last attempt
            if (!isRetryableError(error) || attempt === config.maxAttempts) {
                break;
            }

            // Wait before retrying
            const delay = calculateRetryDelay(attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            console.log(`Retry attempt ${attempt} for ${context} after ${delay}ms delay`);
        }
    }

    // All attempts failed, throw the last error
    throw lastError;
};

// React hook for error handling
export const useErrorHandler = () => {
    const { showError, showWarning } = useToast();

    const handleError = (error, context = 'general', options = {}) => {
        const {
            showToast = true,
            logError = true,
            customMessage,
            onError
        } = options;

        // Log error for debugging
        if (logError) {
            console.error(`Error in ${context}:`, error);
        }

        // Get appropriate error message
        const message = customMessage || getErrorMessage(error, context);

        // Show toast notification
        if (showToast) {
            const errorType = categorizeError(error);
            if (errorType === ERROR_TYPES.NETWORK || errorType === ERROR_TYPES.SERVER) {
                showWarning(message, 8000); // Longer duration for network/server errors
            } else {
                showError(message, 6000);
            }
        }

        // Call custom error handler if provided
        if (onError) {
            onError(error, message);
        }

        return message;
    };

    const handleAsyncError = async (asyncFn, context = 'general', options = {}) => {
        try {
            return await asyncFn();
        } catch (error) {
            handleError(error, context, options);
            throw error; // Re-throw so caller can handle if needed
        }
    };

    const handleAsyncErrorWithRetry = async (asyncFn, context = 'general', options = {}) => {
        const { retryConfig, ...errorOptions } = options;
        
        try {
            return await withRetry(asyncFn, context, retryConfig);
        } catch (error) {
            handleError(error, context, errorOptions);
            throw error;
        }
    };

    return {
        handleError,
        handleAsyncError,
        handleAsyncErrorWithRetry,
        categorizeError,
        getErrorMessage,
        isRetryableError
    };
};

// Error boundary error reporter
export const reportErrorToBoundary = (error, errorInfo, context = 'unknown') => {
    const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
    };

    // Log to console
    console.error('Error Boundary Report:', errorReport);

    // Send to error tracking service if available
    if (window.gtag) {
        window.gtag('event', 'exception', {
            description: `${context}: ${error.message}`,
            fatal: false
        });
    }

    // Could also send to external error tracking service here
    // Example: Sentry, LogRocket, etc.
};

export default {
    ERROR_TYPES,
    categorizeError,
    getErrorMessage,
    isRetryableError,
    withRetry,
    useErrorHandler,
    reportErrorToBoundary
};