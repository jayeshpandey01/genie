import { useState, useRef, useEffect } from "react";
import { HiChevronDown } from "react-icons/hi2";

export default function CustomSelect({ 
    id,
    name,
    value, 
    onChange, 
    options = [], 
    placeholder = "Select an option",
    error = false,
    disabled = false,
    className = ""
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState("");
    const dropdownRef = useRef(null);

    // Debug: Log options when component mounts or options change
    useEffect(() => {
        console.log(`CustomSelect [${name}] - Options:`, options);
    }, [options, name]);

    // Update selected label when value changes
    useEffect(() => {
        if (value) {
            const selected = options.find(opt => opt.value === value);
            setSelectedLabel(selected ? selected.label : "");
        } else {
            setSelectedLabel("");
        }
    }, [value, options]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange({ target: { name, value: optionValue } });
        setIsOpen(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div ref={dropdownRef} className="relative">
            {/* Select Button */}
            <button
                type="button"
                id={id}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={`w-full px-3 py-2 border rounded-lg text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white flex items-center justify-between ${
                    error ? 'border-red-500' : 'border-gray-300'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className={selectedLabel ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedLabel || placeholder}
                </span>
                <HiChevronDown 
                    className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Options */}
            {isOpen && (
                <div 
                    className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    role="listbox"
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelect(option.value)}
                            className={`w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors ${
                                value === option.value ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-900'
                            }`}
                            role="option"
                            aria-selected={value === option.value}
                        >
                            {option.label}
                        </button>
                    ))}
                    {options.length === 0 && (
                        <div className="px-3 py-2 text-gray-500 text-center">
                            No options available
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
