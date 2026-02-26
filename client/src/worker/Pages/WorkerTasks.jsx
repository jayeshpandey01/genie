import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { ImageOff } from "lucide-react";

export default function WorkerTasks() {
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        fetchTasks();
    }, [filter]);

    const fetchTasks = async () => {
        try {
            const url = filter === "all" 
                ? `${import.meta.env.VITE_BACKEND_URL}/api/workers/dashboard/tasks`
                : `${import.meta.env.VITE_BACKEND_URL}/api/workers/dashboard/tasks?status=${filter}`;

            const response = await axios.get(url, { withCredentials: true });

            if (response.data.success) {
                setTasks(response.data.tasks);
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkComplete = async (taskId) => {
        if (!confirm("Mark this task as completed?")) {
            return;
        }

        try {
            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/workers/tasks/${taskId}/status`,
                { status: "SERVICE_COMPLETED" },
                { withCredentials: true }
            );

            if (response.data.success) {
                alert("Task marked as completed!");
                fetchTasks();
            }
        } catch (error) {
            console.error("Error updating task:", error);
            alert(error.response?.data?.message || "Failed to update task");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
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

    if (loading) {
        return <div className="p-6">Loading tasks...</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">My Tasks</h1>

            {/* Stats Summary */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Total Tasks</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-600">Pending</p>
                        <p className="text-2xl font-bold text-blue-900">{stats.pending}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-600">Completed</p>
                        <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <p className="text-sm text-orange-600">COD Pending</p>
                        <p className="text-2xl font-bold text-orange-900">{stats.codPending}</p>
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setFilter("all")}
                    className={`px-4 py-2 rounded ${
                        filter === "all"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                    All Tasks
                </button>
                <button
                    onClick={() => setFilter("PROVIDER_ASSIGNED")}
                    className={`px-4 py-2 rounded ${
                        filter === "PROVIDER_ASSIGNED"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                    Pending
                </button>
                <button
                    onClick={() => setFilter("SERVICE_COMPLETED")}
                    className={`px-4 py-2 rounded ${
                        filter === "SERVICE_COMPLETED"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                    Completed
                </button>
            </div>

            {/* Tasks List */}
            <div className="space-y-6">
                {tasks.length > 0 ? (
                    tasks.map((task) => (
                        <div
                            key={task._id}
                            className="bg-white border border-gray-300 rounded-lg shadow-md overflow-hidden"
                        >
                            <div className="p-4 border-b border-gray-300 flex justify-between items-center bg-yellow-100">
                                <div className="space-x-6">
                                    <span className="font-medium">Order #{task.orderId}</span>
                                    <span className="text-gray-600">
                                        {format(new Date(task.assignedAt || task.createdAt), "PPp")}
                                    </span>
                                    {task.paymentMethod === 'cod' && (
                                        <span className="text-sm font-medium text-blue-600">
                                            💵 COD
                                        </span>
                                    )}
                                </div>
                                <span className={`px-3 py-1 text-xs font-semibold rounded border ${getStatusColor(task.status)}`}>
                                    {task.status.replace(/_/g, " ")}
                                </span>
                            </div>

                            <div className="p-4">
                                {/* Customer Details */}
                                <div className="mb-4">
                                    <h3 className="font-medium mb-2">Customer Details</h3>
                                    <div className="text-sm text-gray-600">
                                        <p>Name: {task.customerDetails.name}</p>
                                        <p>Email: {task.customerDetails.email}</p>
                                        <p>Phone: {task.customerDetails.phone}</p>
                                        {task.user?.location && (
                                            <p>Location: {task.user.location.area}, {task.user.location.city}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Worker Notes */}
                                {task.workerNotes && (
                                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                                        <h3 className="font-medium text-sm mb-1">Special Instructions:</h3>
                                        <p className="text-sm text-gray-700">{task.workerNotes}</p>
                                    </div>
                                )}

                                {/* Service Items */}
                                <div className="space-y-4 mb-4">
                                    {task.items.map((item, index) => (
                                        <div key={index} className="flex items-center gap-4 border-t border-gray-200 pt-4">
                                            {item.image ? (
                                                <img
                                                    src={`${import.meta.env.VITE_BACKEND_URL}/${item.image}`}
                                                    alt={item.title}
                                                    className="w-24 h-16 object-cover rounded"
                                                />
                                            ) : (
                                                <div className="w-24 h-16 flex flex-col gap-1 items-center justify-center bg-gray-100 rounded">
                                                    <ImageOff size={16} color="#525252" />
                                                    <span className="text-xs text-gray-500">No image</span>
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h4 className="font-medium">{item.title}</h4>
                                                <p className="text-sm text-gray-600">
                                                    Quantity: {item.quantity} × ₹{item.price}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">₹{item.total}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Total */}
                                <div className="border-t border-gray-300 pt-4">
                                    <div className="flex justify-between font-medium">
                                        <span>Total Amount:</span>
                                        <span className="text-lg">₹{task.summary.total}</span>
                                    </div>
                                    {task.paymentMethod === 'cod' && task.status === 'PROVIDER_ASSIGNED' && (
                                        <p className="text-sm text-orange-600 mt-2">
                                            ⚠️ Collect ₹{task.summary.total} cash on delivery
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                {task.status === "PROVIDER_ASSIGNED" && (
                                    <div className="mt-4">
                                        <button
                                            onClick={() => handleMarkComplete(task._id)}
                                            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                                        >
                                            Mark as Completed
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                        <p className="text-gray-500">No tasks found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
