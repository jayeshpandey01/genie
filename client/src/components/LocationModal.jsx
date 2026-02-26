import { useState, useEffect } from "react";
import { HiXMark, HiMapPin, HiMagnifyingGlass } from "react-icons/hi2";
import { MdMyLocation, MdLocationOn } from "react-icons/md";

export default function LocationModal({ isOpen, onClose, onLocationSelect }) {
    const [step, setStep] = useState('initial'); // initial, detecting, manual
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [manualLocation, setManualLocation] = useState({
        area: '',
        city: '',
        pincode: ''
    });
    const [detectedLocation, setDetectedLocation] = useState(null);

    useEffect(() => {
        // Check if location is already saved
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            const location = JSON.parse(savedLocation);
            setDetectedLocation(location);
        }
    }, []);

    const detectLocation = async () => {
        setStep('detecting');
        setLoading(true);
        setError('');

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setLoading(false);
            setStep('manual');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    
                    // Use Google Places API to get address details
                    const apiKey = import.meta.env.VITE_PLACES_NEW_API_KEY;
                    const response = await fetch(
                        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
                    );
                    
                    const data = await response.json();
                    
                    if (data.results && data.results.length > 0) {
                        const addressComponents = data.results[0].address_components;
                        const formattedAddress = data.results[0].formatted_address;
                        
                        let area = '';
                        let city = '';
                        let pincode = '';
                        
                        addressComponents.forEach(component => {
                            if (component.types.includes('sublocality') || component.types.includes('locality')) {
                                area = component.long_name;
                            }
                            if (component.types.includes('administrative_area_level_2')) {
                                city = component.long_name;
                            }
                            if (component.types.includes('postal_code')) {
                                pincode = component.long_name;
                            }
                        });

                        const locationData = {
                            area: area || formattedAddress.split(',')[0],
                            city: city || formattedAddress.split(',')[1]?.trim() || '',
                            pincode: pincode || '',
                            latitude,
                            longitude,
                            formattedAddress
                        };

                        setDetectedLocation(locationData);
                        localStorage.setItem('userLocation', JSON.stringify(locationData));
                        
                        if (onLocationSelect) {
                            onLocationSelect(locationData);
                        }
                        
                        setLoading(false);
                        
                        // Auto close after 1 second
                        setTimeout(() => {
                            onClose();
                        }, 1000);
                    } else {
                        throw new Error('Could not determine your location');
                    }
                } catch (err) {
                    console.error('Error getting location details:', err);
                    setError('Failed to get location details. Please enter manually.');
                    setLoading(false);
                    setStep('manual');
                }
            },
            (err) => {
                console.error('Geolocation error:', err);
                let errorMessage = 'Failed to detect location. ';
                
                switch(err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage += 'Please allow location access in your browser settings.';
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage += 'Location information is unavailable.';
                        break;
                    case err.TIMEOUT:
                        errorMessage += 'Location request timed out.';
                        break;
                    default:
                        errorMessage += 'An unknown error occurred.';
                }
                
                setError(errorMessage);
                setLoading(false);
                setStep('manual');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        
        if (!manualLocation.area || !manualLocation.city || !manualLocation.pincode) {
            setError('Please fill in all fields');
            return;
        }

        if (!/^\d{6}$/.test(manualLocation.pincode)) {
            setError('Please enter a valid 6-digit pincode');
            return;
        }

        const locationData = {
            ...manualLocation,
            formattedAddress: `${manualLocation.area}, ${manualLocation.city}, ${manualLocation.pincode}`,
            manual: true
        };

        localStorage.setItem('userLocation', JSON.stringify(locationData));
        
        if (onLocationSelect) {
            onLocationSelect(locationData);
        }
        
        onClose();
    };

    const handleInputChange = (field, value) => {
        setManualLocation(prev => ({
            ...prev,
            [field]: value
        }));
        setError('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <HiMapPin className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Select Location</h2>
                            <p className="text-sm text-gray-600">For better service experience</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <HiXMark className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Why Location Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                            <MdLocationOn className="w-5 h-5" />
                            Why we need your location?
                        </h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Show nearby service providers</li>
                            <li>• Accurate delivery time estimates</li>
                            <li>• Connect with local marketplace sellers</li>
                            <li>• Personalized service recommendations</li>
                        </ul>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Detected Location Display */}
                    {detectedLocation && step === 'initial' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <MdMyLocation className="w-5 h-5 text-green-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-semibold text-green-900 mb-1">Current Location</p>
                                    <p className="text-sm text-green-800">{detectedLocation.formattedAddress}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Initial Step - Choose Method */}
                    {step === 'initial' && (
                        <div className="space-y-3">
                            <button
                                onClick={detectLocation}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <MdMyLocation className="w-6 h-6" />
                                Detect My Location Automatically
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-gray-500">OR</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setStep('manual')}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-colors font-semibold"
                            >
                                <HiMagnifyingGlass className="w-6 h-6" />
                                Enter Location Manually
                            </button>
                        </div>
                    )}

                    {/* Detecting Step */}
                    {step === 'detecting' && loading && (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 animate-pulse">
                                <MdMyLocation className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Detecting your location...</h3>
                            <p className="text-sm text-gray-600">Please allow location access when prompted</p>
                        </div>
                    )}

                    {/* Success Step */}
                    {step === 'detecting' && !loading && detectedLocation && (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                <MdLocationOn className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Detected!</h3>
                            <p className="text-sm text-gray-600 mb-4">{detectedLocation.formattedAddress}</p>
                            <div className="inline-flex items-center gap-2 text-green-600">
                                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium">Saving location...</span>
                            </div>
                        </div>
                    )}

                    {/* Manual Entry Step */}
                    {step === 'manual' && (
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Area / Locality *
                                </label>
                                <input
                                    type="text"
                                    value={manualLocation.area}
                                    onChange={(e) => handleInputChange('area', e.target.value)}
                                    placeholder="e.g., Koramangala, MG Road"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    City *
                                </label>
                                <input
                                    type="text"
                                    value={manualLocation.city}
                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                    placeholder="e.g., Bangalore, Mumbai"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pincode *
                                </label>
                                <input
                                    type="text"
                                    value={manualLocation.pincode}
                                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                                    placeholder="e.g., 560001"
                                    maxLength="6"
                                    pattern="\d{6}"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Enter 6-digit pincode</p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep('initial')}
                                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                                >
                                    Confirm Location
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Privacy Note */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                            🔒 Your location is only used for service delivery and marketplace connections. 
                            We respect your privacy and never share your data without permission.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
