import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    // Admin who performed the action
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // Type of action performed
    action: {
        type: String,
        required: true,
        enum: [
            'listing_flagged',
            'listing_unflagged', 
            'listing_deleted',
            'listing_restored',
            'user_banned',
            'user_unbanned',
            'category_created',
            'category_updated',
            'category_deleted',
            'bulk_action'
        ],
        index: true
    },
    
    // Resource type being acted upon
    resourceType: {
        type: String,
        required: true,
        enum: ['listing', 'user', 'category', 'multiple'],
        index: true
    },
    
    // ID of the resource being acted upon
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: function() {
            return this.resourceType !== 'multiple';
        },
        index: true
    },
    
    // For bulk actions, store array of resource IDs
    resourceIds: [{
        type: mongoose.Schema.Types.ObjectId
    }],
    
    // Details about the action
    details: {
        // Previous state (for rollback purposes)
        previousState: mongoose.Schema.Types.Mixed,
        
        // New state after action
        newState: mongoose.Schema.Types.Mixed,
        
        // Reason for the action
        reason: {
            type: String,
            maxlength: 1000
        },
        
        // Additional metadata
        metadata: mongoose.Schema.Types.Mixed
    },
    
    // IP address of the admin
    ipAddress: {
        type: String,
        required: true
    },
    
    // User agent of the admin
    userAgent: {
        type: String,
        required: true
    },
    
    // Timestamp of the action
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    // Status of the action
    status: {
        type: String,
        enum: ['success', 'failed', 'partial'],
        default: 'success'
    },
    
    // Error message if action failed
    errorMessage: {
        type: String,
        maxlength: 500
    }
});

// Compound indexes for efficient querying
auditLogSchema.index({ admin: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 }); // For general chronological queries

// Static methods for creating audit logs
auditLogSchema.statics.logAction = async function(actionData) {
    try {
        const auditLog = new this(actionData);
        await auditLog.save();
        return auditLog;
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw error to prevent audit logging from breaking main functionality
        return null;
    }
};

// Static method to get audit logs with pagination
auditLogSchema.statics.getAuditLogs = async function(options = {}) {
    const {
        page = 1,
        limit = 50,
        admin,
        action,
        resourceType,
        resourceId,
        startDate,
        endDate,
        sortBy = 'timestamp',
        sortOrder = 'desc'
    } = options;
    
    // Build query filters
    const filters = {};
    
    if (admin) filters.admin = admin;
    if (action) filters.action = action;
    if (resourceType) filters.resourceType = resourceType;
    if (resourceId) filters.resourceId = resourceId;
    
    if (startDate || endDate) {
        filters.timestamp = {};
        if (startDate) filters.timestamp.$gte = new Date(startDate);
        if (endDate) filters.timestamp.$lte = new Date(endDate);
    }
    
    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query
    const [logs, totalItems] = await Promise.all([
        this.find(filters)
            .populate('admin', 'first_name last_name email')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum),
        this.countDocuments(filters)
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalItems / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;
    
    return {
        logs,
        pagination: {
            currentPage: pageNum,
            totalPages,
            totalItems,
            hasNext,
            hasPrev,
            limit: limitNum
        }
    };
};

// Static method to get audit statistics
auditLogSchema.statics.getAuditStats = async function(options = {}) {
    const {
        startDate,
        endDate,
        admin
    } = options;
    
    // Build match stage for aggregation
    const matchStage = {};
    
    if (admin) matchStage.admin = new mongoose.Types.ObjectId(admin);
    
    if (startDate || endDate) {
        matchStage.timestamp = {};
        if (startDate) matchStage.timestamp.$gte = new Date(startDate);
        if (endDate) matchStage.timestamp.$lte = new Date(endDate);
    }
    
    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalActions: { $sum: 1 },
                actionsByType: {
                    $push: '$action'
                },
                resourcesByType: {
                    $push: '$resourceType'
                },
                successfulActions: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'success'] }, 1, 0]
                    }
                },
                failedActions: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                totalActions: 1,
                successfulActions: 1,
                failedActions: 1,
                successRate: {
                    $multiply: [
                        { $divide: ['$successfulActions', '$totalActions'] },
                        100
                    ]
                }
            }
        }
    ]);
    
    // Get action type breakdown
    const actionBreakdown = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$action',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ]);
    
    // Get resource type breakdown
    const resourceBreakdown = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$resourceType',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ]);
    
    // Get admin activity breakdown
    const adminActivity = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$admin',
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'admin'
            }
        },
        {
            $unwind: '$admin'
        },
        {
            $project: {
                _id: 0,
                adminId: '$_id',
                adminName: {
                    $concat: ['$admin.first_name', ' ', '$admin.last_name']
                },
                adminEmail: '$admin.email',
                actionCount: '$count'
            }
        },
        { $sort: { actionCount: -1 } }
    ]);
    
    return {
        summary: stats[0] || {
            totalActions: 0,
            successfulActions: 0,
            failedActions: 0,
            successRate: 0
        },
        actionBreakdown,
        resourceBreakdown,
        adminActivity
    };
};

// Instance method to format log for display
auditLogSchema.methods.toDisplayFormat = function() {
    return {
        id: this._id,
        admin: {
            id: this.admin._id,
            name: `${this.admin.first_name} ${this.admin.last_name}`,
            email: this.admin.email
        },
        action: this.action,
        resourceType: this.resourceType,
        resourceId: this.resourceId,
        resourceIds: this.resourceIds,
        reason: this.details?.reason,
        timestamp: this.timestamp,
        status: this.status,
        errorMessage: this.errorMessage,
        ipAddress: this.ipAddress
    };
};

export default mongoose.model('AuditLog', auditLogSchema);