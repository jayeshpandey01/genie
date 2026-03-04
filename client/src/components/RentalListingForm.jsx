import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiPhoto, HiXMark, HiCurrencyRupee } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function RentalListingForm({ listing = null, onSubmit, onCancel }) {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [images, setImages] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [categories, setCategories] = useState([]);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        location: '',
        condition: 'good',
        images: [],
        // Rental fields (PRIMARY - REQUIRED)
        rentalPeriod: 'daily',
        rentalPrice: '',
        securityDeposit: '',
        availableFrom: new Date().toISOString().split('T')[0],
        availableTo: '',
        minRentalDays: 1,
        // Sale option (OPTIONAL)
        availableForSale: false,
        salePrice: ''
    });

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/marketplace/categories', {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.categories) {
                        setCategories(data.categories.map(cat => ({
                            value: cat.slug,
                            label: cat.name
                        })));
                    }
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
                setCategories([
                    { value: 'electronics', label: 'Electronics' },
                    { value: 'furniture', label: 'Furniture' },
                    { value: 'vehicles', label: 'Vehicles' },
                    { value: 'clothing', label: 'Clothing' },
                    { value: 'books', label: 'Books' },
                    { value: 'sports', label: 'Sports & Fitness' },
                    { value: 'tools', label: 'Tools & Equipment' },
                    { value: 'cameras', label: 'Cameras & Photography' },
                    { value: 'musical', label: 'Musical Instruments' },
                    { value: 'home-garden', label: 'Home & Garden' },
                    { value: 'other', label: 'Other' }
                ]);
            }
        };

        fetchCategories();
    }, []);

    const conditions = [
        { value: 'new', label: 'Brand New' },
        { value: 'like-new', label: 'Like New' },
        { value: 'good', label: 'Good' },
        { value: 'fair', label: 'Fair' },
        { value: 'poor', label: 'Poor' }
    ];

    // Initialize form with existing listing
    useEffect(() => {
        if (listing) {
            setFormData({
                title: listing.title || '',
                description: listing.description || '',
                category: listing.category || '',
                location: listing.location || '',
                condition: listing.condition || 'good',
                images: listing.images || [],
                rentalPeriod: listing.rentalPeriod || 'daily',
                rentalPrice: listing.rentalPrice?.toString() || '',
                securityDeposit: listing.securityDeposit?.toString() || '',
                availableFrom: listing.availableFrom || new Date().toISOString().split('T')[0],
                availableTo: listing.availableTo || '',
                minRentalDays: listing.minRentalDays || 1,
                availableForSale: listing.availableForSale || false,
                salePrice: listing.salePrice?.toString() || ''
            });
            setImages(listing.images || []);
        }
    }, [listing]);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/marketplace');
        }
    }, [isAuthenticated, navigate]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
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
            if (file.size > 5 * 1024 * 1024) {
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

        if (!formData.rentalPrice) {
            newErrors.rentalPrice = 'Rental price is required';
        } else if (isNaN(formData.rentalPrice) || parseFloat(formData.rentalPrice) <= 0) {
            newErrors.rentalPrice = 'Rental price must be a valid positive number';
        }

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
            const listingData = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                location: formData.location,
                condition: formData.condition,
                // Rental fields
                rentalPeriod: formData.rentalPeriod,
                rentalPrice: formData.rentalPrice,
                securityDeposit: formData.securityDeposit || 0,
                availableFrom: formData.availableFrom,
                availableTo: formData.availableTo,
                minRentalDays: formData.minRentalDays || 1,
                // Sale fields
                availableForSale: formData.availableForSale,
                salePrice: formData.availableForSale ? formData.salePrice : undefined
            };

            let response;
            if (listing) {
                response = await fetch(`/api/marketplace/listings/${listing._id}`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(listingData)
                });
            } else {
                response = await fetch('/api/marketplace/listings', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(listingData)
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save listing');
            }

            const result = await response.json();
            let finalListing = result.listing;

            // Upload images if any
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
                    showWarning('Listing created successfully, but some images failed to upload');
                }
            }
            
            showSuccess(listing ? 'Rental listing updated!' : 'Product listed for rent successfully!');
            
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
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6" style={{ position: 'relative', zIndex: 1 }}>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    {listing ? 'Edit Rental Listing' : '🎉 List Your Product for Rent'}
                </h2>
                <p className="text-gray-600 mt-1">
                    Share your products with others and earn rental income
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" style={{ position: 'relative', zIndex: 1 }}>
                {/* Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Product Title *
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Canon EOS R5 Camera with 24-70mm Lens"
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
                        placeholder="Describe your product in detail. Include features, usage instructions, and any special requirements for renters."
                        rows={4}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.description ? 'border-red-500' : 'border-gray-300'
                        }`}
                        maxLength={1000}
                    />
                    <div className="flex justify-between items-center mt-1">
                        {errors.description && <p className=