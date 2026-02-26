import { useState, useEffect } from "react";
import { getDashboardStats } from "../../utils/api";
import { Link } from "react-router-dom";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboardNew() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("all");

    useEffect(() => {
        fetchDashboardStats();
    }, [timeRange]);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const data = await getDashboardStats(timeRange);
            setStats(data);
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!stats) {
        return <div className="p-6">No data available</div>;
    }

    // Prepare order status data for pie chart
    const orderStatusData = stats.ordersByStatus?.map(item => ({
        name: item._id.replace(/_/g, ' '),
        value: item.count,
        revenue: item.revenue
    })) || [];

    // Prepare payment method data
    const paymentMethodData = stats.paymentMethodStats?.map(item => ({
        name: item._id === 'cod' ? 'Cash on Delivery' : 'Online Payment',
        value: item.count,
        revenue: item.revenue
    })) || [];

    // Prepare worker status data
    const workerStatusData = stats.workersByStatus?.map(item => ({
        name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
        value: item.count
    })) || [];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                </select>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm mb-1">Total Orders</p>
                            <h3 className="text-3xl font-bold">{stats.totalPayments || 0}</h3>
                        </div>
                        <div className="bg-blue-400 bg-opacity-30 p-3 rounded-full">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm mb-1">Total Revenue</p>
                            <h3 className="text-3xl font-bold">₹{stats.revenue?.total?.toLocaleString() || 0}</h3>
                        </div>
                        <div className="bg-green-400 bg-opacity-30 p-3 rounded-full">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm mb-1">Total Users</p>
                            <h3 className="text-3xl font-bold">{stats.totalUsers || 0}</h3>
                        </div>
                        <div className="bg-purple-400 bg-opacity-30 p-3 rounded-full">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm mb-1">Total Workers</p>
                            <h3 className="text-3xl font-bold">{stats.totalWorkers || 0}</h3>
                        </div>
                        <div className="bg-orange-400 bg-opacity-30 p-3 rounded-full">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Total Services</h3>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalServices || 0}</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Service Details</h3>
                    <p className="text-3xl font-bold text-green-600">{stats.totalServiceDetails || 0}</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Avg Order Value</h3>
                    <p className="text-3xl font-bold text-purple-600">
                        ₹{stats.totalPayments > 0 ? Math.round(stats.revenue.total / stats.totalPayments).toLocaleString() : 0}
                    </p>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Revenue Chart */}
                <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.monthlyRevenue || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                            <Legend />
                            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Order Status Distribution */}
                <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={orderStatusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {orderStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Methods */}
                <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={paymentMethodData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#3b82f6" name="Orders" />
                            <Bar dataKey="revenue" fill="#10b981" name="Revenue (₹)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Worker Status */}
                <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Workers by Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={workerStatusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {workerStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Services and Workers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Services */}
                <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Services by Revenue</h3>
                    <div className="space-y-4">
                        {stats.topServices?.slice(0, 5).map((service, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 truncate">{service._id}</p>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{
                                                width: `${(service.revenue / stats.topServices[0].revenue) * 100}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="ml-4 text-right">
                                    <p className="text-sm font-semibold text-gray-900">₹{service.revenue.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">{service.totalSales} sales</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Workers */}
                <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Workers</h3>
                    <div className="space-y-4">
                        {stats.topWorkers?.map((worker, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {worker.first_name} {worker.last_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {worker.stats.totalJobsCompleted} jobs completed
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-green-600">
                                        ₹{worker.stats.totalEarnings.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        ⭐ {worker.stats.rating.toFixed(1)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                    <Link to="/admin/bookings" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View All →
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {stats.recentPayments?.map((payment) => (
                                <tr key={payment._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">#{payment.orderId.slice(-8)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        {payment.user?.first_name} {payment.user?.last_name}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {payment.assignedWorker 
                                            ? `${payment.assignedWorker.first_name} ${payment.assignedWorker.last_name}`
                                            : <span className="text-gray-400 italic">Not assigned</span>
                                        }
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                        ₹{payment.summary?.total?.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            payment.status === 'SERVICE_COMPLETED' || payment.status === 'COD_PAID'
                                                ? 'bg-green-100 text-green-800'
                                                : payment.status === 'PROVIDER_ASSIGNED'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {payment.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {new Date(payment.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
