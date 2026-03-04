import express from "express";
import Payment from "../models/Payment.js";
import Worker from "../models/Worker.js";
import Service from "../models/Service.js";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

// Create booking with direct worker assignment (like Ola/Uber)
router.post("/create-with-worker", authenticateUser, async (req, res) => {
    try {
        const { 
            serviceId, 
            workerId, 
            bookingDate, 
            bookingTime, 
            address, 
            notes, 
            location 
        } = req.body;

        // Validate required fields
        if (!serviceId || !workerId || !bookingDate || !bookingTime || !address) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        // Verify service exists
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        // Verify worker exists and is available
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
                message: "Selected worker is not available"
            });
        }

        // Generate unique order ID
        const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Calculate amount
        const amount = service.OurPrice || 0;
        const tax = amount * 0.18; // 18% GST
        const total = amount + tax;

        // Create booking/payment record
        const booking = new Payment({
            user: req.user._id,
            orderId,
            amount: total,
            currency: 'INR',
            status: 'PROVIDER_ASSIGNED',
            paymentMethod: 'online', // Can be updated later
            assignedWorker: workerId,
            assignedAt: new Date(),
            items: [{
                serviceId: service._id,
                image: service.image,
                title: service.title,
                quantity: 1,
                price: service.OurPrice,
                total: service.OurPrice
            }],
            summary: {
                subtotal: amount,
                tax: tax,
                total: total,
                itemCount: 1
            },
            customerDetails: {
                name: `${req.user.first_name} ${req.user.last_name}`,
                email: req.user.email,
                phone: req.user.phone
            },
            workerNotes: `Scheduled for ${bookingDate} at ${bookingTime}. Address: ${address}. ${notes || ''}`
        });

        await booking.save();

        // Update worker stats
        await Worker.findByIdAndUpdate(workerId, {
            $inc: { 'stats.totalJobsAssigned': 1 }
        });

        // Populate worker details for response
        await booking.populate('assignedWorker', 'first_name last_name phone email');

        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            booking,
            scheduledDate: bookingDate,
            scheduledTime: bookingTime,
            address
        });

    } catch (error) {
        console.error("Error creating booking with worker:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create booking",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get user's bookings
router.get("/my-bookings", authenticateUser, async (req, res) => {
    try {
        const bookings = await Payment.find({ user: req.user._id })
            .populate('assignedWorker', 'first_name last_name phone email stats.rating')
            .populate('items.serviceId', 'title image category')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            bookings,
            count: bookings.length
        });

    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch bookings"
        });
    }
});

// Get booking details
router.get("/:bookingId", authenticateUser, async (req, res) => {
    try {
        const booking = await Payment.findOne({
            _id: req.params.bookingId,
            user: req.user._id
        })
        .populate('assignedWorker', 'first_name last_name phone email stats.rating location')
        .populate('items.serviceId', 'title image category description');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        res.json({
            success: true,
            booking
        });

    } catch (error) {
        console.error("Error fetching booking details:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch booking details"
        });
    }
});

// Cancel booking
router.put("/:bookingId/cancel", authenticateUser, async (req, res) => {
    try {
        const booking = await Payment.findOne({
            _id: req.params.bookingId,
            user: req.user._id
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Only allow cancellation if not completed
        if (booking.status === 'SERVICE_COMPLETED') {
            return res.status(400).json({
                success: false,
                message: "Cannot cancel completed booking"
            });
        }

        booking.status = 'CANCELLED';
        booking.updatedAt = new Date();
        await booking.save();

        // Update worker stats if worker was assigned
        if (booking.assignedWorker) {
            await Worker.findByIdAndUpdate(booking.assignedWorker, {
                $inc: { 'stats.totalJobsAssigned': -1 }
            });
        }

        res.json({
            success: true,
            message: "Booking cancelled successfully",
            booking
        });

    } catch (error) {
        console.error("Error cancelling booking:", error);
        res.status(500).json({
            success: false,
            message: "Failed to cancel booking"
        });
    }
});

// Rate worker after service completion
router.post("/:bookingId/rate", authenticateUser, async (req, res) => {
    try {
        const { rating, review } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5"
            });
        }

        const booking = await Payment.findOne({
            _id: req.params.bookingId,
            user: req.user._id,
            status: 'SERVICE_COMPLETED'
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found or not completed"
            });
        }

        if (!booking.assignedWorker) {
            return res.status(400).json({
                success: false,
                message: "No worker assigned to this booking"
            });
        }

        // Update worker rating
        const worker = await Worker.findById(booking.assignedWorker);
        if (worker) {
            await worker.updateRating(rating);
        }

        // Store rating in booking
        booking.rating = rating;
        booking.review = review;
        await booking.save();

        res.json({
            success: true,
            message: "Rating submitted successfully"
        });

    } catch (error) {
        console.error("Error submitting rating:", error);
        res.status(500).json({
            success: false,
            message: "Failed to submit rating"
        });
    }
});

export default router;
