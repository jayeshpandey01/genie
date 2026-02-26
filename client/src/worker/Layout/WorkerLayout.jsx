import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

export default function WorkerLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [worker, setWorker] = useState(null);

    useEffect(() => {
        fetchWorkerProfile();
    }, []);

    const fetchWorkerProfile = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/workers/me`,
                { withCredentials: true }
            );
            if (response.data.success) {
                setWorker(response.data.worker);
            }
        } catch (error) {
            console.error("Error fetching worker profile:", error);
            // If not authenticated, redirect to login
            if (error.response?.status === 401) {
                navigate("/worker/login");
            }
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/workers/logout`,
                {},
                { withCredentials: true }
            );
            navigate("/worker/login");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-blue-600">GENIE Worker</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            {worker && (
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                        {worker.first_name} {worker.last_name}
                                    </p>
                                    <p className="text-xs text-gray-500">{worker.email}</p>
                                </div>
                            )}
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex gap-6">
                    {/* Sidebar */}
                    <aside className="w-64 flex-shrink-0">
                        <nav className="bg-white border border-gray-200 rounded-lg p-4">
                            <ul className="space-y-2">
                                <li>
                                    <Link
                                        to="/worker/dashboard"
                                        className={`block px-4 py-2 rounded ${
                                            isActive("/worker/dashboard")
                                                ? "bg-blue-600 text-white"
                                                : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                    >
                                        📊 Dashboard
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/worker/tasks"
                                        className={`block px-4 py-2 rounded ${
                                            isActive("/worker/tasks")
                                                ? "bg-blue-600 text-white"
                                                : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                    >
                                        📋 My Tasks
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/worker/payments"
                                        className={`block px-4 py-2 rounded ${
                                            isActive("/worker/payments")
                                                ? "bg-blue-600 text-white"
                                                : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                    >
                                        💰 Payment History
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}
