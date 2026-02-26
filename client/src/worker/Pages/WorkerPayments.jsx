import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";

export default function WorkerPayments() {
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/workers/dashboard/payments`,
                { withCredentials: true }
            );

            if (response.data.success) {
                setPayments(response.data.payments);
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-6">Loading payment history...</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Payment History</h1>

            {/* Stats Summary */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <h3 className="text-sm font-medium text-green-600 mb-2">Total Earnings</h3>
                        <p className="text-3xl font-bold text-green-900">
                            ₹{stats.totalEarnings.toLocaleString()}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                            {stats.totalJobs} completed jobs
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-sm font-medium text-blue-600 mb-2">Online Payments</h3>
                        <p className="text-3xl font-bold text-blue-900">
                            ₹{stats.onlineEarnings.toLocaleString()}
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                            {stats.onlineJobs} jobs
                        </p>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                        <h3 className="text-sm font-medium text-orange-600 mb-2">COD Payments</h3>
                        <p className="text-3xl font-bold text-orange-900">
                            ₹{stats.codEarnings.toLocaleString()}
                        </p>
                        <p className="text-sm text-orange-600 mt-1">
                            {stats.codJobs} jobs
                        </p>
                    </div>
                </div>
            )}

            {/* Payments Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Services
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Payment Method
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {payments.length > 0 ? (
                                payments.map((payment) => (
                                    <tr key={payment._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            #{payment.orderId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {payment.user?.first_name} {payment.user?.last_name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="max-w-xs">
                                                {payment.items.map(item => item.title).join(", ")}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                                                payment.paymentMethod === 'cod'
                                                    ? 'bg-orange-100 text-orange-800'
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {payment.paymentMethod === 'cod' ? 'COD' : 'Online'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                            ₹{payment.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {payment.completedAt 
                                                ? format(new Date(payment.completedAt), "PP")
                                                : format(new Date(payment.createdAt), "PP")
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded border ${
                                                payment.status === 'SERVICE_COMPLETED' || payment.status === 'COD_PAID'
                                                    ? 'bg-green-100 text-green-800 border-green-800'
                                                    : 'bg-yellow-100 text-yellow-800 border-yellow-800'
                                            }`}>
                                                {payment.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        No payment history found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary Note */}
            {payments.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>Note:</strong> This shows your completed jobs and earnings. 
                        For COD payments, ensure you collect the amount from customers and hand it over to the admin.
                    </p>
                </div>
            )}
        </div>
    );
}
