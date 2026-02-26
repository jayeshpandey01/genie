import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useUserLocation } from "../context/LocationContext";
import { useToast } from "../context/ToastContext";
import axios from "axios";

export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const locationContext = useUserLocation();
    const { showSuccess, showError } = useToast();
    
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
    });

    // Safely access location context
    const location = locationContext?.location;
    const openLocationModal = locationContext?.openLocationModal || (() => {});
    const getLocationString = locationContext?.getLocationString || (() => "Select Location");

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                phone: user.phone || "",
                email: user.email || "",
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const updateData = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone,
                location: location || undefined,
            };

            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/users/profile`,
                updateData,
                { withCredentials: true }
            );

            if (response.data.success) {
                updateUser(response.data.user);
                showSuccess("Profile updated successfully!");
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Profile update error:", error);
            showError(
                error.response?.data?.message || "Failed to update profile"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            phone: user.phone || "",
            email: user.email || "",
        });
        setIsEditing(false);
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Please login to view your profile</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                {user.first_name?.[0]?.toUpperCase()}
                                {user.last_name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {user.first_name} {user.last_name}
                                </h1>
                                <p className="text-gray-500 text-sm capitalize">{user.role}</p>
                            </div>
                        </div>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Edit Profile
                            </button>
                        )}
                    </div>
                </div>

                {/* Profile Form */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        Personal Information
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        isEditing
                                            ? "bg-white border-gray-300"
                                            : "bg-gray-50 border-gray-200"
                                    }`}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        isEditing
                                            ? "bg-white border-gray-300"
                                            : "bg-gray-50 border-gray-200"
                                    }`}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Field (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                disabled
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Email cannot be changed
                            </p>
                        </div>

                        {/* Phone Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                disabled={!isEditing}
                                pattern="[0-9]{10}"
                                maxLength="10"
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    isEditing
                                        ? "bg-white border-gray-300"
                                        : "bg-gray-50 border-gray-200"
                                }`}
                                required
                            />
                        </div>

                        {/* Location Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Location
                            </label>
                            <button
                                type="button"
                                onClick={openLocationModal}
                                disabled={!isEditing}
                                className={`w-full flex items-center gap-3 px-4 py-3 border rounded-lg transition-colors ${
                                    isEditing
                                        ? "bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                                        : "bg-gray-50 border-gray-200 cursor-not-allowed"
                                }`}
                            >
                                <svg className={`w-5 h-5 ${location ? "text-blue-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div className="flex-1 text-left">
                                    <p className={`text-sm ${location ? "text-gray-900" : "text-gray-500"}`}>
                                        {getLocationString()}
                                    </p>
                                    {location && location.formattedAddress && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {location.formattedAddress}
                                        </p>
                                    )}
                                </div>
                            </button>
                        </div>

                        {/* Action Buttons */}
                        {isEditing && (
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Cancel
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* Account Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">Total Bookings</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {user.marketplaceProfile?.totalSales || 0}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">Marketplace Listings</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {user.marketplaceProfile?.totalListings || 0}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">Member Since</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {new Date(user.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric",
                            })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
