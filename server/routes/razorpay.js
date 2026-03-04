import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

import Payment from "../models/Payment.js";
import { authenticateUser } from "../middleware/auth.js";
import { validate, schemas } from "../middleware/validation.js";

const router = express.Router();
dotenv.config();

// Initialize Razorpay with validation
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create order route - requires authentication
router.post("/create-order", authenticateUser, async (req, res) => {
    try {
        // Extract and validate the order details
        const { amount, currency, receipt, notes } = req.body;

        // Validate required fields
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount provided",
            });
        }

        // Validate amount is reasonable (between 1 and 1,000,000 INR)
        const amountInPaise = parseInt(amount);
        if (amountInPaise < 100 || amountInPaise > 100000000) {
            return res.status(400).json({
                success: false,
                message: "Amount must be between ₹1 and ₹10,00,000",
            });
        }

        // Create order options
        const options = {
            amount: amountInPaise,
            currency: currency || "INR",
            receipt: receipt || `order_${Date.now()}`,
            notes: {
                ...notes,
                user_id: req.user._id.toString(),
                created_at: new Date().toISOString(),
            },
            payment_capture: 1, // Auto capture payment
        };

        const order = await razorpay.orders.create(options);

        // Log order creation for audit
        console.log(`Order created: ${order.id} for user: ${req.user._id} amount: ${amountInPaise}`);

        res.json({
            success: true,
            order,
        });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({
            success: false,
            message: "Error creating order",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
});

// Verify payment route - requires authentication and validation
router.post("/verify-payment", authenticateUser, validate(schemas.payment), async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderDetails,
        } = req.body;

        // Verify signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign)
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            console.error(`Payment signature verification failed for payment: ${razorpay_payment_id}`);
            return res.status(400).json({
                success: false,
                message: "Payment verification failed - invalid signature",
            });
        }

        // Fetch payment details from Razorpay
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        
        // Validate payment status
        if (!payment || !['captured', 'authorized'].includes(payment.status)) {
            console.error(`Invalid payment status: ${payment?.status} for payment: ${razorpay_payment_id}`);
            return res.status(400).json({
                success: false,
                message: "Payment not successful",
            });
        }

        // Verify the order belongs to the authenticated user
        if (orderDetails._id !== req.user._id.toString()) {
            console.error(`User mismatch: ${req.user._id} vs ${orderDetails._id} for payment: ${razorpay_payment_id}`);
            return res.status(403).json({
                success: false,
                message: "Unauthorized payment verification",
            });
        }

        // Validate payment amount matches order amount
        const expectedAmount = orderDetails.summary?.total;
        if (expectedAmount && Math.abs(payment.amount - (expectedAmount * 100)) > 1) {
            console.error(`Amount mismatch: expected ${expectedAmount * 100}, got ${payment.amount} for payment: ${razorpay_payment_id}`);
            return res.status(400).json({
                success: false,
                message: "Payment amount mismatch",
            });
        }

        // Check if payment already exists
        const existingPayment = await Payment.findOne({ paymentId: razorpay_payment_id });
        if (existingPayment) {
            return res.status(400).json({
                success: false,
                message: "Payment already processed",
                paymentId: existingPayment._id,
            });
        }

        // Determine the status to save
        let paymentStatus = payment.status;
        if (payment.status === "captured") {
            paymentStatus = "SERVICE_BOOKED";
        } else if (payment.status === "authorized") {
            paymentStatus = "PAYMENT_AUTHORIZED";
        }

        // Create payment record
        const newPayment = new Payment({
            user: req.user._id,
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            amount: payment.amount,
            currency: payment.currency,
            status: paymentStatus,
            method: payment.method,
            paymentMethod: 'online',
            items: orderDetails.items,
            summary: orderDetails.summary,
            customerDetails: orderDetails.customerDetails,
            workerAssignments: orderDetails.workerAssignments || [],
            attempts: payment.count,
            verifiedAt: new Date(),
        });

        await newPayment.save();

        // Log successful payment for audit
        console.log(`Payment verified and saved: ${razorpay_payment_id} for user: ${req.user._id}`);

        res.json({
            success: true,
            message: "Payment verified and saved successfully",
            paymentId: newPayment._id,
            status: paymentStatus,
        });

    } catch (error) {
        console.error("Error in verify-payment:", error);
        res.status(500).json({ 
            success: false, 
            message: "Payment verification failed",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
});

// Get user bookings - requires authentication
router.get("/bookings", authenticateUser, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 50); // Cap at 50
        const skip = (pageNum - 1) * limitNum;

        const bookings = await Payment.find({
            user: req.user._id,
        })
        .populate('assignedWorker', 'first_name last_name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-__v'); // Exclude version field

        const total = await Payment.countDocuments({ user: req.user._id });

        res.json({
            success: true,
            bookings,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
                hasMore: skip + bookings.length < total,
            },
        });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching bookings",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
});

// Admin route to get all payments
router.get("/admin/payments", authenticateUser, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Admin access required",
            });
        }

        const { page = 1, limit = 20, status, userId } = req.query;
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 100); // Cap at 100 for admin
        const skip = (pageNum - 1) * limitNum;

        const filters = {};
        if (status) filters.status = status;
        if (userId) filters.user = userId;

        const payments = await Payment.find(filters)
            .populate('user', 'first_name last_name email phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Payment.countDocuments(filters);

        res.json({
            success: true,
            payments,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
                hasMore: skip + payments.length < total,
            },
        });
    } catch (error) {
        console.error("Error fetching admin payments:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching payments",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
});

// COD Order endpoint
router.post("/cod-order", authenticateUser, async (req, res) => {
    try {
        const { userId, paymentMethod, items, summary, customerDetails } = req.body;

        // Verify user
        if (userId !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        // Create payment record with COD status
        const payment = new Payment({
            user: req.user._id,
            orderId: `COD_${Date.now()}`,
            paymentId: `COD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: summary.total,
            currency: "INR",
            status: "COD_PENDING",
            paymentMethod: "cod",
            method: "Cash on Delivery",
            items: items,
            summary: summary,
            customerDetails: customerDetails,
            workerAssignments: req.body.workerAssignments || [],
            createdAt: new Date(),
        });

        await payment.save();

        res.json({
            success: true,
            message: "COD order placed successfully",
            payment: payment,
        });

    } catch (error) {
        console.error("COD order error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to place COD order",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;
