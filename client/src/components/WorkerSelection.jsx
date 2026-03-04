import { useState, useEffect } from "react";
import { HiMapPin, HiStar, HiClock, HiPhone, HiCheckCircle, HiAdjustmentsHorizontal } from "react-icons/hi2";
import { useToast } from "../context/ToastContext";

export default function WorkerSelection({ 
    serviceId, 
    userLocation, 
    onWorkerSelect, 
    selectedWorkerId = null 
}) {
    const [workers, setWorkers] = useState([]);
    const [filteredWorkers, setFilteredWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedWorker, setSelectedWorker] = useState(selectedWorkerId);
    const [showFilters, setShowFilters] = useState(false);
    const [showLocationInput, setShowLocationInput] = useState(false);
    const [manualLocation, setManualLocation] = useState({
        city: '',
        lat: '',
        lng: ''
    });
    const { showError, showSuccess } = useToast();

    // Predefined city locations
    const cityLocations = {
        'Mumbai': { lat: 19.0760, lng: 72.8777 },
        'Andheri': { lat: 19.1136, lng: 72.8697 },
        'Bandra': { lat: 19.0596, lng: 72.8295 },
        'Powai': { lat: 19.1176, lng: 72.9060 },
        'Thane': { lat: 19.2183, lng: 72.9781 },
        'Navi Mumbai': { lat: 19.0330, lng: 73.0297 },
        'Delhi': { lat: 28.6315, lng: 77.2167 },
        'Bangalore': { lat: 12.9352, lng: 77.6245 },
        'Pune': { lat: 18.5204, lng: 73.8567 },
        'Hyderabad': { lat: 17.3850, lng: 78.4867 },
        'Chennai': { lat: 13.0827, lng: 80.2707 },
        'Kolkata': { lat: 22.5726, lng: 88.3639 }
    };

    // Filter states - Default to 100km radius
    const [filters, setFilters] = useState({
        minRating: 0,
        maxDistance: 100, // km - increased to 100km
        sortBy: 'distance', // distance, rating, experience
        availability: 'all' // all, available, busy
    });

    useEffect(() => {
        fetchNearbyWorkers();
    }, [serviceId, userLocation]);

    useEffect(() => {
        applyFilters();
    }, [workers, filters]);

    const fetchNearbyWorkers = async (customLocation = null) => {
        try {
            setLoading(true);
            
            // Priority: customLocation > userLocation > default Mumbai
            let lat, lng;
            if (customLocation) {
                lat = customLocation.lat;
                lng = customLocation.lng;
            } else if (userLocation?.lat && userLocation?.lng) {
                lat = userLocation.lat;
                lng = userLocation.lng;
            } else {
                lat = 19.0760; // Default to Mumbai
                lng = 72.8777;
            }
            
            console.log('Fetching workers for location:', { lat, lng, radius: filters.maxDistance });
            
            const url = `${import.meta.env.VITE_BACKEND_URL || ''}/api/workers/nearby?serviceId=${serviceId || ''}&lat=${lat}&lng=${lng}&radius=${filters.maxDistance}`;
            console.log('API URL:', url);
            
            const response = await fetch(url, { credentials: 'include' });
            
            console.log('Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('API Response:', data);
                
                if (data.success) {
                    setWorkers(data.workers || []);
                    if (data.workers.length === 0) {
                        showError(`No workers found within ${filters.maxDistance}km. Try increasing the distance.`);
                    } else {
                        showSuccess(`Found ${data.workers.length} workers nearby`);
                    }
                } else {
                    showError(data.message || 'Failed to load workers');
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error:', errorData);
                showError(errorData.message || 'Failed to load nearby workers');
            }
        } catch (error) {
            console.error('Error fetching workers:', error);
            showError(`Failed to load workers: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCitySelect = (city) => {
        const location = cityLocations[city];
        if (location) {
            setManualLocation({ city, lat: location.lat, lng: location.lng });
            fetchNearbyWorkers(location);
            setShowLocationInput(false);
            showSuccess(`Searching for workers in ${city}`);
        }
    };

    const handleManualCoordinates = () => {
        const lat = parseFloat(manualLocation.lat);
        const lng = parseFloat(manualLocation.lng);
        
        if (isNaN(lat) || isNaN(lng)) {
            showError('Please enter valid coordinates');
            return;
        }
        
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            showError('Coordinates out of range');
            return;
        }
        
        fetchNearbyWorkers({ lat, lng });
        setShowLocationInput(false);
        showSuccess(`Searching at coordinates (${lat}, ${lng})`);
    };

    const applyFilters = () => {
        let filtered = [...workers];

        // Filter by rating
        if (filters.minRating > 0) {
            filtered = filtered.filter(w => (w.stats?.rating || 0) >= filters.minRating);
        }

        // Filter by distance
        const distanceInKm = parseFloat(filters.maxDistance);
        filtered = filtered.filter(w => {
            const distance = calculateDistance(w.location?.coordinates?.lat, w.location?.coordinates?.lng);
            return distance <= distanceInKm;
        });

        // Sort
        switch (filters.sortBy) {
            case 'rating':
                filtered.sort((a, b) => (b.stats?.rating || 0) - (a.stats?.rating || 0));
                break;
            case 'experience':
                filtered.sort((a, b) => (b.stats?.totalJobsCompleted || 0) - (a.stats?.totalJobsCompleted || 0));
                break;
            case 'distance':
            default:
                filtered.sort((a, b) => {
                    const distA = calculateDistance(a.location?.coordinates?.lat, a.location?.coordinates?.lng);
                    const distB = calculateDistance(b.location?.coordinates?.lat, b.location?.coordinates?.lng);
                    return distA - distB;
                });
        }

        setFilteredWorkers(filtered);
    };

    const handleWorkerSelect = (worker) => {
        setSelectedWorker(worker._id);
        if (onWorkerSelect) {
            onWorkerSelect(worker);
        }
        showSuccess(`${worker.first_name} selected!`);
    };

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
        
        // If distance changed, refetch workers
        if (filterName === 'maxDistance') {
            // Debounce the fetch to avoid too many requests
            setTimeout(() => {
                fetchNearbyWorkers();
            }, 500);
        }
    };

    const calculateDistance = (workerLat, workerLng) => {
        if (!userLocation?.lat || !userLocation?.lng || !workerLat || !workerLng) return 999;
        
        const R = 6371; // Earth's radius in km
        const dLat = (workerLat - userLocation.lat) * Math.PI / 180;
        const dLon = (workerLng - userLocation.lng) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(workerLat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const getDistanceText = (workerLat, workerLng) => {
        const distance = calculateDistance(workerLat, workerLng);
        return distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`;
    };

    const getEstimatedArrival = (distance) => {
        if (distance === 'N/A') return 'N/A';
        const distanceNum = parseFloat(distance);
        const minutes = Math.ceil(distanceNum * 3); // Assuming 20km/h average speed
        return `${minutes} mins`;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Finding nearby workers...</h3>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse flex gap-4">
                            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (workers.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-center mb-4">
                    <HiMapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium mb-2">No workers available nearby</p>
                    <p className="text-sm text-gray-500 mb-4">
                        Try selecting a different location or increasing the search radius.
                    </p>
                    {manualLocation.city ? (
                        <p className="text-xs text-gray-500 mb-4">
                            Currently searching in: <strong>{manualLocation.city}</strong> (within {filters.maxDistance}km)
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500 mb-4">
                            Searching within {filters.maxDistance}km of default location
                        </p>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                    {/* Workers Available In */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                            <HiMapPin className="h-4 w-4" />
                            Workers Currently Available In:
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <p className="font-medium text-green-800 mb-1">Mumbai (40+ workers):</p>
                                <ul className="text-green-700 space-y-0.5">
                                    <li>• Andheri, Bandra, Juhu</li>
                                    <li>• Powai, Kurla, Ghatkopar</li>
                                    <li>• Thane, Navi Mumbai</li>
                                    <li>• Dadar, Worli, Colaba</li>
                                    <li>• Malad, Kandivali, Borivali</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-medium text-green-800 mb-1">Other Cities:</p>
                                <ul className="text-green-700 space-y-0.5">
                                    <li>• Delhi (3 workers)</li>
                                    <li>• Bangalore (2 workers)</li>
                                </ul>
                                <p className="text-green-600 mt-2 text-xs">
                                    💡 Most workers in Mumbai area
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* City Selection */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-800 mb-2">📍 Select Your City:</p>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.keys(cityLocations).slice(0, 6).map(city => (
                                <button
                                    key={city}
                                    onClick={() => handleCitySelect(city)}
                                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-colors"
                                >
                                    {city}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowLocationInput(true)}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            See all cities or enter coordinates →
                        </button>
                    </div>

                    {/* Increase Radius */}
                    <div className="flex gap-2 justify-center">
                        <button 
                            onClick={() => {
                                setFilters(prev => ({ ...prev, maxDistance: 100 }));
                                setTimeout(() => fetchNearbyWorkers(), 100);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Search within 100km
                        </button>
                        <button 
                            onClick={() => fetchNearbyWorkers()}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* Header with Filters Toggle */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <HiMapPin className="h-5 w-5 text-blue-600" />
                        Select Your Worker
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        {filteredWorkers.length} worker{filteredWorkers.length !== 1 ? 's' : ''} available near you
                    </p>
                    {manualLocation.city ? (
                        <p className="text-xs text-blue-600 mt-1">
                            📍 Searching in: {manualLocation.city}
                        </p>
                    ) : userLocation?.lat && userLocation?.lng ? (
                        <p className="text-xs text-green-600 mt-1">
                            📍 Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                        </p>
                    ) : (
                        <p className="text-xs text-orange-600 mt-1">
                            📍 Using default location (Mumbai). Click "Set Location" to change.
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowLocationInput(!showLocationInput)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        title="Set your location"
                    >
                        📍 Set Location
                    </button>
                    <button
                        onClick={() => fetchNearbyWorkers()}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        title="Refresh workers"
                    >
                        🔄 Refresh
                    </button>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <HiAdjustmentsHorizontal className="h-5 w-5" />
                        <span className="text-sm font-medium">Filters</span>
                    </button>
                </div>
            </div>

            {/* Location Input Panel */}
            {showLocationInput && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-gray-800 mb-3">Set Your Location</h4>
                    
                    {/* Quick City Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select City
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.keys(cityLocations).map(city => (
                                <button
                                    key={city}
                                    onClick={() => handleCitySelect(city)}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                                        manualLocation.city === city
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {city}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Manual Coordinates */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Or Enter Coordinates Manually
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                step="0.0001"
                                placeholder="Latitude (e.g., 19.0760)"
                                value={manualLocation.lat}
                                onChange={(e) => setManualLocation(prev => ({ ...prev, lat: e.target.value }))}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="number"
                                step="0.0001"
                                placeholder="Longitude (e.g., 72.8777)"
                                value={manualLocation.lng}
                                onChange={(e) => setManualLocation(prev => ({ ...prev, lng: e.target.value }))}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleManualCoordinates}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Search
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            💡 Tip: You can find coordinates by searching your location on Google Maps
                        </p>
                    </div>
                </div>
            )}

            {/* Filters Panel */}
            {showFilters && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Min Rating Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Minimum Rating
                            </label>
                            <select
                                value={filters.minRating}
                                onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="0">Any Rating</option>
                                <option value="3">3+ Stars</option>
                                <option value="3.5">3.5+ Stars</option>
                                <option value="4">4+ Stars</option>
                                <option value="4.5">4.5+ Stars</option>
                            </select>
                        </div>

                        {/* Max Distance Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Maximum Distance: {filters.maxDistance}km
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={filters.maxDistance}
                                onChange={(e) => handleFilterChange('maxDistance', e.target.value)}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>1km</span>
                                <span>50km</span>
                                <span>100km</span>
                            </div>
                        </div>

                        {/* Sort By Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sort By
                            </label>
                            <select
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="distance">Nearest First</option>
                                <option value="rating">Highest Rated</option>
                                <option value="experience">Most Experienced</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={() => setFilters({
                            minRating: 0,
                            maxDistance: 100,
                            sortBy: 'distance',
                            availability: 'all'
                        })}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Reset Filters
                    </button>
                </div>
            )}

            {/* Workers List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredWorkers.map((worker) => {
                    const distance = getDistanceText(worker.location?.coordinates?.lat, worker.location?.coordinates?.lng);
                    const eta = getEstimatedArrival(distance);
                    const isSelected = selectedWorker === worker._id;

                    return (
                        <div
                            key={worker._id}
                            onClick={() => handleWorkerSelect(worker)}
                            className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                                isSelected 
                                    ? 'border-blue-600 bg-blue-50 shadow-md' 
                                    : 'border-gray-200 hover:border-blue-400 hover:shadow-sm'
                            }`}
                        >
                            {isSelected && (
                                <div className="absolute top-2 right-2">
                                    <HiCheckCircle className="h-6 w-6 text-blue-600" />
                                </div>
                            )}

                            <div className="flex gap-4">
                                {/* Worker Avatar */}
                                <div className="flex-shrink-0">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                        {worker.first_name?.[0]}{worker.last_name?.[0]}
                                    </div>
                                </div>

                                {/* Worker Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-1">
                                        <h4 className="font-semibold text-gray-900">
                                            {worker.first_name} {worker.last_name}
                                        </h4>
                                        <div className="flex items-center gap-1 text-sm">
                                            <HiStar className="h-4 w-4 text-yellow-400 fill-current" />
                                            <span className="font-medium">{worker.stats?.rating || '4.5'}</span>
                                            <span className="text-gray-500">({worker.stats?.totalRatings || '0'})</span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-600 mb-2">
                                        {worker.skills?.[0]?.serviceName || 'Professional Service Provider'}
                                    </p>

                                    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <HiMapPin className="h-4 w-4" />
                                            <span>{distance} away</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <HiClock className="h-4 w-4" />
                                            <span>{eta} arrival</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <HiPhone className="h-4 w-4" />
                                            <span>{worker.phone}</span>
                                        </div>
                                    </div>

                                    {worker.stats?.totalJobsCompleted && (
                                        <div className="mt-2 text-xs text-gray-500">
                                            {worker.stats.totalJobsCompleted} jobs completed
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredWorkers.length === 0 && workers.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">No workers match your filters.</p>
                    <p className="text-sm mb-4">
                        Current filters: Rating {filters.minRating}+, Distance {filters.maxDistance}km
                    </p>
                    <button
                        onClick={() => setFilters({
                            minRating: 0,
                            maxDistance: 100,
                            sortBy: 'distance',
                            availability: 'all'
                        })}
                        className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Reset Filters
                    </button>
                </div>
            )}
        </div>
    );
}
