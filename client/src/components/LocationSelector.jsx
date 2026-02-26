import { HiMapPin, HiChevronDown } from "react-icons/hi2";
import { useUserLocation } from "../context/LocationContext";

export default function LocationSelector({ className = "" }) {
    const { location, getLocationString, openLocationModal } = useUserLocation();

    return (
        <button
            onClick={openLocationModal}
            className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group ${className}`}
        >
            <HiMapPin className={`w-5 h-5 ${location ? 'text-blue-600' : 'text-gray-400'} group-hover:text-blue-600`} />
            <div className="flex flex-col items-start">
                <span className="text-xs text-gray-500">Deliver to</span>
                <span className="text-sm font-semibold text-gray-900 max-w-[150px] truncate">
                    {getLocationString()}
                </span>
            </div>
            <HiChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
        </button>
    );
}
