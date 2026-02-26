import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";

export default function WorkerDashboard() {
    const [stats, setStats] = useState(null);
    const [recentTasks, setRecentTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/workers/dashboard/stats`,
                { withCredentials: true }
            );

            if (response.data.success) {
                setStats(response.data.stats);
                setRecentTasks(response.data.recentTasks);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <h1 className="text-3xl font-bold mb-6">Worker Dashboard</h1>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Worker Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-blue-600 mb-2">Total Jobs Completed</h3>
                    <p className="text-3xl font-bold text-blue-900">{stats?.totalJobsCompleted || 0}</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-green-600 mb-2">Total Earnings</h3>
                    <p className="text-3xl font-bold text-green-900">₹{stats?.totalEarnings?.toLocaleString() || 0}</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-yellow-600 mb-2">Pending Tasks</h3>
                    <p className="text-3xl font-bold text-yellow-900">{stats?.pendingTasks || 0}</p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-purple-600 mb-2">Rating</h3>
                    <p className="text-3xl font-bold text-purple-900">
                        {stats?.rating?.toFixed(1) || 0} ⭐
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                        {stats?.totalRatings || 0} ratings
                    </p>
                </div>
            </div>

            {/* Monthly Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">This Month</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Jobs Completed:</span>
                            <span className="font-semibold">{stats?.monthlyJobs || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Earnings:</span>
                            <span className="font-semibold">₹{stats?.monthlyEarnings?.toLocaleString() || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Overall Stats</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Total Assigned:</span>
                            <span className="font-semibold">{stats?.totalJobsAssigned || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Completion Rate:</span>
                            <span className="font-semibold">
                                {stats?.totalJobsAssigned > 0
                                    ? ((stats.totalJobsCompleted / stats.totalJobsAssigned) * 100).toFixed(1)
                                    : 0}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Tasks */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Tasks</h3>
                {recentTasks.length > 0 ? (
                    <div className="space-y-4">
                        {recentTasks.map((task) => (
                            <div key={task._id} className="border-b border-gray-200 pb-4 last:border-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-medium">Order #{task.orderId}</p>
                                        <p className="text-sm text-gray-600">
                                            Customer: {task.user?.first_name} {task.user?.last_name}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded border ${
                                        task.status === 'SERVICE_COMPLETED' 
                                            ? 'bg-green-100 text-green-800 border-green-800'
                                            : 'bg-yellow-100 text-yellow-800 border-yellow-800'
                                    }`}>
                                        {task.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600">
                                    <p>Services: {task.items.map(item => item.title).join(", ")}</p>
                                    <p>Amount: ₹{task.amount.toLocaleString()}</p>
                                    {task.assignedAt && (
                                        <p className="text-xs mt-1">
                                            Assigned: {format(new Date(task.assignedAt), "PPp")}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">No recent tasks</p>
                )}
            </div>
        </div>
    );
}
