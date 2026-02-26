import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const cartItemSchema = new mongoose.Schema({
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceDetail",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
    },
    category: { type: String },
    type: { type: String },
    title: { type: String },
    image: { type: String },
    time: { type: String },
    OurPrice: { type: Number, required: true, min: 0 },
    MRP: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    description: [String],
});

const UserSchema = new mongoose.Schema({
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true, // Add index for faster queries
    },
    phone: { type: String, required: true, unique: true, trim: true, index: true }, // Add index
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, default: "user", index: true }, // Add index for role-based queries
    location: {
        area: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
        formattedAddress: { type: String },
        coordinates: {
            lat: { type: Number },
            lng: { type: Number }
        }
    },
    cart: { type: [cartItemSchema], default: [] },
    createdAt: { type: Date, default: Date.now, index: true }, // Add index for sorting
    // Marketplace-related fields
    marketplaceProfile: {
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        totalRatings: {
            type: Number,
            default: 0
        },
        totalListings: {
            type: Number,
            default: 0
        },
        totalSales: {
            type: Number,
            default: 0
        },
        joinedMarketplace: {
            type: Date,
            default: Date.now
        },
        isVerified: {
            type: Boolean,
            default: false
        }
    },
    favoriteListings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing'
    }]
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Marketplace-related methods
UserSchema.methods.addToFavorites = function(listingId) {
    if (!this.favoriteListings.includes(listingId)) {
        this.favoriteListings.push(listingId);
        return this.save();
    }
    return Promise.resolve(this);
};

UserSchema.methods.removeFromFavorites = function(listingId) {
    this.favoriteListings = this.favoriteListings.filter(
        id => id.toString() !== listingId.toString()
    );
    return this.save();
};

UserSchema.methods.incrementListingCount = async function() {
    const User = mongoose.model('User');
    return await User.findByIdAndUpdate(
        this._id,
        { $inc: { 'marketplaceProfile.totalListings': 1 } },
        { new: true }
    );
};

UserSchema.methods.incrementSalesCount = async function() {
    const User = mongoose.model('User');
    return await User.findByIdAndUpdate(
        this._id,
        { $inc: { 'marketplaceProfile.totalSales': 1 } },
        { new: true }
    );
};

UserSchema.methods.updateRating = async function(newRating) {
    const User = mongoose.model('User');
    const user = await User.findById(this._id);
    const currentTotal = user.marketplaceProfile.rating * user.marketplaceProfile.totalRatings;
    const newTotalRatings = user.marketplaceProfile.totalRatings + 1;
    const newAverageRating = (currentTotal + newRating) / newTotalRatings;
    
    return await User.findByIdAndUpdate(
        this._id,
        {
            'marketplaceProfile.rating': newAverageRating,
            'marketplaceProfile.totalRatings': newTotalRatings
        },
        { new: true }
    );
};

export default mongoose.model("User", UserSchema);
