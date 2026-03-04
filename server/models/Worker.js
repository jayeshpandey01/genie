import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const workerSkillSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: true,
    },
    subcategory: {
        type: String,
    },
    experienceYears: {
        type: Number,
        required: true,
        min: 0,
    },
    certifications: [String],
    description: String,
});

const WorkerSchema = new mongoose.Schema({
    first_name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    last_name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true,
    },
    phone: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true, 
        index: true 
    },
    password: { 
        type: String, 
        required: true, 
        minlength: 6,
        select: false
    },
    role: { 
        type: String, 
        default: "worker", 
        index: true 
    },
    
    // Worker-specific fields
    skills: [workerSkillSchema],
    
    location: {
        area: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
        formattedAddress: { type: String },
        coordinates: {
            lat: { type: Number, index: true },
            lng: { type: Number, index: true }
        },
        lastUpdated: { type: Date, default: Date.now }
    },
    
    availability: {
        status: {
            type: String,
            enum: ['available', 'busy', 'offline'],
            default: 'available'
        },
        workingDays: [{
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }],
        workingHours: {
            start: String,
            end: String
        }
    },
    
    profile: {
        bio: String,
        profileImage: String,
        idProof: String,
        idProofNumber: String,
        dateOfBirth: Date,
        address: String,
    },
    
    stats: {
        totalJobsCompleted: {
            type: Number,
            default: 0
        },
        totalJobsAssigned: {
            type: Number,
            default: 0
        },
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
        totalEarnings: {
            type: Number,
            default: 0
        }
    },
    
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending'
    },
    
    verificationDocuments: [{
        type: String,
        url: String,
        uploadedAt: Date
    }],
    
    createdAt: { 
        type: Date, 
        default: Date.now, 
        index: true 
    },
    lastLogin: Date,
    approvedAt: Date,
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Hash password before saving
WorkerSchema.pre('save', async function(next) {
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
WorkerSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Method to update rating
WorkerSchema.methods.updateRating = async function(newRating) {
    const currentTotal = this.stats.rating * this.stats.totalRatings;
    const newTotalRatings = this.stats.totalRatings + 1;
    const newAverageRating = (currentTotal + newRating) / newTotalRatings;
    
    this.stats.rating = newAverageRating;
    this.stats.totalRatings = newTotalRatings;
    
    return await this.save();
};

// Method to update location
WorkerSchema.methods.updateLocation = async function(lat, lng) {
    this.location.coordinates.lat = lat;
    this.location.coordinates.lng = lng;
    this.location.lastUpdated = new Date();
    return await this.save();
};

// Static method to find nearby workers
WorkerSchema.statics.findNearby = function(lat, lng, radiusKm = 10, skillCategory = null) {
    const query = {
        status: 'approved',
        'location.coordinates.lat': {
            $gte: lat - (radiusKm / 111), // Rough conversion: 1 degree ≈ 111 km
            $lte: lat + (radiusKm / 111)
        },
        'location.coordinates.lng': {
            $gte: lng - (radiusKm / 111),
            $lte: lng + (radiusKm / 111)
        }
    };

    // Optional: Filter by skill if provided, but don't make it required
    if (skillCategory) {
        // Use $or to match either the skill OR show all workers if no exact match
        query.$or = [
            { 'skills.serviceName': skillCategory },
            { 'skills.serviceName': { $exists: true } } // Show all workers with any skills
        ];
    }

    return this.find(query)
        .select('first_name last_name phone email location skills stats.rating stats.totalRatings stats.totalJobsCompleted profile.profileImage availability')
        .lean();
};

export default mongoose.model("Worker", WorkerSchema);
