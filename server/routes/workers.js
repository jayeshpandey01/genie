import express from "express";
import jwt from "jsonwebtoken";
import Worker from "../models/Worker.js";
import Payment from "../models/Payment.js";
import { authenticateWorker } from "../middleware/auth.js";

const router = express.Router();

// Generate JWT token
const generateToken = (worker) => {
    return jwt.sign(
        { 
            worker: { 
                _id: worker._id,
                email: worker.email,
                role: worker.role 
            } 
        },
        process.env.JWT_SECRET,
        { 
            expiresIn: '7d',
            issuer: 'genie-marketplace',
            audience: 'genie-workers'
        }
    );
};

// Set secure cookie
const setTokenCookie = (res, token) => {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
    };
    
    res.cookie("workerToken", token, cookieOptions);
};

// Worker Registration
router.post("/register", async (req, res) => {
    try {
        const { first_name, last_name, phone, email, password, skills, location } = req.body;

        // Check if worker already exists
        let worker = await Worker.findOne({ 
            $or: [
                { phone: phone },
                { email: email.toLowerCase() }
            ] 
        });
        
        if (worker) {
            const existingField = worker.email === email.toLowerCase() ? 'email' : 'phone';
            return res.status(400).json({ 
                success: false,
                message: `Worker with this ${existingField} already exists.` 
            });
        }

        // Create new worker
        worker = new Worker({
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            phone,
            email: email.toLowerCase().trim(),
            password,
            role: "worker",
            skills: skills || [],
            location: location || undefined,
            status: 'pending' // Requires admin approval
        });

        await worker.save();

        // Generate token
        const token = generateToken(worker);
        setTokenCookie(res, token);

        // Remove password from response
        const workerResponse = worker.toObject();
        delete workerResponse.password;

        res.status(201).json({
            success: true,
            message: "Worker registered successfully. Awaiting admin approval.",
            worker: workerResponse,
            token,
        });

    } catch (error) {
        console.error("Worker registration error:", error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `Worker with this ${field} already exists.`
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Registration failed. Please try again.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Worker Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Worker login attempt:', email);

        // Find worker by email
        const worker = await Worker.findOne({ 
            email: email.toLowerCase().trim() 
        }).select('+password');

        if (!worker) {
            console.log('Worker not found:', email);
            return res.status(400).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        console.log('Worker found:', worker.email, 'Status:', worker.status);

        // Check password
        const isMatch = await worker.comparePassword(password);
        console.log('Password match:', isMatch);
        
        if (!isMatch) {
            console.log('Password mismatch for worker:', email);
            return res.status(400).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        // Check if worker is approved
        if (worker.status === 'pending') {
            return res.status(403).json({
                success: false,
                message: "Your account is pending approval. Please wait for admin verification.",
            });
        }

        if (worker.status === 'rejected' || worker.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: "Your account has been " + worker.status + ". Please contact support.",
            });
        }

        // Update last login
        worker.lastLogin = new Date();
        await worker.save();

        // Generate token
        const token = generateToken(worker);
        setTokenCookie(res, token);

        // Remove password from response
        const workerResponse = worker.toObject();
        delete workerResponse.password;

        console.log('Worker login successful:', email);

        res.json({
            success: true,
            message: "Login successful",
            worker: workerResponse,
            token,
        });

    } catch (error) {
        console.error("Worker login error:", error);
        res.status(500).json({
            success: false,
            message: "Login failed. Please try again.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get current worker profile
router.get("/me", authenticateWorker, async (req, res) => {
    try {
        const worker = await Worker.findById(req.user._id).select('-password');
        
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
        console.error("Get worker profile error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get worker profile"
        });
    }
});

// Update worker profile
router.put("/profile", authenticateWorker, async (req, res) => {
    try {
        const { first_name, last_name, phone, location, skills, availability, profile } = req.body;
        
        const updates = {};
        
        if (first_name) updates.first_name = first_name.trim();
        if (last_name) updates.last_name = last_name.trim();
        if (phone) {
            // Check if phone is already taken by another worker
            const existingWorker = await Worker.findOne({ 
                phone, 
                _id: { $ne: req.user._id } 
            });
            
            if (existingWorker) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number is already taken"
                });
            }
            updates.phone = phone;
        }
        
        if (location) updates.location = location;
        if (skills) updates.skills = skills;
        if (availability) updates.availability = availability;
        if (profile) updates.profile = { ...updates.profile, ...profile };

        const updatedWorker = await Worker.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: "Profile updated successfully",
            worker: updatedWorker,
        });

    } catch (error) {
        console.error("Worker profile update error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update profile",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Add/Update skills
router.put("/skills", authenticateWorker, async (req, res) => {
    try {
        const { skills } = req.body;
        
        if (!Array.isArray(skills)) {
            return res.status(400).json({
                success: false,
                message: "Skills must be an array"
            });
        }

        const worker = await Worker.findByIdAndUpdate(
            req.user._id,
            { skills },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: "Skills updated successfully",
            worker
        });

    } catch (error) {
        console.error("Update skills error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update skills"
        });
    }
});

// Update availability
router.put("/availability", authenticateWorker, async (req, res) => {
    try {
        const { status, workingDays, workingHours } = req.body;
        
        const availability = {};
        if (status) availability.status = status;
        if (workingDays) availability.workingDays = workingDays;
        if (workingHours) availability.workingHours = workingHours;

        const worker = await Worker.findByIdAndUpdate(
            req.user._id,
            { availability },
            { new: true }
        ).select('-password');

        res.json({
            success: true,
            message: "Availability updated successfully",
            worker
        });

    } catch (error) {
        console.error("Update availability error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update availability"
        });
    }
});

// Worker Logout
router.post("/logout", (req, res) => {
    res.clearCookie("workerToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        path: '/',
    });
    
    res.json({
        success: true,
        message: "Logged out successfully",
    });
});

// Worker Dashboard - Get assigned tasks
router.get("/dashboard/tasks", authenticateWorker, async (req, res) => {
    try {
        const { status } = req.query;
        
        const query = { assignedWorker: req.user._id };
        
        // Filter by status if provided
        if (status) {
            query.status = status;
        }

        const tasks = await Payment.find(query)
            .populate('user', 'first_name last_name email phone location')
            .sort({ assignedAt: -1 });

        // Calculate stats
        const stats = {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'PROVIDER_ASSIGNED').length,
            completed: tasks.filter(t => t.status === 'SERVICE_COMPLETED').length,
            codPending: tasks.filter(t => t.status === 'COD_PENDING').length,
        };

        res.json({
            success: true,
            tasks,
            stats
        });

    } catch (error) {
        console.error("Error fetching worker tasks:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch tasks",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Worker Dashboard - Get payment history
router.get("/dashboard/payments", authenticateWorker, async (req, res) => {
    try {
        const payments = await Payment.find({
            assignedWorker: req.user._id,
            status: { $in: ['SERVICE_COMPLETED', 'COD_PAID'] }
        })
        .populate('user', 'first_name last_name email phone')
        .sort({ completedAt: -1 });

        // Calculate total earnings
        const totalEarnings = payments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // Group by payment method
        const onlinePayments = payments.filter(p => p.paymentMethod === 'online');
        const codPayments = payments.filter(p => p.paymentMethod === 'cod');

        const stats = {
            totalEarnings,
            totalJobs: payments.length,
            onlineEarnings: onlinePayments.reduce((sum, p) => sum + p.amount, 0),
            codEarnings: codPayments.reduce((sum, p) => sum + p.amount, 0),
            onlineJobs: onlinePayments.length,
            codJobs: codPayments.length,
        };

        res.json({
            success: true,
            payments,
            stats
        });

    } catch (error) {
        console.error("Error fetching payment history:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch payment history",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Worker Dashboard - Get dashboard stats
router.get("/dashboard/stats", authenticateWorker, async (req, res) => {
    try {
        const worker = await Worker.findById(req.user._id);
        
        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found"
            });
        }

        // Get recent tasks
        const recentTasks = await Payment.find({
            assignedWorker: req.user._id
        })
        .sort({ assignedAt: -1 })
        .limit(5)
        .populate('user', 'first_name last_name');

        // Get pending tasks count
        const pendingTasks = await Payment.countDocuments({
            assignedWorker: req.user._id,
            status: 'PROVIDER_ASSIGNED'
        });

        // Get this month's earnings
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyEarnings = await Payment.aggregate([
            {
                $match: {
                    assignedWorker: worker._id,
                    status: { $in: ['SERVICE_COMPLETED', 'COD_PAID'] },
                    completedAt: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            stats: {
                totalJobsCompleted: worker.stats.totalJobsCompleted,
                totalJobsAssigned: worker.stats.totalJobsAssigned,
                totalEarnings: worker.stats.totalEarnings,
                rating: worker.stats.rating,
                totalRatings: worker.stats.totalRatings,
                pendingTasks,
                monthlyEarnings: monthlyEarnings[0]?.total || 0,
                monthlyJobs: monthlyEarnings[0]?.count || 0
            },
            recentTasks
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard stats",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Worker - Update task status
router.put("/tasks/:taskId/status", authenticateWorker, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;

        // Verify task is assigned to this worker
        const task = await Payment.findOne({
            _id: taskId,
            assignedWorker: req.user._id
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found or not assigned to you"
            });
        }

        // Workers can only mark as completed
        if (status !== 'SERVICE_COMPLETED') {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Workers can only mark tasks as completed."
            });
        }

        task.status = status;
        task.completedAt = new Date();
        await task.save();

        // Update worker stats
        await Worker.findByIdAndUpdate(req.user._id, {
            $inc: { 
                'stats.totalJobsCompleted': 1,
                'stats.totalEarnings': task.amount
            }
        });

        res.json({
            success: true,
            message: "Task marked as completed",
            task
        });

    } catch (error) {
        console.error("Error updating task status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update task status"
        });
    }
});

export default router;
