import { useState, useEffect } from "react";
import { getAllBookings, updateBookingStatus } from "../../utils/api";
import { format } from "date-fns";
import { ImageOff } from "lucide-react";
import axios from "axios";

export default function AdminBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [workers, setWorkers] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedWorker, setSelectedWorker] = useState("");
    const [workerNotes, setWorkerNotes] = useState("");
    const [assignLoading, setAssignLoading] = useState(false);

    useEffect(() => {
        fetchBookings();
        fetchWorkers();
    }, []);

    const fetchBookings = async () => {
        try {
            const data = await getAllBookings();
            setBookings(data || []);
            setError(null);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            setError("Failed to load bookings. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkers = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/admin/bookings/available-workers`,
                { withCredentials: true }
            );
            if (response.data.success) {
                setWorkers(response.data.workers);
            }
        } catch (error) {
            console.error("Error fetching workers:", error);
        }
    };

    const handleStatusUpdate = async (bookingId, newStatus) => {
        try {
            await updateBookingStatus(bookingId, newStatus);
            // Refresh bookings after status update
            fetchBookings();
        } catch (error) {
            console.error("Error updating booking status:", error);
            alert("Failed to update booking status");
        }
    };

    const openAssignModal = (booking) => {
        setSelectedBooking(booking);
        setSelectedWorker(booking.assignedWorker?._id || "");
        setWorkerNotes(booking.workerNotes || "");
        setShowAssignModal(true);
    };

    const closeAssignModal = () => {
        setShowAssignModal(false);
        setSelectedBooking(null);
        setSelectedWorker("");
        setWorkerNotes("");
    };

    const handleAssignWorker = async () => {
        if (!selectedWorker) {
            alert("Please select a worker");
            return;
        }

        setAssignLoading(true);
        try {
            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/admin/bookings/${selectedBooking._id}/assign-worker`,
                {
                    workerId: selectedWorker,
                    notes: workerNotes
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                alert("Worker assigned successfully!");
                closeAssignModal();
                fetchBookings();
            }
        } catch (error) {
            console.error("Error assigning worker:", error);
            alert(error.response?.data?.message || "Failed to assign worker");
        } finally {
            setAssignLoading(false);
        }
    };

    const handleUnassignWorker = async (bookingId) => {
        if (!confirm("Are you sure you want to unassign the worker?")) {
            return;
        }

        try {
            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/admin/bookings/${bookingId}/unassign-worker`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                alert("Worker unassigned successfully!");
                fetchBookings();
            }
        } catch (error) {
            console.error("Error unassigning worker:", error);
            alert("Failed to unassign worker");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "SERVICE_BOOKED":
                return "bg-yellow-100 text-yellow-800 border-yellow-800";
            case "PROVIDER_ASSIGNED":
                return "bg-blue-100 text-blue-800 border-blue-800";
            case "SERVICE_COMPLETED":
                return "bg-green-100 text-green-800 border-green-800";
            case "COD_PENDING":
                return "bg-orange-100 text-orange-800 border-orange-800";
            case "COD_PAID":
                return "bg-green-100 text-green-800 border-green-800";
            default:
                return "bg-gray-100 text-gray-800 border-gray-800";
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case "COD_PENDING":
                return "bg-orange-100 text-orange-800 border-orange-800";
            case "COD_PAID":
                return "bg-green-100 text-green-800 border-green-800";
            case "PAYMENT_AUTHORIZED":
                return "bg-green-100 text-green-800 border-green-800";
            default:
                return "bg-gray-100 text-gray-800 border-gray-800";
        }
    };

    if (loading) {
        return <div className="p-6">Loading bookings...</div>;
    }

    if (error) {
        return <div className="p-6 text-red-600">{error}</div>;
    }

    return (
        <div>
            <h1 className="text-4xl font-[NeuwMachinaBold] truncate mb-6 uppercase">Manage Bookings</h1>
            
            {/* Assign Worker Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h2 className="text-2xl font-bold mb-4">Assign Worker</h2>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                Order: #{selectedBooking?.orderId}
                            </p>
                            <p className="text-sm text-gray-600 mb-4">
                                Services: {selectedBooking?.items.map(item => item.title).join(", ")}
                            </p>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Select Worker</label>
                            <select
                                value={selectedWorker}
                                onChange={(e) => setSelectedWorker(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            >
                                <option value="">-- Select Worker --</option>
                                {workers.map((worker) => (
                                    <option key={worker._id} value={worker._id}>
                                        {worker.first_name} {worker.last_name} - {worker.skills.map(s => s.serviceName).join(", ")} 
                                        (Rating: {worker.stats.rating.toFixed(1)} ⭐, Jobs: {worker.stats.totalJobsCompleted})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                            <textarea
                                value={workerNotes}
                                onChange={(e) => setWorkerNotes(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                rows="3"
                                placeholder="Add any special instructions for the worker..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleAssignWorker}
                                disabled={assignLoading}
                                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {assignLoading ? "Assigning..." : "Assign Worker"}
                            </button>
                            <button
                                onClick={closeAssignModal}
                                disabled={assignLoading}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {bookings.map((booking) => (
                    <div
                        key={booking.orderId}
                        className="bg-yellow-100 bg-opacity-40 rounded-lg shadow-md border border-neutral-950"
                    >
                        <div className="p-4 border-b border-neutral-950 flex justify-between items-center">
                            <div className="space-x-6">
                                <span className="font-medium">
                                    Order #{booking.orderId}
                                </span>
                                <span className="text-gray-600">
                                    {format(
                                        new Date(booking.createdAt),
                                        "PPpp"
                                    )}
                                </span>
                                {booking.paymentMethod === 'cod' && (
                                    <span className="text-sm font-medium text-blue-600">
                                        💵 COD
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <span
                                    className={`px-3 py-1 text-xs font-semibold rounded border ${getStatusColor(
                                        booking.status
                                    )}`}
                                >
                                    {booking.status.replace(/_/g, " ")}
                                </span>
                                <select
                                    className="border rounded px-2 py-1 text-sm"
                                    value={booking.status}
                                    onChange={(e) =>
                                        handleStatusUpdate(
                                            booking._id,
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="SERVICE_BOOKED">
                                        Service Booked
                                    </option>
                                    <option value="PROVIDER_ASSIGNED">
                                        Provider Assigned
                                    </option>
                                    <option value="SERVICE_COMPLETED">
                                        Service Completed
                                    </option>
                                    {booking.paymentMethod === 'cod' && (
                                        <>
                                            <option value="COD_PENDING">
                                                COD - Payment Pending
                                            </option>
                                            <option value="COD_PAID">
                                                COD - Payment Received
                                            </option>
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="mb-4 grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="font-medium mb-2">
                                        Customer Details
                                    </h3>
                                    <div className="text-sm text-gray-600">
                                        <p>Name: {booking.customerDetails.name}</p>
                                        <p>Email: {booking.customerDetails.email}</p>
                                        <p>Phone: {booking.customerDetails.phone}</p>
                                    </div>
                                </div>
                                {booking.paymentMethod === 'cod' && (
                                    <div>
                                        <h3 className="font-medium mb-2">
                                            Payment Information
                                        </h3>
                                        <div className="text-sm">
                                            <p className="text-gray-600">Method: <span className="font-medium text-gray-900">Cash on Delivery</span></p>
                                            <p className="text-gray-600">
                                                Status: 
                                                <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded border ${getPaymentStatusColor(booking.status)}`}>
                                                    {booking.status === 'COD_PENDING' ? 'Payment Pending' : 
                                                     booking.status === 'COD_PAID' ? 'Payment Received' : 
                                                     booking.status.replace(/_/g, ' ')}
                                                </span>
                                            </p>
                                            {booking.status === 'COD_PENDING' && (
                                                <p className="text-orange-600 text-xs mt-1">
                                                    ⚠️ Collect payment upon service completion
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Worker Assignment Section */}
                            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h3 className="font-medium mb-3 flex items-center justify-between">
                                    <span>Worker Assignment</span>
                                    {booking.assignedWorker ? (
                                        <button
                                            onClick={() => handleUnassignWorker(booking._id)}
                                            className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                        >
                                            Unassign
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => openAssignModal(booking)}
                                            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                            Assign Worker
                                        </button>
                                    )}
                                </h3>
                                {booking.assignedWorker ? (
                                    <div className="text-sm">
                                        <p className="text-gray-900 font-medium">
                                            {booking.assignedWorker.first_name} {booking.assignedWorker.last_name}
                                        </p>
                                        <p className="text-gray-600">Email: {booking.assignedWorker.email}</p>
                                        <p className="text-gray-600">Phone: {booking.assignedWorker.phone}</p>
                                        {booking.assignedAt && (
                                            <p className="text-gray-500 text-xs mt-1">
                                                Assigned: {format(new Date(booking.assignedAt), "PPp")}
                                            </p>
                                        )}
                                        {booking.workerNotes && (
                                            <p className="text-gray-600 text-xs mt-2 italic">
                                                Notes: {booking.workerNotes}
                                            </p>
                                        )}
                                        <button
                                            onClick={() => openAssignModal(booking)}
                                            className="text-xs text-blue-600 hover:underline mt-2"
                                        >
                                            Change Worker
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">
                                        No worker assigned yet. Click "Assign Worker" to assign.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-4">
                                {booking.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-4 border-t border-gray-400 pt-4"
                                    >
                                        {item.image ? (
                                            <img
                                                src={`${
                                                    import.meta.env.VITE_BACKEND_URL
                                                }/${item.image}`}
                                                alt={item.title}
                                                className="w-24 h-16 object-cover rounded"
                                            />
                                        ) : (
                                            <div className="w-24 h-16 flex flex-col gap-1 items-center justify-center bg-gray-100 rounded">
                                                <ImageOff
                                                    size={16}
                                                    color="#525252"
                                                />
                                                <span className="text-xs text-gray-500">
                                                    No image
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h4 className="font-medium">
                                                {item.title}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                Quantity: {item.quantity} × ₹
                                                {item.price}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">
                                                ₹{item.total}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-400">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal:</span>
                                    <span>₹{booking.summary.subtotal}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Tax:</span>
                                    <span>₹{booking.summary.tax}</span>
                                </div>
                                <div className="flex justify-between font-medium mt-2 pt-2 border-t border-neutral-500">
                                    <span>Total:</span>
                                    <span>₹{booking.summary.total}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 