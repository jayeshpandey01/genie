import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing values
 * @param {any} value - The value to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {any} The debounced value
 */
export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Set up a timer to update the debounced value after the delay
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clean up the timer if value changes before delay completes
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Custom hook for debounced callbacks
 * @param {Function} callback - The callback function to debounce
 * @param {number} delay - The delay in milliseconds
 * @param {Array} dependencies - Dependencies array for the callback
 * @returns {Function} The debounced callback function
 */
export function useDebouncedCallback(callback, delay, dependencies = []) {
    const [debouncedCallback, setDebouncedCallback] = useState(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedCallback(() => callback);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [...dependencies, delay]);

    return debouncedCallback;
}

/**
 * Custom hook for debounced search functionality
 * @param {string} searchTerm - The search term to debounce
 * @param {Function} onSearch - The search callback function
 * @param {number} delay - The delay in milliseconds (default: 300)
 * @param {number} minLength - Minimum length before triggering search (default: 2)
 */
export function useDebouncedSearch(searchTerm, onSearch, delay = 300, minLength = 2) {
    const [isSearching, setIsSearching] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, delay);

    useEffect(() => {
        if (debouncedSearchTerm.length >= minLength) {
            setIsSearching(true);
            onSearch(debouncedSearchTerm).finally(() => {
                setIsSearching(false);
            });
        } else if (debouncedSearchTerm.length === 0) {
            // Clear search when empty
            onSearch('').finally(() => {
                setIsSearching(false);
            });
        }
    }, [debouncedSearchTerm, onSearch, minLength]);

    return {
        isSearching,
        debouncedSearchTerm
    };
}

export default useDebounce;