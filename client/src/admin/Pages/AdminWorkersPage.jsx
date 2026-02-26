import { useState, useEffect } from "react";
import axios from "axios";
import AdminNavbar from "../Components/AdminNavbar";
import AdminSidebar from "../Components/AdminSidebar";

export default function AdminWorkersPage() {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchWorkers();
    }, [filter]);

    const fetchWorkers = async () => {
        try {
            setLoading(true);
            const params = filter !== "all" ? { status: filter } : {};
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/admin/workers`,
                { 
                    params,
                    withCredentials: true 
                }
            );
            setWorkers(response.data.workers || []);
        } catch (error) {
            console.error("Error fetching workers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (workerId) => {
        try {
            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/admin/workers/${workerId}/approve`,
                {},
                { withCredentials: true }
            );
            fetchWorkers();
            setShowModal(false);
            alert("Worker approved successfully!");
        } catch (error) {
            console.error("Error approving worker:", error);
            alert("Failed to approve worker");
        }
    };

    const handleReject = async (workerId) => {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;

        try {
            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/admin/workers/${workerId}/reject`,
                { reason },
                { withCredentials: true }
            );
            fetchWorkers();
            setShowModal(false);
            alert("Worker rejected");
        } catch (error) {
            console.error("Error rejecting worker:", error);
            alert("Failed to reject worker");
        }
    };

    const handleSuspend = async (workerId) => {
        const reason = prompt("Enter suspension reason:");
        if (!reason) return;

        try {
            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/admin/workers/${workerId}/suspend`,
                { reason },
                { withCredentials: true }
            );
            fetchWorkers();
            setShowModal(false);
            alert("Worker suspended");
        } catch (error) {
            console.error("Error suspending worker:", error);
            alert("Failed to suspend worker");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "bg-yellow-100 text-yellow-800";
            case "approved": return "bg-green-100 text-green-800";
            case "rejected": return "bg-red-100 text-red-800";
            case "suspended": return "bg-gray-100 text-gray-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AdminNavbar />
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-gray-900">Worker Management</h1>
                            <p className="text-gray-600 mt-2">Manage service workers and their applications</p>
                        </div>

                        {/* Filters */}
                        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilter("all")}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        filter === "all"
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                    All Workers
                                </button>
                                <button
                                    onClick={() => setFilter("pending")}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        filter === "pending"
                                            ? "bg-yellow-600 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                    Pending
                                </button>
                                <button
                                    onClick={() => setFilter("approved")}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        filter === "approved"
                                            ? "bg-green-600 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                    Approved
                                </button>
                                <button
                                    onClick={() => setFilter("rejected")}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        filter === "rejected"
                                            ? "bg-red-600 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                    Rejected
                                </button>
                            </div>
                        </div>

                        {/* Workers List */}
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                <p className="mt-4 text-gray-600">Loading workers...</p>
                            </div>
                        ) : workers.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                <p className="text-gray-500">No workers found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {workers.map((worker) => (
                                    <div
                                        key={worker._id}
                                        className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-semibold text-gray-900">
                                                        {worker.first_name} {worker.last_name}
                                                    </h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(worker.status)}`}>
                                                        {worker.status}
                                                    </span>
                                                </div>
                                                <div className="space-y-1 text-sm text-gray-600 mb-4">
                                                    <p>📧 {worker.email}</p>
                                                    <p>📱 {worker.phone}</p>
                                                    {worker.location?.city && (
                                                        <p>📍 {worker.location.city}, {worker.location.state}</p>
                                                    )}
                                                </div>

                                                {/* Skills */}
                                                {worker.skills && worker.skills.length > 0 && (
                                                    <div className="mb-4">
                                                        <p className="text-sm font-medium text-gray-700 mb-2">Skills:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {worker.skills.map((skill, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
                                                                >
                                                                    <p className="text-sm font-medium text-blue-900">
                                                                        {skill.serviceName}
                                                                    </p>
                                                                    <p className="text-xs text-blue-700">
                                                                        {skill.experienceYears} years experience
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Stats */}
                                                <div className="flex gap-4 text-sm text-gray-600">
                                                    <span>⭐ Rating: {worker.stats?.rating?.toFixed(1) || "N/A"}</span>
                                                    <span>✅ Jobs: {worker.stats?.totalJobsCompleted || 0}</span>
                                                    <span>📅 Joined: {new Date(worker.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2 ml-4">
                                                <button
                                                    onClick={() => {
                                                        setSelectedWorker(worker);
                                                        setShowModal(true);
                                                    }}
                                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                                >
                                                    View Details
                                                </button>
                                                {worker.status === "pending" && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(worker._id)}
                                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(worker._id)}
                                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {worker.status === "approved" && (
                                                    <button
                                                        onClick={() => handleSuspend(worker._id)}
                                                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                                                    >
                                                        Suspend
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Worker Details Modal */}
            {showModal && selectedWorker && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Worker Details</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {selectedWorker.first_name} {selectedWorker.last_name}
                                    </h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedWorker.status)}`}>
                                        {selectedWorker.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="font-medium">{selectedWorker.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Phone</p>
                                        <p className="font-medium">{selectedWorker.phone}</p>
                                    </div>
                                </div>

                                {selectedWorker.location && (
                                    <div>
                                        <p className="text-sm text-gray-600">Location</p>
                                        <p className="font-medium">
                                            {selectedWorker.location.area}, {selectedWorker.location.city}, {selectedWorker.location.state} - {selectedWorker.location.pincode}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <p className="text-sm text-gray-600 mb-2">Skills & Experience</p>
                                    <div className="space-y-2">
                                        {selectedWorker.skills?.map((skill, index) => (
                                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                                <p className="font-medium">{skill.serviceName}</p>
                                                <p className="text-sm text-gray-600">{skill.experienceYears} years experience</p>
                                                {skill.description && (
                                                    <p className="text-sm text-gray-500 mt-1">{skill.description}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-sm text-gray-600">Rating</p>
                                        <p className="text-xl font-bold">{selectedWorker.stats?.rating?.toFixed(1) || "N/A"}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-sm text-gray-600">Jobs Completed</p>
                                        <p className="text-xl font-bold">{selectedWorker.stats?.totalJobsCompleted || 0}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-sm text-gray-600">Jobs Assigned</p>
                                        <p className="text-xl font-bold">{selectedWorker.stats?.totalJobsAssigned || 0}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                {selectedWorker.status === "pending" && (
                                    <>
                                        <button
                                            onClick={() => handleApprove(selectedWorker._id)}
                                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                        >
                                            Approve Worker
                                        </button>
                                        <button
                                            onClick={() => handleReject(selectedWorker._id)}
                                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                        >
                                            Reject Worker
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
