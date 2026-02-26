import { useState, useEffect, useRef, memo } from "react";
import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";
import { useDebounce, useDebouncedSearch } from "../hooks/useDebounce";
import { useCachedSearchSuggestions } from "../hooks/useCache";

const SearchBar = memo(function SearchBar({ 
    value = "", 
    onChange, 
    onSubmit, 
    placeholder = "Search for items...",
    showAutocomplete = true,
    className = ""
}) {
    const [localValue, setLocalValue] = useState(value);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestion, setActiveSuggestion] = useState(-1);
    const inputRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Debounced search query for autocomplete
    const debouncedQuery = useDebounce(localValue, 300);
    
    // Cached suggestions
    const { 
        data: suggestions = [], 
        loading: suggestionsLoading 
    } = useCachedSearchSuggestions(debouncedQuery);

    // Ensure suggestions is always an array
    const safeSuggestions = Array.isArray(suggestions) ? suggestions : [];

    // Update local value when prop changes
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Show suggestions when we have them and input is focused
    useEffect(() => {
        if (showAutocomplete && safeSuggestions.length > 0 && debouncedQuery.length >= 2) {
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    }, [safeSuggestions, debouncedQuery, showAutocomplete]);

    // Handle input change
    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        setActiveSuggestion(-1);
        
        if (onChange) {
            onChange(newValue);
        }
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        setShowSuggestions(false);
        
        if (onSubmit) {
            onSubmit(localValue);
        }
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion) => {
        setLocalValue(suggestion);
        setShowSuggestions(false);
        setActiveSuggestion(-1);
        
        if (onChange) {
            onChange(suggestion);
        }
        
        if (onSubmit) {
            onSubmit(suggestion);
        }
    };

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (!showSuggestions || safeSuggestions.length === 0) {
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev < safeSuggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveSuggestion(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (activeSuggestion >= 0) {
                    handleSuggestionClick(safeSuggestions[activeSuggestion]);
                } else {
                    handleSubmit(e);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setActiveSuggestion(-1);
                inputRef.current?.blur();
                break;
        }
    };

    // Clear search
    const clearSearch = () => {
        setLocalValue("");
        setShowSuggestions(false);
        setActiveSuggestion(-1);
        
        if (onChange) {
            onChange("");
        }
        
        inputRef.current?.focus();
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                suggestionsRef.current && 
                !suggestionsRef.current.contains(event.target) &&
                !inputRef.current?.contains(event.target)
            ) {
                setShowSuggestions(false);
                setActiveSuggestion(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`}>
            <form onSubmit={handleSubmit} className="relative">
                {/* Search Input */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <HiMagnifyingGlass className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={localValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            if (safeSuggestions.length > 0) {
                                setShowSuggestions(true);
                            }
                        }}
                        placeholder={placeholder}
                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                        autoComplete="off"
                    />
                    {localValue && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 text-gray-400"
                        >
                            <HiXMark className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* Submit Button - Hidden by default, can be shown via CSS */}
                <button
                    type="submit"
                    className="sr-only"
                    aria-label="Search"
                >
                    Search
                </button>
            </form>

            {/* Autocomplete Suggestions */}
            {showAutocomplete && showSuggestions && (
                <div 
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                    {suggestionsLoading && (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            Searching...
                        </div>
                    )}
                    
                    {!suggestionsLoading && safeSuggestions.length === 0 && localValue.length >= 2 && (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            No suggestions found
                        </div>
                    )}
                    
                    {!suggestionsLoading && safeSuggestions.length > 0 && (
                        <ul className="py-1">
                            {safeSuggestions.map((suggestion, index) => (
                                <li key={index}>
                                    <button
                                        type="button"
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                                            activeSuggestion === index ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            <HiMagnifyingGlass className="h-4 w-4 mr-2 text-gray-400" />
                                            <span>{suggestion}</span>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
});

export default SearchBar;