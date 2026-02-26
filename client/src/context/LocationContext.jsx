import { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

export const useUserLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useUserLocation must be used within LocationProvider');
    }
    return context;
};

export const LocationProvider = ({ children }) => {
    const [location, setLocation] = useState(null);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load saved location on mount
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            try {
                setLocation(JSON.parse(savedLocation));
            } catch (error) {
                console.error('Error parsing saved location:', error);
                localStorage.removeItem('userLocation');
            }
        }
        setLoading(false);
    }, []);

    const updateLocation = (newLocation) => {
        setLocation(newLocation);
        if (newLocation) {
            localStorage.setItem('userLocation', JSON.stringify(newLocation));
        } else {
            localStorage.removeItem('userLocation');
        }
    };

    const clearLocation = () => {
        setLocation(null);
        localStorage.removeItem('userLocation');
    };

    const openLocationModal = () => {
        setIsLocationModalOpen(true);
    };

    const closeLocationModal = () => {
        setIsLocationModalOpen(false);
    };

    const getLocationString = () => {
        if (!location) return 'Select Location';
        if (location.area && location.city) {
            return `${location.area}, ${location.city}`;
        }
        return location.formattedAddress || 'Location Set';
    };

    const value = {
        location,
        setLocation: updateLocation,
        clearLocation,
        isLocationModalOpen,
        openLocationModal,
        closeLocationModal,
        getLocationString,
        loading,
        hasLocation: !!location
    };

    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
};
