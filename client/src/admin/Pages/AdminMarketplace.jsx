import { useState, useEffect } from "react";
import { 
    getMarketplaceAdminListings, 
    getMarketplaceAdminStats, 
    flagMarketplaceListing, 
    deleteMarketplaceListing,
    getMarketplaceAuditLog 
} from "../../utils/api";
import { 
    Package, 
    Users, 
    Flag, 
    Trash2, 
    Eye, 
    Search, 
    Filter,
    ChevronDown,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Calendar,
    TrendingUp
} from "lucide-react";

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-yellow-100 bg-opacity-40 p-4 px-6 rounded-2xl border border-yellow-400 shadow-md">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 mb-1 uppercase">{title}</p>
                <h3 className="text-4xl font-bold">{value}</h3>
                {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
            </div>
            <div className={`p-3 rounded-full ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
    </div>
);

const ListingRow = ({ listing, onFlag, onDelete, onView }) => {
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleFlag = async (action) => {
        setIsLoading(true);
        try {
            const reason = action === 'flag' ? 'Inappropriate content' : 'Content reviewed and approved';
            await onFlag(listing._id, action, reason);
        } finally {
            setIsLoading(false);
            setIsActionsOpen(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to permanently delete this listing? This action cannot be undone.')) {
            setIsLoading(true);
            try {
                await onDelete(listing._id, 'Admin deletion');
            } finally {
                setIsLoading(false);
                setIsActionsOpen(false);
            }
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            active: { color: 'bg-green-100 border-green-500 text-green-800', text: 'Active' },
            sold: { color: 'bg-blue-100 border-blue-500 text-blue-800', text: 'Sold' },
            inactive: { color: 'bg-gray-100 border-gray-500 text-gray-800', text: 'Inactive' },
            flagged: { color: 'bg-red-100 border-red-500 text-red-800', text: 'Flagged' }
        };
        const config = statusConfig[status] || statusConfig.active;
        return (
            <span className={`px-2 py-1 rounded-md text-xs uppercase border ${config.color}`}>
                {config.text}
            </span>
        );
    };

    return (
        <tr className="border-b hover:bg-gray-50">
            <td className="py-3 px-2">
                <div className="flex items-center gap-3">
                    {listing.images && listing.images.length > 0 ? (
                        <img 
                            src={listing.images[0]} 
                            alt={listing.title}
                            className="w-12 h-12 object-cover rounded-lg"
                        />
                    ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package size={20} className="text-gray-400" />
                        </div>
                    )}
                    <div>
                        <h4 className="font-medium text-sm truncate max-w-[200px]">{listing.title}</h4>
                        <p className="text-xs text-gray-500 capitalize">{listing.category}</p>
                    </div>
                </div>
            </td>
            <td className="py-3 px-2">
                <div>
                    <p className="font-medium text-sm">{listing.seller.first_name} {listing.seller.last_name}</p>
                    <p className="text-xs text-gray-500">{listing.seller.email}</p>
                </div>
            </td>
            <td className="py-3 px-2">
                <span className="font-medium">₹{listing.price.toLocaleString()}</span>
            </td>
            <td className="py-3 px-2">
                {getStatusBadge(listing.status)}
            </td>
            <td className="py-3 px-2">
                <span className="text-sm text-gray-600">{listing.views}</span>
            </td>
            <td className="py-3 px-2">
                <span className="text-sm text-gray-600">
                    {new Date(listing.createdAt).toLocaleDateString()}
                </span>
            </td>
            <td className="py-3 px-2">
                <div className="relative">
                    <button
                        onClick={() => setIsActionsOpen(!isActionsOpen)}
                        disabled={isLoading}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <ChevronDown size={16} />
                    </button>
                    {isActionsOpen && (
                        <div className="absolute right-0 top-full mt-1 bg-white border rounded-md shadow-lg z-10 min-w-[150px]">
                            <button
                                onClick={() => onView(listing)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Eye size={14} />
                                View Details
                            </button>
                            {listing.status === 'flagged' ? (
                                <button
                                    onClick={() => handleFlag('unflag')}
                                    disabled={isLoading}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-green-600"
                                >
                                    <CheckCircle size={14} />
                                    Unflag
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleFlag('flag')}
                                    disabled={isLoading}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-orange-600"
                                >
                                    <Flag size={14} />
                                    Flag
                                </button>
                            )}
                            <button
                                onClick={handleDelete}
                                disabled={isLoading}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

const BulkActions = ({ selectedListings, onBulkFlag, onBulkDelete, onClearSelection }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleBulkFlag = async () => {
        setIsLoading(true);
        try {
            await onBulkFlag(selectedListings, 'flag', 'Bulk moderation action');
            onClearSelection();
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Are you sure you want to permanently delete ${selectedListings.length} listings? This action cannot be undone.`)) {
            setIsLoading(true);
            try {
                await onBulkDelete(selectedListings, 'Bulk admin deletion');
                onClearSelection();
            } finally {
                setIsLoading(false);
            }
        }
    };

    if (selectedListings.length === 0) return null;

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
            <span className="text-sm text-blue-800">
                {selectedListings.length} listing{selectedListings.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
                <button
                    onClick={handleBulkFlag}
                    disabled={isLoading}
                    className="px-3 py-1 bg-orange-500 text-white rounded-md text-sm hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1"
                >
                    <Flag size={14} />
                    Flag All
                </button>
                <button
                    onClick={handleBulkDelete}
                    disabled={isLoading}
                    className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 disabled:opacity-50 flex items-center gap-1"
                >
                    <Trash2 size={14} />
                    Delete All
                </button>
                <button
                    onClick={onClearSelection}
                    className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
                >
                    Clear
                </button>
            </div>
        </div>
    );
};

const AuditLogViewer = ({ auditLogs, loading }) => {
    const getActionIcon = (action) => {
        switch (action) {
            case 'flag':
                return <Flag size={14} className="text-orange-500" />;
            case 'unflag':
                return <CheckCircle size={14} className="text-green-500" />;
            case 'delete':
                return <Trash2 size={14} className="text-red-500" />;
            default:
                return <AlertTriangle size={14} className="text-gray-500" />;
        }
    };

    return (
        <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar size={20} />
                    Recent Admin Actions
                </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {loading ? (
                    <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    </div>
                ) : auditLogs.length > 0 ? (
                    <div className="divide-y">
                        {auditLogs.map((log) => (
                            <div key={log._id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-start gap-3">
                                    {getActionIcon(log.action)}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-sm">{log.admin.first_name} {log.admin.last_name}</span>
                                            <span className="text-xs text-gray-500 capitalize">{log.action}</span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">
                                            Listing: {log.listing?.title || 'Deleted listing'}
                                        </p>
                                        {log.reason && (
                                            <p className="text-xs text-gray-500">Reason: {log.reason}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        <Calendar size={48} className="mx-auto mb-2 text-gray-300" />
                        <p>No admin actions recorded yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function AdminMarketplace() {
    const [stats, setStats] = useState(null);
    const [listings, setListings] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [auditLoading, setAuditLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedListings, setSelectedListings] = useState([]);
    const [filters, setFilters] = useState({
        status: '',
        category: '',
        search: '',
        page: 1,
        limit: 10
    });

    // Fetch marketplace statistics
    const fetchStats = async () => {
        try {
            const data = await getMarketplaceAdminStats();
            setStats(data);
        } catch (error) {
            console.error('Error fetching marketplace stats:', error);
            setError('Failed to load marketplace statistics');
        }
    };

    // Fetch listings with filters
    const fetchListings = async () => {
        try {
            setLoading(true);
            const data = await getMarketplaceAdminListings(filters);
            setListings(data.listings || []);
        } catch (error) {
            console.error('Error fetching listings:', error);
            setError('Failed to load listings');
        } finally {
            setLoading(false);
        }
    };

    // Fetch audit logs
    const fetchAuditLogs = async () => {
        try {
            setAuditLoading(true);
            const data = await getMarketplaceAuditLog({ limit: 20 });
            setAuditLogs(data.logs || []);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setAuditLoading(false);
        }
    };

    // Handle listing actions
    const handleFlag = async (listingId, action, reason) => {
        try {
            await flagMarketplaceListing(listingId, action, reason);
            await fetchListings();
            await fetchStats();
            await fetchAuditLogs();
        } catch (error) {
            console.error('Error flagging listing:', error);
            alert('Failed to update listing status');
        }
    };

    const handleDelete = async (listingId, reason) => {
        try {
            await deleteMarketplaceListing(listingId, reason);
            await fetchListings();
            await fetchStats();
            await fetchAuditLogs();
        } catch (error) {
            console.error('Error deleting listing:', error);
            alert('Failed to delete listing');
        }
    };

    // Handle bulk actions
    const handleBulkFlag = async (listingIds, action, reason) => {
        try {
            await Promise.all(listingIds.map(id => flagMarketplaceListing(id, action, reason)));
            await fetchListings();
            await fetchStats();
            await fetchAuditLogs();
        } catch (error) {
            console.error('Error bulk flagging listings:', error);
            alert('Failed to update listings');
        }
    };

    const handleBulkDelete = async (listingIds, reason) => {
        try {
            await Promise.all(listingIds.map(id => deleteMarketplaceListing(id, reason)));
            await fetchListings();
            await fetchStats();
            await fetchAuditLogs();
        } catch (error) {
            console.error('Error bulk deleting listings:', error);
            alert('Failed to delete listings');
        }
    };

    const handleView = (listing) => {
        // Open listing in new tab or modal
        window.open(`/marketplace/listing/${listing._id}`, '_blank');
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handleSelectListing = (listingId) => {
        setSelectedListings(prev => 
            prev.includes(listingId) 
                ? prev.filter(id => id !== listingId)
                : [...prev, listingId]
        );
    };

    const handleSelectAll = () => {
        if (selectedListings.length === listings.length) {
            setSelectedListings([]);
        } else {
            setSelectedListings(listings.map(listing => listing._id));
        }
    };

    useEffect(() => {
        fetchStats();
        fetchAuditLogs();
    }, []);

    useEffect(() => {
        fetchListings();
    }, [filters]);

    if (error) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="text-center">
                    <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-[NeuwMachinaBold] truncate">MARKETPLACE</h1>
            </div>

            {/* Statistics Overview */}
            {stats && (
                <div className="grid grid-cols-4 gap-6">
                    <StatCard
                        title="Total Listings"
                        value={stats.totalListings || 0}
                        icon={Package}
                        color="bg-blue-500"
                        subtitle={`${stats.activeListings || 0} active`}
                    />
                    <StatCard
                        title="Flagged Content"
                        value={stats.flaggedListings || 0}
                        icon={Flag}
                        color="bg-orange-500"
                        subtitle="Needs review"
                    />
                    <StatCard
                        title="Total Users"
                        value={stats.totalSellers || 0}
                        icon={Users}
                        color="bg-green-500"
                        subtitle="Active sellers"
                    />
                    <StatCard
                        title="This Month"
                        value={stats.monthlyListings || 0}
                        icon={TrendingUp}
                        color="bg-purple-500"
                        subtitle="New listings"
                    />
                </div>
            )}

            <div className="grid grid-cols-3 gap-6">
                {/* Listings Management */}
                <div className="col-span-2 space-y-4">
                    {/* Filters */}
                    <div className="bg-white rounded-lg border p-4">
                        <div className="flex gap-4 items-center">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search listings..."
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="sold">Sold</option>
                                <option value="inactive">Inactive</option>
                                <option value="flagged">Flagged</option>
                            </select>
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Categories</option>
                                <option value="electronics">Electronics</option>
                                <option value="furniture">Furniture</option>
                                <option value="vehicles">Vehicles</option>
                                <option value="clothing">Clothing</option>
                                <option value="books">Books</option>
                                <option value="sports">Sports</option>
                                <option value="home-garden">Home & Garden</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    <BulkActions
                        selectedListings={selectedListings}
                        onBulkFlag={handleBulkFlag}
                        onBulkDelete={handleBulkDelete}
                        onClearSelection={() => setSelectedListings([])}
                    />

                    {/* Listings Table */}
                    <div className="bg-white rounded-lg border shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="py-3 px-2 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedListings.length === listings.length && listings.length > 0}
                                                onChange={handleSelectAll}
                                                className="rounded"
                                            />
                                        </th>
                                        <th className="py-3 px-2 text-left text-sm font-medium text-gray-500 uppercase">Listing</th>
                                        <th className="py-3 px-2 text-left text-sm font-medium text-gray-500 uppercase">Seller</th>
                                        <th className="py-3 px-2 text-left text-sm font-medium text-gray-500 uppercase">Price</th>
                                        <th className="py-3 px-2 text-left text-sm font-medium text-gray-500 uppercase">Status</th>
                                        <th className="py-3 px-2 text-left text-sm font-medium text-gray-500 uppercase">Views</th>
                                        <th className="py-3 px-2 text-left text-sm font-medium text-gray-500 uppercase">Created</th>
                                        <th className="py-3 px-2 text-left text-sm font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="8" className="py-8 text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                            </td>
                                        </tr>
                                    ) : listings.length > 0 ? (
                                        <>
                                            {listings.map((listing) => (
                                                <tr key={listing._id}>
                                                    <td className="py-3 px-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedListings.includes(listing._id)}
                                                            onChange={() => handleSelectListing(listing._id)}
                                                            className="rounded"
                                                        />
                                                    </td>
                                                    <ListingRow
                                                        listing={listing}
                                                        onFlag={handleFlag}
                                                        onDelete={handleDelete}
                                                        onView={handleView}
                                                    />
                                                </tr>
                                            ))}
                                        </>
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="py-8 text-center text-gray-500">
                                                <Package size={48} className="mx-auto mb-2 text-gray-300" />
                                                <p>No listings found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Audit Log */}
                <div>
                    <AuditLogViewer auditLogs={auditLogs} loading={auditLoading} />
                </div>
            </div>
        </div>
    );
         
}