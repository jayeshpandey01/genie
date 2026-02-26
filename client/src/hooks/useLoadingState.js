import { useState, useCallback, useRef } from 'react';

// Loading state types
export const LOADING_STATES = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error'
};

// Hook for managing loading states
export function useLoadingState(initialState = LOADING_STATES.IDLE) {
    const [state, setState] = useState(initialState);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const abortControllerRef = useRef(null);

    const setLoading = useCallback(() => {
        setState(LOADING_STATES.LOADING);
        setError(null);
    }, []);

    const setSuccess = useCallback((result = null) => {
        setState(LOADING_STATES.SUCCESS);
        setError(null);
        setData(result);
    }, []);

    const setError = useCallback((err) => {
        setState(LOADING_STATES.ERROR);
        setError(err);
    }, []);

    const reset = useCallback(() => {
        setState(LOADING_STATES.IDLE);
        setError(null);
        setData(null);
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    const execute = useCallback(async (asyncFn, options = {}) => {
        const { 
            onSuccess, 
            onError, 
            abortable = false,
            resetOnStart = true 
        } = options;

        if (resetOnStart) {
            reset();
        }
        
        setLoading();

        // Create abort controller if needed
        if (abortable) {
            abortControllerRef.current = new AbortController();
        }

        try {
            const result = await asyncFn(abortControllerRef.current?.signal);
            
            // Check if operation was aborted
            if (abortControllerRef.current?.signal.aborted) {
                return;
            }

            setSuccess(result);
            if (onSuccess) onSuccess(result);
            return result;
        } catch (err) {
            // Don't set error if operation was aborted
            if (err.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
                return;
            }

            setError(err);
            if (onError) onError(err);
            throw err;
        } finally {
            abortControllerRef.current = null;
        }
    }, [setLoading, setSuccess, setError, reset]);

    const abort = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setState(LOADING_STATES.IDLE);
    }, []);

    return {
        state,
        error,
        data,
        isLoading: state === LOADING_STATES.LOADING,
        isSuccess: state === LOADING_STATES.SUCCESS,
        isError: state === LOADING_STATES.ERROR,
        isIdle: state === LOADING_STATES.IDLE,
        setLoading,
        setSuccess,
        setError,
        reset,
        execute,
        abort
    };
}

// Hook for managing multiple loading states
export function useMultipleLoadingStates(keys = []) {
    const [states, setStates] = useState(() => 
        keys.reduce((acc, key) => ({
            ...acc,
            [key]: LOADING_STATES.IDLE
        }), {})
    );

    const [errors, setErrors] = useState({});
    const [data, setData] = useState({});

    const setLoading = useCallback((key) => {
        setStates(prev => ({ ...prev, [key]: LOADING_STATES.LOADING }));
        setErrors(prev => ({ ...prev, [key]: null }));
    }, []);

    const setSuccess = useCallback((key, result = null) => {
        setStates(prev => ({ ...prev, [key]: LOADING_STATES.SUCCESS }));
        setErrors(prev => ({ ...prev, [key]: null }));
        setData(prev => ({ ...prev, [key]: result }));
    }, []);

    const setError = useCallback((key, error) => {
        setStates(prev => ({ ...prev, [key]: LOADING_STATES.ERROR }));
        setErrors(prev => ({ ...prev, [key]: error }));
    }, []);

    const reset = useCallback((key) => {
        if (key) {
            setStates(prev => ({ ...prev, [key]: LOADING_STATES.IDLE }));
            setErrors(prev => ({ ...prev, [key]: null }));
            setData(prev => ({ ...prev, [key]: null }));
        } else {
            // Reset all
            setStates(keys.reduce((acc, k) => ({ ...acc, [k]: LOADING_STATES.IDLE }), {}));
            setErrors({});
            setData({});
        }
    }, [keys]);

    const getState = useCallback((key) => ({
        state: states[key] || LOADING_STATES.IDLE,
        error: errors[key] || null,
        data: data[key] || null,
        isLoading: states[key] === LOADING_STATES.LOADING,
        isSuccess: states[key] === LOADING_STATES.SUCCESS,
        isError: states[key] === LOADING_STATES.ERROR,
        isIdle: states[key] === LOADING_STATES.IDLE
    }), [states, errors, data]);

    const execute = useCallback(async (key, asyncFn, options = {}) => {
        const { onSuccess, onError } = options;
        
        setLoading(key);

        try {
            const result = await asyncFn();
            setSuccess(key, result);
            if (onSuccess) onSuccess(result);
            return result;
        } catch (err) {
            setError(key, err);
            if (onError) onError(err);
            throw err;
        }
    }, [setLoading, setSuccess, setError]);

    // Computed properties
    const isAnyLoading = Object.values(states).some(state => state === LOADING_STATES.LOADING);
    const hasAnyError = Object.values(states).some(state => state === LOADING_STATES.ERROR);
    const areAllSuccess = keys.length > 0 && keys.every(key => states[key] === LOADING_STATES.SUCCESS);

    return {
        states,
        errors,
        data,
        isAnyLoading,
        hasAnyError,
        areAllSuccess,
        setLoading,
        setSuccess,
        setError,
        reset,
        execute,
        getState
    };
}

// Hook for pagination loading states
export function usePaginationLoading() {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    const loadPage = useCallback(async (asyncFn, isInitial = true) => {
        if (isInitial) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }
        
        setError(null);

        try {
            const result = await asyncFn();
            return result;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    const reset = useCallback(() => {
        setIsLoading(false);
        setIsLoadingMore(false);
        setError(null);
    }, []);

    return {
        isLoading,
        isLoadingMore,
        error,
        loadPage,
        reset
    };
}

// Hook for form submission loading
export function useFormLoading() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const submit = useCallback(async (asyncFn, options = {}) => {
        const { onSuccess, onError, resetAfter = 3000 } = options;
        
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        try {
            const result = await asyncFn();
            setSubmitSuccess(true);
            
            if (onSuccess) onSuccess(result);
            
            // Auto-reset success state
            if (resetAfter > 0) {
                setTimeout(() => setSubmitSuccess(false), resetAfter);
            }
            
            return result;
        } catch (err) {
            setSubmitError(err);
            if (onError) onError(err);
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const reset = useCallback(() => {
        setIsSubmitting(false);
        setSubmitError(null);
        setSubmitSuccess(false);
    }, []);

    return {
        isSubmitting,
        submitError,
        submitSuccess,
        submit,
        reset
    };
}

export default {
    useLoadingState,
    useMultipleLoadingStates,
    usePaginationLoading,
    useFormLoading,
    LOADING_STATES
};