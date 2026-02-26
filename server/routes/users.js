import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import ServiceDetail from "../models/ServiceDetail.js";
import { validate, schemas, authLimiter } from "../middleware/validation.js";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

// Generate secure JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            user: { 
                _id: user._id,
                email: user.email,
                role: user.role 
            } 
        },
        process.env.JWT_SECRET,
        { 
            expiresIn: '7d',
            issuer: 'genie-marketplace',
            audience: 'genie-users'
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
    
    res.cookie("token", token, cookieOptions);
};

//Register
router.post("/register", authLimiter, validate(schemas.register), async (req, res) => {
    res.header("Access-Control-Allow-Credentials", true);

    const { first_name, last_name, phone, email, password, location } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ 
            $or: [
                { phone: phone },
                { email: email.toLowerCase() }
            ] 
        });
        
        if (user) {
            const existingField = user.email === email.toLowerCase() ? 'email' : 'phone';
            return res.status(400).json({ 
                success: false,
                message: `User with this ${existingField} already exists.` 
            });
        }

        // Create new user (password will be hashed by pre-save hook)
        user = new User({
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            phone,
            email: email.toLowerCase().trim(),
            password, // This will be hashed by the User model pre-save hook
            role: "user",
            location: location || undefined, // Add location if provided
        });

        await user.save();

        // Generate token
        const token = generateToken(user);
        setTokenCookie(res, token);

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: userResponse,
            token,
        });

    } catch (error) {
        console.error("Registration error:", error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `User with this ${field} already exists.`
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Registration failed. Please try again.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

//Login
router.post("/login", authLimiter, validate(schemas.login), async (req, res) => {
    res.header("Access-Control-Allow-Credentials", true);

    const { email, password } = req.body;

    try {
        // Find user by email (case insensitive)
        const user = await User.findOne({ 
            email: email.toLowerCase().trim() 
        }).select('+password'); // Include password for comparison

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        // Check if account is active (if you have account status)
        if (user.status && user.status === 'inactive') {
            return res.status(403).json({
                success: false,
                message: "Account is inactive. Please contact support.",
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user);
        setTokenCookie(res, token);

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            message: "Login successful",
            user: userResponse,
            token,
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Login failed. Please try again.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Logout
router.post("/logout", (req, res) => {
    res.clearCookie("token", {
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

// Get current user
router.get("/me", authenticateUser, async (req, res) => {
    try {
        // User is already attached by authenticateUser middleware
        const userResponse = req.user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            user: userResponse,
        });
    } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get user information",
        });
    }
});

// Legacy route for backward compatibility - Optimized
router.get("/user", authenticateUser, async (req, res) => {
    try {
        // Use lean() for faster queries and select only needed fields
        const user = await User.findById(req.user._id)
            .select('-password -__v') // Exclude password and version
            .lean(); // Convert to plain JavaScript object for better performance

        if (!user) {
            return res.status(404).json({
                isAuthenticated: false,
                msg: "User not found"
            });
        }

        res.json({ 
            isAuthenticated: true, 
            user 
        });
    } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({
            isAuthenticated: false,
            msg: "Server Error"
        });
    }
});

// Update user profile
router.put("/profile", authenticateUser, async (req, res) => {
    try {
        const { first_name, last_name, phone, location } = req.body;
        
        // Validate input
        const updates = {};
        if (first_name) {
            if (!/^[a-zA-Z\s]{2,50}$/.test(first_name)) {
                return res.status(400).json({
                    success: false,
                    message: "First name must be 2-50 characters and contain only letters and spaces"
                });
            }
            updates.first_name = first_name.trim();
        }
        
        if (last_name) {
            if (!/^[a-zA-Z\s]{2,50}$/.test(last_name)) {
                return res.status(400).json({
                    success: false,
                    message: "Last name must be 2-50 characters and contain only letters and spaces"
                });
            }
            updates.last_name = last_name.trim();
        }
        
        if (phone) {
            if (!/^\d{10}$/.test(phone)) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number must be 10 digits"
                });
            }
            
            // Check if phone is already taken by another user
            const existingUser = await User.findOne({ 
                phone, 
                _id: { $ne: req.user._id } 
            });
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number is already taken"
                });
            }
            
            updates.phone = phone;
        }

        if (location) {
            updates.location = location;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields to update"
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser,
        });

    } catch (error) {
        console.error("Profile update error:", error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field} is already taken`
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Failed to update profile",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Change password
router.put("/change-password", authenticateUser, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required"
            });
        }

        // Validate new password
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 8 characters long"
            });
        }

        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
            });
        }

        // Get user with password
        const user = await User.findById(req.user._id).select('+password');

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        // Hash new password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await User.findByIdAndUpdate(req.user._id, { 
            password: hashedPassword,
            passwordChangedAt: new Date()
        });

        res.json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to change password",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Cart management routes
const auth = authenticateUser; // Alias for backward compatibility

// Update user's cart with retry logic for version conflicts
router.put("/cart", auth, async (req, res) => {
    const maxRetries = 3;
    let retryCount = 0;

    const updateCart = async () => {
        try {
            const cartItems = req.body;
            if (!Array.isArray(cartItems)) {
                return res.status(400).json({ msg: "Invalid cart data format" });
            }

            // Prepare cart data - handle both _id and service fields
            const cartData = cartItems.map((item) => ({
                service: item.service || item._id, // Support both field names
                quantity: parseInt(item.quantity, 10),
                title: item.title || "",
                OurPrice: parseFloat(item.OurPrice || 0),
                total: parseFloat(item.OurPrice || 0) * parseInt(item.quantity, 10),
                category: item.category || "",
                type: item.type || "",
                time: item.time || "",
                MRP: parseFloat(item.MRP || 0),
                description: Array.isArray(item.description)
                    ? item.description
                    : [],
                image: item.image || "",
            })).filter(item => item.service); // Filter out items without service ID

            // Use findByIdAndUpdate with atomic operation to avoid version conflicts
            const updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                { $set: { cart: cartData } },
                { 
                    new: true, 
                    runValidators: true,
                    overwrite: false
                }
            );

            if (!updatedUser) {
                return res.status(404).json({ msg: "User not found" });
            }

            res.json(updatedUser.cart);
        } catch (err) {
            // Handle version error with retry
            if (err.name === 'VersionError' && retryCount < maxRetries) {
                retryCount++;
                console.log(`Cart update retry ${retryCount}/${maxRetries} for user ${req.user._id}`);
                await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
                return updateCart();
            }
            
            console.error("Cart update error:", err);
            
            if (err.name === 'VersionError') {
                return res.status(409).json({ 
                    msg: "Cart update conflict. Please try again.",
                    error: "CONCURRENT_UPDATE"
                });
            }
            
            res.status(400).json({ msg: err.message });
        }
    };

    await updateCart();
});

// Get cart
router.get("/cart", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        res.json({ cart: user.cart || [] });
    } catch (err) {
        console.error("Get cart error:", err);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Add item to cart
router.post("/cart/add", auth, async (req, res) => {
    try {
        const { service, quantity = 1, title, OurPrice, category, type, time, MRP, description, image } = req.body;
        
        if (!service) {
            return res.status(400).json({ msg: "Service ID is required" });
        }

        const cartItem = {
            service,
            quantity: parseInt(quantity, 10),
            title: title || "",
            OurPrice: parseFloat(OurPrice || 0),
            total: parseFloat(OurPrice || 0) * parseInt(quantity, 10),
            category: category || "",
            type: type || "",
            time: time || "",
            MRP: parseFloat(MRP || 0),
            description: Array.isArray(description) ? description : [],
            image: image || "",
        };

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        const existingItemIndex = user.cart.findIndex(item => item.service.toString() === service);
        
        let updatedUser;
        if (existingItemIndex >= 0) {
            updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                { 
                    $set: { 
                        [`cart.${existingItemIndex}.quantity`]: user.cart[existingItemIndex].quantity + parseInt(quantity, 10),
                        [`cart.${existingItemIndex}.total`]: (user.cart[existingItemIndex].quantity + parseInt(quantity, 10)) * parseFloat(OurPrice || 0)
                    }
                },
                { new: true }
            );
        } else {
            updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                { $push: { cart: cartItem } },
                { new: true }
            );
        }

        res.json({ cart: updatedUser.cart });
    } catch (err) {
        console.error("Add to cart error:", err);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Remove item from cart
router.delete("/cart/remove/:serviceId", auth, async (req, res) => {
    try {
        const { serviceId } = req.params;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { cart: { service: serviceId } } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ msg: "User not found" });
        }

        res.json({ cart: updatedUser.cart });
    } catch (err) {
        console.error("Remove from cart error:", err);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Update cart item quantity
router.put("/cart/update/:serviceId", auth, async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { quantity } = req.body;
        
        if (!quantity || quantity < 1) {
            return res.status(400).json({ msg: "Valid quantity is required" });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        const itemIndex = user.cart.findIndex(item => item.service.toString() === serviceId);
        if (itemIndex === -1) {
            return res.status(404).json({ msg: "Item not found in cart" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { 
                $set: { 
                    [`cart.${itemIndex}.quantity`]: parseInt(quantity, 10),
                    [`cart.${itemIndex}.total`]: parseInt(quantity, 10) * user.cart[itemIndex].OurPrice
                }
            },
            { new: true }
        );

        res.json({ cart: updatedUser.cart });
    } catch (err) {
        console.error("Update cart item error:", err);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Clear cart
router.delete("/cart", auth, async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { cart: [] } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ msg: "User not found" });
        }

        res.json({ msg: "Cart cleared successfully", cart: [] });
    } catch (err) {
        console.error("Clear cart error:", err);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Get all services (public route)
router.get("/services", async (req, res) => {
    try {
        const services = await ServiceDetail.find({}).sort({ createdAt: -1 });
        res.json({
            success: true,
            services,
        });
    } catch (error) {
        console.error("Get services error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch services",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;
