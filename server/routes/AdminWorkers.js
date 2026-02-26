import express from "express";
import Worker from "../models/Worker.js";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }
    next();
};

// Get all workers with filters
router.get("/", authenticateUser, isAdmin, async (req, res) => {
    try {
        const { status, serviceName, city, page = 1, limit = 20 } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (city) query['location.city'] = new RegExp(city, 'i');
        if (serviceName) query['skills.serviceName'] = new RegExp(serviceName, 'i');

        const workers = await Worker.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Worker.countDocuments(query);

        res.json({
            success: true,
            workers,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });

    } catch (error) {
        console.error("Get workers error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch workers"
        });
    }
});

// Get worker by ID
router.get("/:id", authenticateUser, isAdmin, async (req, res) => {
    try {
        const worker = await Worker.findById(req.params.id).select('-password');
        
        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found"
            });
        }

        res.json({
            success: true,
            worker
        });

    } catch (error) {
        console.error("Get worker error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch worker"
        });
    }
});

// Approve worker
router.put("/:id/approve", authenticateUser, isAdmin, async (req, res) => {
    try {
        const worker = await Worker.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'approved',
                approvedAt: new Date(),
                approvedBy: req.user._id
            },
            { new: true }
        ).select('-password');

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found"
            });
        }

        res.json({
            success: true,
            message: "Worker approved successfully",
            worker
        });

    } catch (error) {
        console.error("Approve worker error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to approve worker"
        });
    }
});

// Reject worker
router.put("/:id/reject", authenticateUser, isAdmin, async (req, res) => {
    try {
        const { reason } = req.body;
        
        const worker = await Worker.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'rejected',
                rejectionReason: reason
            },
            { new: true }
        ).select('-password');

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found"
            });
        }

        res.json({
            success: true,
            message: "Worker rejected",
            worker
        });

    } catch (error) {
        console.error("Reject worker error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reject worker"
        });
    }
});

// Suspend worker
router.put("/:id/suspend", authenticateUser, isAdmin, async (req, res) => {
    try {
        const { reason } = req.body;
        
        const worker = await Worker.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'suspended',
                suspensionReason: reason
            },
            { new: true }
        ).select('-password');

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found"
            });
        }

        res.json({
            success: true,
            message: "Worker suspended",
            worker
        });

    } catch (error) {
        console.error("Suspend worker error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to suspend worker"
        });
    }
});

// Get workers by service
router.get("/service/:serviceName", authenticateUser, isAdmin, async (req, res) => {
    try {
        const { serviceName } = req.params;
        const { city, available } = req.query;
        
        const query = {
            'skills.serviceName': new RegExp(serviceName, 'i'),
            status: 'approved'
        };
        
        if (city) query['location.city'] = new RegExp(city, 'i');
        if (available === 'true') query['availability.status'] = 'available';

        const workers = await Worker.find(query)
            .select('-password')
            .sort({ 'stats.rating': -1, 'stats.totalJobsCompleted': -1 });

        res.json({
            success: true,
            workers,
            count: workers.length
        });

    } catch (error) {
        console.error("Get workers by service error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch workers"
        });
    }
});

// Get worker statistics
router.get("/stats/overview", authenticateUser, isAdmin, async (req, res) => {
    try {
        const totalWorkers = await Worker.countDocuments();
        const pendingWorkers = await Worker.countDocuments({ status: 'pending' });
        const approvedWorkers = await Worker.countDocuments({ status: 'approved' });
        const availableWorkers = await Worker.countDocuments({ 
            status: 'approved',
            'availability.status': 'available'
        });

        res.json({
            success: true,
            stats: {
                total: totalWorkers,
                pending: pendingWorkers,
                approved: approvedWorkers,
                available: availableWorkers
            }
        });

    } catch (error) {
        console.error("Get worker stats error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch statistics"
        });
    }
});

export default router;
