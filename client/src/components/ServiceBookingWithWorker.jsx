import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useUserLocation } from "../context/LocationContext";
import WorkerSelection from "./WorkerSelection";
import { HiCalendar, HiClock, HiMapPin } from "react-icons/hi2";

export default function ServiceBookingWithWorker({ service, onClose }) {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { showSuccess, showError } = useToast();
    const { userLocation } = useUserLocation();
    
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        setBookingDate(today);
    }, []);

    const handleWorkerSelect = (worker) => {
        setSelectedWorker(worker);
    };

    const handleBooking = async () => {
        if (!isAuthenticated) {
            showError('Please login to book a service');
            return;
        }

        if (!selectedWorker) {
            showError('Please select a worker');
            return;
        }

        if (!bookingDate || !bookingTime) {
            showError('Please select date and time');
            return;
        }

        if (!address.trim()) {
            showError('Please enter your address');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/bookings/create-with-worker', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    serviceId: service._id,
                    workerId: selectedWorker._id,
                    bookingDate,
                    bookingTime,
                    address,
                    notes,
                    location: userLocation
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showSuccess('Booking confirmed! Worker will arrive at scheduled time.');
                navigate('/bookings');
                if (onClose) onClose();
            } else {
                showError(data.message || 'Failed to create booking');
            }
        } catch (error) {
            console.error('Booking error:', error);
            showError('Failed to create booking. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Service Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-2xl font-bold mb-2">{service.title}</h2>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="font-semibold text-lg text-blue-600">₹{service.OurPrice}</span>
                    <span>•</span>
                    <span>{service.category}</span>
                </div>
            </div>

            {/* Worker Selection */}
            <WorkerSelection
                serviceId={service._id}
                userLocation={userLocation}
                onWorkerSelect={handleWorkerSelect}
                selectedWorkerId={selectedWorker?._id}
            />

            {/* Booking Details */}
            {selectedWorker && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Booking Details</h3>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <HiCalendar className="inline h-4 w-4 mr-1" />
                                Booking Date *
                            </label>
                            <input
                                type="date"
                                value={bookingDate}
                                onChange={(e) => setBookingDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <HiClock className="inline h-4 w-4 mr-1" />
                                Booking Time *
                            </label>
                            <input
                                type="time"
                                value={bookingTime}
                                onChange={(e) => setBookingTime(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <HiMapPin className="inline h-4 w-4 mr-1" />
                            Service Address *
                        </label>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Enter your complete address..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any special instructions or requirements..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Booking Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold mb-2">Booking Summary</h4>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Service:</span>
                                <span className="font-medium">{service.title}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Worker:</span>
                                <span className="font-medium">{selectedWorker.first_name} {selectedWorker.last_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Date & Time:</span>
                                <span className="font-medium">{bookingDate} at {bookingTime}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-300">
                                <span className="text-gray-900 font-semibold">Total:</span>
                                <span className="text-blue-600 font-bold text-lg">₹{service.OurPrice}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={handleBooking}
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {loading ? 'Confirming...' : 'Confirm Booking'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
