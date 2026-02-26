import express from "express";
import Payment from "../models/Payment.js";
import Worker from "../models/Worker.js";
import { authenticateAdmin } from "../middleware/auth.js";
const router = express.Router();

// Get all bookings with worker details
router.get("/", authenticateAdmin, async (req, res) => {
    try {
        const bookings = await Payment.find()
            .populate('assignedWorker', 'first_name last_name email phone skills stats')
            .populate('user', 'first_name last_name email phone')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Error fetching bookings" });
    }
});

// Update booking status
router.put("/:bookingId/status", authenticateAdmin, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;

        const validStatuses = [
            "SERVICE_BOOKED",
            "PROVIDER_ASSIGNED",
            "SERVICE_COMPLETED",
            "COD_PENDING",
            "COD_PAID",
            "PAYMENT_AUTHORIZED"
        ];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const updateData = { status };
        
        // If status is SERVICE_COMPLETED, set completedAt
        if (status === "SERVICE_COMPLETED") {
            updateData.completedAt = new Date();
        }

        const booking = await Payment.findByIdAndUpdate(
            bookingId,
            updateData,
            { new: true }
        ).populate('assignedWorker', 'first_name last_name email phone');

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Update worker stats if completed
        if (status === "SERVICE_COMPLETED" && booking.assignedWorker) {
            await Worker.findByIdAndUpdate(booking.assignedWorker._id, {
                $inc: { 
                    'stats.totalJobsCompleted': 1,
                    'stats.totalEarnings': booking.amount
                }
            });
        }

        res.json(booking);
    } catch (error) {
        console.error("Error updating booking status:", error);
        res.status(500).json({ message: "Error updating booking status" });
    }
});

// Assign worker to booking
router.put("/:bookingId/assign-worker", authenticateAdmin, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { workerId, notes } = req.body;

        if (!workerId) {
            return res.status(400).json({ 
                success: false,
                message: "Worker ID is required" 
            });
        }

        // Check if worker exists and is approved
        const worker = await Worker.findById(workerId);
        if (!worker) {
            return res.status(404).json({ 
                success: false,
                message: "Worker not found" 
            });
        }

        if (worker.status !== 'approved') {
            return res.status(400).json({ 
                success: false,
                message: "Worker is not approved" 
            });
        }

        // Update booking with worker assignment
        const booking = await Payment.findByIdAndUpdate(
            bookingId,
            {
                assignedWorker: workerId,
                assignedAt: new Date(),
                assignedBy: req.user._id,
                workerNotes: notes || '',
                status: 'PROVIDER_ASSIGNED'
            },
            { new: true }
        ).populate('assignedWorker', 'first_name last_name email phone skills');

        if (!booking) {
            return res.status(404).json({ 
                success: false,
                message: "Booking not found" 
            });
        }

        // Update worker stats
        await Worker.findByIdAndUpdate(workerId, {
            $inc: { 'stats.totalJobsAssigned': 1 }
        });

        res.json({
            success: true,
            message: "Worker assigned successfully",
            booking
        });

    } catch (error) {
        console.error("Error assigning worker:", error);
        res.status(500).json({ 
            success: false,
            message: "Error assigning worker",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get available workers for a service
router.get("/available-workers", authenticateAdmin, async (req, res) => {
    try {
        const { serviceName } = req.query;

        const query = {
            status: 'approved',
            'availability.status': { $in: ['available', 'busy'] }
        };

        // If serviceName provided, filter by skills
        if (serviceName) {
            query['skills.serviceName'] = { $regex: serviceName, $options: 'i' };
        }

        const workers = await Worker.find(query)
            .select('first_name last_name email phone skills stats availability location')
            .sort({ 'stats.rating': -1, 'stats.totalJobsCompleted': -1 });

        res.json({
            success: true,
            workers
        });

    } catch (error) {
        console.error("Error fetching available workers:", error);
        res.status(500).json({ 
            success: false,
            message: "Error fetching available workers" 
        });
    }
});

// Unassign worker from booking
router.put("/:bookingId/unassign-worker", authenticateAdmin, async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await Payment.findByIdAndUpdate(
            bookingId,
            {
                $unset: { 
                    assignedWorker: 1,
                    assignedAt: 1,
                    assignedBy: 1,
                    workerNotes: 1
                },
                status: 'SERVICE_BOOKED'
            },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ 
                success: false,
                message: "Booking not found" 
            });
        }

        res.json({
            success: true,
            message: "Worker unassigned successfully",
            booking
        });

    } catch (error) {
        console.error("Error unassigning worker:", error);
        res.status(500).json({ 
            success: false,
            message: "Error unassigning worker" 
        });
    }
});

export default router;