import { useState, useEffect } from "react";
import { HiXMark, HiPhone, HiEnvelope } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function ContactSellerModal({ listing, isOpen, onClose }) {
    const [formData, setFormData] = useState({
        message: "",
        buyerPhone: "",
        buyerEmail: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();

    // Pre-fill user data if available
    useEffect(() => {
        if (user && isOpen) {
            setFormData(prev => ({
                ...prev,
                buyerEmail: user.email || "",
                buyerPhone: user.phone || ""
            }));
        }
    }, [user, isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.message.trim()) {
            showError("Please enter a message");
            return;
        }

        if (!formData.buyerEmail.trim()) {
            showError("Please enter your email address");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/marketplace/listings/${listing._id}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    message: formData.message.trim(),
                    buyerEmail: formData.buyerEmail.trim(),
                    buyerPhone: formData.buyerPhone.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send message');
            }

            showSuccess("Your message has been sent to the seller successfully!");
            
            // Reset form
            setFormData({
                message: "",
                buyerPhone: user?.phone || "",
                buyerEmail: user?.email || ""
            });
            
            onClose();

        } catch (error) {
            console.error('Error sending contact message:', error);
            
            // Handle specific error codes
            if (error.message.includes('SELF_CONTACT_NOT_ALLOWED')) {
                showError("You cannot contact yourself about your own listing");
            } else if (error.message.includes('LISTING_NOT_ACTIVE')) {
                showError("This listing is no longer available for contact");
            } else if (error.message.includes('EMAIL_SERVICE_ERROR')) {
                showError("Email service is currently unavailable. Please try again later.");
            } else {
                showError(error.message || "Failed to send message. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    if (!isOpen || !listing) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Contact Seller
                    </h2>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                        aria-label="Close modal"
                    >
                        <HiXMark className="h-6 w-6" />
                    </button>
                </div>

                {/* Listing Info */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-start space-x-4">
                        {listing.images && listing.images.length > 0 ? (
                            <img
                                src={listing.images[0]}
                                alt={listing.title}
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                                {listing.title}
                            </h3>
                            <p className="text-lg font-semibold text-blue-600">
                                {new Intl.NumberFormat('en-IN', {
                                    style: 'currency',
                                    currency: 'INR',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                }).format(listing.price)}
                            </p>
                            <p className="text-sm text-gray-500">
                                {listing.location}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Seller Info */}
                {listing.seller && (
                    <div className="p-6 border-b border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-3">Seller Information</h4>
                        <div className="space-y-2">
                            <div className="flex items-center text-gray-600">
                                <span className="font-medium">
                                    {listing.seller.first_name} {listing.seller.last_name}
                                </span>
                            </div>
                            {listing.seller.phone && (
                                <div className="flex items-center text-gray-600">
                                    <HiPhone className="h-4 w-4 mr-2" />
                                    <span>{listing.seller.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Contact Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        {/* Message */}
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                Message *
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                placeholder="Hi, I'm interested in your listing. Is it still available?"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="buyerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                                Your Email *
                            </label>
                            <div className="relative">
                                <HiEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    id="buyerEmail"
                                    name="buyerEmail"
                                    value={formData.buyerEmail}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="your.email@example.com"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Phone (Optional) */}
                        <div>
                            <label htmlFor="buyerPhone" className="block text-sm font-medium text-gray-700 mb-2">
                                Your Phone Number (Optional)
                            </label>
                            <div className="relative">
                                <HiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="tel"
                                    id="buyerPhone"
                                    name="buyerPhone"
                                    value={formData.buyerPhone}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="+91 98765 43210"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Privacy Notice */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Privacy Notice:</strong> Your contact information will be shared with the seller via email. 
                            Please ensure you're comfortable sharing these details.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.message.trim() || !formData.buyerEmail.trim()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Sending...' : 'Send Message'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}