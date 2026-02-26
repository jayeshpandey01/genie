import { useState, useEffect, useCallback } from 'react';
import { HiArrowPath, HiExclamationTriangle } from 'react-icons/hi2';
import { useErrorHandler, isRetryableError, calculateRetryDelay } from '../utils/errorHandler';

export default function RetryWrapper({ 
    children, 
    onRetry, 
    maxAttempts = 3, 
    context = 'general',
    showRetryButton = true,
    autoRetry = false,
    retryDelay = 1000,
    fallback = null
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [attemptCount, setAttemptCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    const { handleError, getErrorMessage } = useErrorHandler();

    // Auto retry logic
    useEffect(() => {
        if (autoRetry && error && isRetryableError(error) && attemptCount < maxAttempts) {
            const delay = calculateRetryDelay(attemptCount + 1);
            const timer = setTimeout(() => {
                handleRetry();
            }, delay);

            return () => clearTimeout(timer);
        }
    }, [error, attemptCount, autoRetry, maxAttempts]);

    const handleRetry = useCallback(async () => {
        if (attemptCount >= maxAttempts) {
            return;
        }

        setIsRetrying(true);
        setError(null);
        setAttemptCount(prev => prev + 1);

        try {
            if (onRetry) {
                await onRetry();
            }
        } catch (err) {
            setError(err);
            handleError(err, context, { showToast: false }); // Don't show toast, we'll handle UI
        } finally {
            setIsRetrying(false);
        }
    }, [onRetry, attemptCount, maxAttempts, context, handleError]);

    const resetRetry = useCallback(() => {
        setError(null);
        setAttemptCount(0);
        setIsRetrying(false);
    }, []);

    // Provide retry context to children
    const retryContext = {
        isLoading,
        setIsLoading,
        error,
        setError,
        attemptCount,
        isRetrying,
        handleRetry,
        resetRetry,
        canRetry: attemptCount < maxAttempts && isRetryableError(error)
    };

    // If there's an error and we've exceeded max attempts, show error UI
    if (error && (attemptCount >= maxAttempts || !isRetryableError(error))) {
        if (fallback) {
            return fallback(error, handleRetry, retryContext);
        }

        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <HiExclamationTriangle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Unable to Load Content
                </h3>
                <p className="text-gray-600 mb-4 max-w-md">
                    {getErrorMessage(error, context)}
                </p>
                
                {showRetryButton && isRetryableError(error) && (
                    <button
                        onClick={() => {
                            setAttemptCount(0);
                            handleRetry();
                        }}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                        <HiArrowPath className="h-4 w-4 mr-2" />
                        Try Again
                    </button>
                )}

                {attemptCount >= maxAttempts && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md">
                        <p className="text-sm text-yellow-800">
                            Multiple attempts failed. Please check your connection and try again later.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // Show retry indicator during auto-retry
    if (isRetrying && autoRetry) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">
                    Retrying... (Attempt {attemptCount + 1} of {maxAttempts})
                </p>
            </div>
        );
    }

    // Render children with retry context
    if (typeof children === 'function') {
        return children(retryContext);
    }

    return children;
}

// Higher-order component version
export const withRetry = (WrappedComponent, retryOptions = {}) => {
    return function RetryWrappedComponent(props) {
        return (
            <RetryWrapper {...retryOptions}>
                {(retryContext) => (
                    <WrappedComponent {...props} retryContext={retryContext} />
                )}
            </RetryWrapper>
        );
    };
};

// Hook for using retry functionality
export const useRetry = (asyncFn, dependencies = [], options = {}) => {
    const {
        maxAttempts = 3,
        context = 'general',
        autoRetry = false,
        onError
    } = options;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [attemptCount, setAttemptCount] = useState(0);
    const { handleError } = useErrorHandler();

    const execute = useCallback(async () => {
        if (attemptCount >= maxAttempts) {
            return;
        }

        setIsLoading(true);
        setError(null);
        setAttemptCount(prev => prev + 1);

        try {
            const result = await asyncFn();
            setData(result);
            setAttemptCount(0); // Reset on success
            return result;
        } catch (err) {
            setError(err);
            
            if (onError) {
                onError(err);
            } else {
                handleError(err, context, { showToast: true });
            }
            
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [asyncFn, attemptCount, maxAttempts, context, handleError, onError]);

    const retry = useCallback(() => {
        return execute();
    }, [execute]);

    const reset = useCallback(() => {
        setError(null);
        setData(null);
        setAttemptCount(0);
        setIsLoading(false);
    }, []);

    // Auto-execute on mount and dependency changes
    useEffect(() => {
        execute();
    }, dependencies);

    // Auto-retry logic
    useEffect(() => {
        if (autoRetry && error && isRetryableError(error) && attemptCount < maxAttempts) {
            const delay = calculateRetryDelay(attemptCount);
            const timer = setTimeout(() => {
                retry();
            }, delay);

            return () => clearTimeout(timer);
        }
    }, [error, attemptCount, autoRetry, maxAttempts, retry]);

    return {
        data,
        error,
        isLoading,
        attemptCount,
        canRetry: attemptCount < maxAttempts && isRetryableError(error),
        retry,
        reset,
        execute
    };
};