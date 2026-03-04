import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiPhoto, HiXMark, HiCurrencyRupee } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import CustomSelect from "./CustomSelect";

export default function ListingForm({ listing = null, onSubmit, onCancel }) {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [images, setImages] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [categories, setCategories] = useState([
        { value: 'electronics', label: 'Electronics' },
        { value: 'furniture', label: 'Furniture' },
        { value: 'vehicles', label: 'Vehicles' },
        { value: 'clothing', label: 'Clothing' },
        { value: 'books', label: 'Books' },
        { value: 'sports', label: 'Sports' },
        { value: 'home-garden', label: 'Home & Garden' },
        { value: 'other', label: 'Other' }
    ]);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        location: '',
        images: [],
        // Rental fields (PRIMARY)
        rentalPeriod: 'daily', // daily, weekly, monthly, hourly
        rentalPrice: '',
        securityDeposit: '',
        availableFrom: '',
        availableTo: '',
        minRentalDays: 1,
        // Sale fields (OPTIONAL)
        availableForSale: false,
        salePrice: '',
        condition: 'good'
    });

    // Fetch categories from API (optional - fallback already set in state)
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/marketplace/categories', {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.categories && data.categories.length > 0) {
                        setCategories(data.categories.map(cat => ({
                            value: cat.slug,
                            label: cat.name
                        })));
                    }
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
                // Using fallback categories from initial state
            }
        };

        fetchCategories();
    }, []);

    const conditions = [
        { value: 'new', label: 'New' },
        { value: 'like-new', label: 'Like New' },
        { value: 'good', label: 'Good' },
        { value: 'fair', label: 'Fair' },
        { value: 'poor', label: 'Poor' }
    ];

    // Initialize form with existing listing data if editing
    useEffect(() => {
        if (listing) {
            setFormData({
                title: listing.title || '',
                description: listing.description || '',
                category: listing.category || '',
                location: listing.location || '',
                images: listing.images || [],
                // Rental fields (PRIMARY)
                rentalPeriod: listing.rentalPeriod || 'daily',
                rentalPrice: listing.rentalPrice?.toString() || '',
                securityDeposit: listing.securityDeposit?.toString() || '',
                availableFrom: listing.availableFrom || '',
                availableTo: listing.availableTo || '',
                minRentalDays: listing.minRentalDays || 1,
                // Sale fields (OPTIONAL)
                availableForSale: listing.availableForSale || false,
                salePrice: listing.salePrice?.toString() || '',
                condition: listing.condition || 'good'
            });
            setImages(listing.images || []);
        }
    }, [listing]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/marketplace');
        }
    }, [isAuthenticated, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        
        if (images.length + files.length > 8) {
            setErrors(prev => ({
                ...prev,
                images: 'Maximum 8 images allowed'
            }));
            return;
        }

        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setErrors(prev => ({
                    ...prev,
                    images: 'Each image must be less than 5MB'
                }));
                return;
            }

            if (!file.type.startsWith('image/')) {
                setErrors(prev => ({
                    ...prev,
                    images: 'Only image files are allowed'
                }));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                setImages(prev => [...prev, e.target.result]);
                setImageFiles(prev => [...prev, file]);
            };
            reader.readAsDataURL(file);
        });

        // Clear image errors
        setErrors(prev => ({
            ...prev,
            images: ''
        }));
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.length < 5) {
            newErrors.title = 'Title must be at least 5 characters';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.length < 20) {
            newErrors.description = 'Description must be at least 20 characters';
        }

        if (!formData.category) {
            newErrors.category = 'Category is required';
        }

        // Rental price is REQUIRED (primary purpose)
        if (!formData.rentalPrice) {
            newErrors.rentalPrice = 'Rental price is required';
        } else if (isNaN(formData.rentalPrice) || parseFloat(formData.rentalPrice) <= 0) {
            newErrors.rentalPrice = 'Rental price must be a valid positive number';
        }

        // Sale price validation - only if available for sale
        if (formData.availableForSale) {
            if (!formData.salePrice) {
                newErrors.salePrice = 'Sale price is required when item is available for sale';
            } else if (isNaN(formData.salePrice) || parseFloat(formData.salePrice) <= 0) {
                newErrors.salePrice = 'Sale price must be a valid positive number';
            }
        }

        if (!formData.location.trim()) {
            newErrors.location = 'Location is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        
        try {
            // First, create or update the listing without images
            const listingData = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                location: formData.location,
                condition: formData.condition,
                // Rental fields (PRIMARY)
                rentalPeriod: formData.rentalPeriod,
                rentalPrice: formData.rentalPrice,
                securityDeposit: formData.securityDeposit || 0,
                availableFrom: formData.availableFrom,
                availableTo: formData.availableTo,
                minRentalDays: formData.minRentalDays || 1,
                // Sale fields (OPTIONAL)
                availableForSale: formData.availableForSale,
                salePrice: formData.availableForSale ? formData.salePrice : undefined
            };

            console.log('Submitting listing data:', listingData); // Debug log

            let response;
            if (listing) {
                // Update existing listing
                response = await fetch(`/api/marketplace/listings/${listing._id}`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(listingData)
                });
            } else {
                // Create new listing
                response = await fetch('/api/marketplace/listings', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(listingData)
                });
            }

            const result = await response.json();
            console.log('Server response:', result); // Debug log

            if (!response.ok) {
                // Handle validation errors from server
                if (result.errors && Array.isArray(result.errors)) {
                    const newErrors = {};
                    result.errors.forEach(error => {
                        newErrors[error.field] = error.message;
                    });
                    setErrors(newErrors);
                }
                throw new Error(result.message || 'Failed to save listing');
            }

            let finalListing = result.listing;

            // If there are images to upload, upload them now
            if (imageFiles.length > 0) {
                const imageFormData = new FormData();
                imageFiles.forEach(file => {
                    imageFormData.append('images', file);
                });

                const imageResponse = await fetch(`/api/marketplace/listings/${finalListing._id}/images`, {
                    method: 'POST',
                    credentials: 'include',
                    body: imageFormData
                });

                if (imageResponse.ok) {
                    const imageResult = await imageResponse.json();
                    finalListing = imageResult.listing || finalListing;
                } else {
                    console.warn('Failed to upload images, but listing was created successfully');
                    showWarning('Listing created successfully, but some images failed to upload');
                }
            }
            
            showSuccess(listing ? 'Listing updated successfully!' : 'Listing posted successfully!');
            
            if (onSubmit) {
                onSubmit(finalListing);
            } else {
                navigate(`/marketplace/listing/${finalListing._id}`);
            }
        } catch (error) {
            console.error('Error saving listing:', error);
            showError(error.message || 'Failed to save listing. Please try again.');
            setErrors({ submit: error.message });
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    {listing ? 'Edit Rental Listing' : 'List Your Product for Rent'}
                </h2>
                <p className="text-gray-600 mt-1">
                    Share your products with others and earn rental income
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., iPhone 14 Pro Max - Excellent Condition"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.title ? 'border-red-500' : 'border-gray-300'
                        }`}
                        maxLength={100}
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe your item in detail. Include condition, features, reason for selling, etc."
                        rows={4}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.description ? 'border-red-500' : 'border-gray-300'
                        }`}
                        maxLength={1000}
                    />
                    <div className="flex justify-between items-center mt-1">
                        {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
                        <p className="text-gray-500 text-sm ml-auto">
                            {formData.description.length}/1000 characters
                        </p>
                    </div>
                </div>

                {/* Category and Condition */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                            Category *
                        </label>
                        <CustomSelect
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            options={categories}
                            placeholder="Select a category"
                            error={!!errors.category}
                        />
                        {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                    </div>

                    <div>
                        <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                            Condition *
                        </label>
                        <CustomSelect
                            id="condition"
                            name="condition"
                            value={formData.condition}
                            onChange={handleInputChange}
                            options={conditions}
                            placeholder="Select condition"
                            error={!!errors.condition}
                        />
                        {errors.condition && <p className="text-red-500 text-sm mt-1">{errors.condition}</p>}
                    </div>
                </div>

                {/* Price and Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                            {formData.isRental ? 'Sale Price (Optional)' : 'Price (₹) *'}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <HiCurrencyRupee className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                placeholder="0"
                                min="1"
                                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.price ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                        </div>
                        {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                    </div>

                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                            Location *
                        </label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="e.g., Mumbai, Maharashtra"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.location ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                    </div>
                </div>

                {/* Rental Toggle */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            name="isRental"
                            checked={formData.isRental}
                            onChange={(e) => setFormData(prev => ({ ...prev, isRental: e.target.checked }))}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3">
                            <span className="text-sm font-medium text-gray-900">Available for Rent</span>
                            <p className="text-xs text-gray-600">Check this if you want to rent out this item</p>
                        </span>
                    </label>
                </div>

                {/* Rental Details - Show only if isRental is true */}
                {formData.isRental && (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="font-semibold text-gray-900">Rental Details</h3>
                        
                        {/* Rental Period and Price */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="rentalPeriod" className="block text-sm font-medium text-gray-700 mb-2">
                                    Rental Period *
                                </label>
                                <select
                                    id="rentalPeriod"
                                    name="rentalPeriod"
                                    value={formData.rentalPeriod}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="hourly">Per Hour</option>
                                    <option value="daily">Per Day</option>
                                    <option value="weekly">Per Week</option>
                                    <option value="monthly">Per Month</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="rentalPrice" className="block text-sm font-medium text-gray-700 mb-2">
                                    Rental Price (₹) *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <HiCurrencyRupee className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        id="rentalPrice"
                                        name="rentalPrice"
                                        value={formData.rentalPrice}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        min="1"
                                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            errors.rentalPrice ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                </div>
                                {errors.rentalPrice && <p className="text-red-500 text-sm mt-1">{errors.rentalPrice}</p>}
                            </div>
                        </div>

                        {/* Security Deposit and Min Days */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="securityDeposit" className="block text-sm font-medium text-gray-700 mb-2">
                                    Security Deposit (₹)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <HiCurrencyRupee className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        id="securityDeposit"
                                        name="securityDeposit"
                                        value={formData.securityDeposit}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        min="0"
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="minRentalDays" className="block text-sm font-medium text-gray-700 mb-2">
                                    Minimum Rental Period
                                </label>
                                <input
                                    type="number"
                                    id="minRentalDays"
                                    name="minRentalDays"
                                    value={formData.minRentalDays}
                                    onChange={handleInputChange}
                                    placeholder="1"
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Availability Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="availableFrom" className="block text-sm font-medium text-gray-700 mb-2">
                                    Available From
                                </label>
                                <input
                                    type="date"
                                    id="availableFrom"
                                    name="availableFrom"
                                    value={formData.availableFrom}
                                    onChange={handleInputChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="availableTo" className="block text-sm font-medium text-gray-700 mb-2">
                                    Available Until
                                </label>
                                <input
                                    type="date"
                                    id="availableTo"
                                    name="availableTo"
                                    value={formData.availableTo}
                                    onChange={handleInputChange}
                                    min={formData.availableFrom || new Date().toISOString().split('T')[0]}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Images (Optional)
                    </label>
                    <div className="space-y-4">
                        {/* Upload Area */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="image-upload"
                            />
                            <label htmlFor="image-upload" className="cursor-pointer">
                                <HiPhoto className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 mb-2">
                                    Click to upload images or drag and drop
                                </p>
                                <p className="text-sm text-gray-500">
                                    PNG, JPG, WebP up to 5MB each (max 8 images)
                                </p>
                            </label>
                        </div>

                        {/* Image Preview */}
                        {images.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {images.map((image, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={image}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <HiXMark className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {errors.images && <p className="text-red-500 text-sm">{errors.images}</p>}
                    </div>
                </div>

                {/* Submit Error */}
                {errors.submit && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-700">{errors.submit}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel || (() => navigate('/marketplace'))}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Saving...' : (listing ? 'Update Listing' : 'Post Item')}
                    </button>
                </div>
            </form>
        </div>
    );
}