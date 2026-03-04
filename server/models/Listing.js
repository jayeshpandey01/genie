import mongoose from "mongoose";
import { deleteProcessedImage } from "../services/imageProcessingService.js";

const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters'],
        index: 'text'
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters'],
        index: 'text'
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: {
            values: ['electronics', 'furniture', 'vehicles', 'clothing', 'books', 'sports', 'home-garden', 'other'],
            message: 'Category must be one of: electronics, furniture, vehicles, clothing, books, sports, home-garden, other'
        },
        index: true
    },
    price: {
        type: Number,
        min: [0, 'Price cannot be negative'],
        index: true
    },
    condition: {
        type: String,
        required: [true, 'Condition is required'],
        enum: {
            values: ['new', 'like-new', 'good', 'fair', 'poor'],
            message: 'Condition must be one of: new, like-new, good, fair, poor'
        }
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true,
        maxlength: [100, 'Location cannot exceed 100 characters']
    },
    images: {
        type: [{
            type: String,
            validate: {
                validator: function(v) {
                    // Validate image URL format (basic validation)
                    return /^[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp)$/i.test(v);
                },
                message: 'Invalid image filename format'
            }
        }],
        validate: {
            validator: function(v) {
                return v.length <= 8;
            },
            message: 'Maximum 8 images allowed per listing'
        },
        default: []
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Seller is required'],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ['active', 'sold', 'inactive', 'flagged'],
            message: 'Status must be one of: active, sold, inactive, flagged'
        },
        default: 'active',
        index: true
    },
    views: {
        type: Number,
        default: 0,
        min: 0
    },
    // Rental fields
    isRental: {
        type: Boolean,
        default: false,
        index: true
    },
    rentalPeriod: {
        type: String,
        enum: ['hourly', 'daily', 'weekly', 'monthly'],
        required: function() { return this.isRental; }
    },
    rentalPrice: {
        type: Number,
        min: [0, 'Rental price cannot be negative'],
        required: function() { return this.isRental; }
    },
    securityDeposit: {
        type: Number,
        min: [0, 'Security deposit cannot be negative'],
        default: 0
    },
    availableFrom: {
        type: Date,
        required: function() { return this.isRental; }
    },
    availableTo: {
        type: Date,
        required: function() { return this.isRental; }
    },
    minRentalDays: {
        type: Number,
        min: 1,
        default: 1
    },
    currentlyRented: {
        type: Boolean,
        default: false,
        index: true
    },
    rentedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rentalStartDate: {
        type: Date
    },
    rentalEndDate: {
        type: Date
    },
    rentalHistory: [{
        rentedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        startDate: Date,
        endDate: Date,
        totalAmount: Number,
        securityDepositPaid: Number,
        securityDepositReturned: Number,
        status: {
            type: String,
            enum: ['active', 'completed', 'cancelled'],
            default: 'active'
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    featuredUntil: {
        type: Date,
        index: true
    }
});

// Compound indexes for efficient querying as specified in the design
listingSchema.index({ category: 1, status: 1, createdAt: -1 });
listingSchema.index({ price: 1, status: 1 });
listingSchema.index({ seller: 1, status: 1 });
listingSchema.index({ status: 1, createdAt: -1 });

// Text search index for title and description
listingSchema.index({ 
    title: 'text', 
    description: 'text',
    category: 'text'
}, {
    weights: {
        title: 10,
        description: 5,
        category: 1
    },
    name: 'listing_text_index'
});

// Update the updatedAt field before saving
listingSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = new Date();
    }
    next();
});

// Clean up images when listing is permanently deleted
listingSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    try {
        // Delete all associated images
        if (this.images && this.images.length > 0) {
            for (const imageFilename of this.images) {
                try {
                    await deleteProcessedImage(imageFilename);
                    console.log(`Cleaned up images for deleted listing: ${imageFilename}`);
                } catch (error) {
                    console.error(`Error cleaning up image ${imageFilename}:`, error);
                }
            }
        }
        next();
    } catch (error) {
        console.error('Error in listing deletion cleanup:', error);
        next(error);
    }
});

// Clean up images when listing is removed using findOneAndDelete
listingSchema.pre('findOneAndDelete', async function(next) {
    try {
        // Get the listing that will be deleted
        const listing = await this.model.findOne(this.getQuery());
        if (listing && listing.images && listing.images.length > 0) {
            for (const imageFilename of listing.images) {
                try {
                    await deleteProcessedImage(imageFilename);
                    console.log(`Cleaned up images for deleted listing: ${imageFilename}`);
                } catch (error) {
                    console.error(`Error cleaning up image ${imageFilename}:`, error);
                }
            }
        }
        next();
    } catch (error) {
        console.error('Error in listing deletion cleanup:', error);
        next(error);
    }
});

// Virtual for getting seller information (populated)
listingSchema.virtual('sellerInfo', {
    ref: 'User',
    localField: 'seller',
    foreignField: '_id',
    justOne: true,
    select: 'first_name last_name phone email'
});

// Method to increment view count
listingSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Method to mark as sold
listingSchema.methods.markAsSold = function() {
    this.status = 'sold';
    this.updatedAt = new Date();
    return this.save();
};

// Method to check if user can edit this listing
listingSchema.methods.canEdit = function(userId, userRole) {
    return this.seller.toString() === userId.toString() || userRole === 'admin';
};

// Static method to find active listings
listingSchema.statics.findActive = function(filters = {}) {
    return this.find({ status: 'active', ...filters });
};

// Static method to search listings
listingSchema.statics.searchListings = function(query, filters = {}) {
    const searchQuery = {
        status: 'active',
        ...filters
    };
    
    if (query) {
        searchQuery.$text = { $search: query };
    }
    
    return this.find(searchQuery)
        .populate('seller', 'first_name last_name phone email')
        .sort(query ? { score: { $meta: 'textScore' }, createdAt: -1 } : { createdAt: -1 });
};

// Static method to get listings by category
listingSchema.statics.findByCategory = function(category, filters = {}) {
    return this.find({ 
        category: category, 
        status: 'active',
        ...filters 
    })
    .populate('seller', 'first_name last_name phone email')
    .sort({ createdAt: -1 });
};

// Static method to get user's listings
listingSchema.statics.findBySeller = function(sellerId, includeInactive = false) {
    const query = { seller: sellerId };
    if (!includeInactive) {
        query.status = { $ne: 'flagged' };
    }
    
    return this.find(query)
        .populate('seller', 'first_name last_name phone email')
        .sort({ createdAt: -1 });
};

export default mongoose.model('Listing', listingSchema);