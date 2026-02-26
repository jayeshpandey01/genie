import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true,
        maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    slug: {
        type: String,
        required: [true, 'Category slug is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(v) {
                // Validate slug format (lowercase, hyphens, no spaces)
                return /^[a-z0-9-]+$/.test(v);
            },
            message: 'Slug must contain only lowercase letters, numbers, and hyphens'
        }
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, 'Description cannot exceed 200 characters']
    },
    icon: {
        type: String,
        required: [true, 'Category icon is required'],
        trim: true
    },
    order: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    listingCount: {
        type: Number,
        default: 0,
        min: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient querying
categorySchema.index({ isActive: 1, order: 1 });

// Update the updatedAt field before saving
categorySchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = new Date();
    }
    next();
});

// Static method to get active categories
categorySchema.statics.findActive = function() {
    return this.find({ isActive: true }).sort({ order: 1, name: 1 });
};

// Static method to get category by slug
categorySchema.statics.findBySlug = function(slug) {
    return this.findOne({ slug: slug, isActive: true });
};

// Method to increment listing count
categorySchema.methods.incrementListingCount = function() {
    this.listingCount += 1;
    this.updatedAt = new Date();
    return this.save();
};

// Method to decrement listing count
categorySchema.methods.decrementListingCount = function() {
    if (this.listingCount > 0) {
        this.listingCount -= 1;
        this.updatedAt = new Date();
        return this.save();
    }
    return Promise.resolve(this);
};

// Static method to update listing counts for all categories
categorySchema.statics.updateAllListingCounts = async function() {
    const Listing = mongoose.model('Listing');
    const categories = await this.find({});
    
    for (const category of categories) {
        const count = await Listing.countDocuments({ 
            category: category.slug, 
            status: 'active' 
        });
        category.listingCount = count;
        await category.save();
    }
    
    return categories;
};

export default mongoose.model('Category', categorySchema);