// middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Worker from "../models/Worker.js";

export const authenticateUser = async (req, res, next) => {
    try {
        // Get token from cookie or Authorization header
        let token = req.cookies.token;
        
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided.",
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from database (excluding password)
            const user = await User.findById(decoded.user._id).select(
                "-password"
            );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found.",
                });
            }

            // Add user to request object
            req.user = user;
            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: "Token expired. Please login again.",
                });
            }
            return res.status(401).json({
                success: false,
                message: "Invalid token.",
            });
        }
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

// Worker authentication middleware
export const authenticateWorker = async (req, res, next) => {
    try {
        // Get token from workerToken cookie or Authorization header
        let token = req.cookies.workerToken;
        
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided.",
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get worker from database (excluding password)
            const worker = await Worker.findById(decoded.worker._id).select(
                "-password"
            );

            if (!worker) {
                return res.status(404).json({
                    success: false,
                    message: "Worker not found.",
                });
            }

            // Check if worker is approved
            if (worker.status !== 'approved') {
                return res.status(403).json({
                    success: false,
                    message: "Worker account is not approved.",
                });
            }

            // Add worker to request object as user (for compatibility)
            req.user = worker;
            req.worker = worker;
            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: "Token expired. Please login again.",
                });
            }
            return res.status(401).json({
                success: false,
                message: "Invalid token.",
            });
        }
    } catch (error) {
        console.error("Worker auth middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

export const authenticateAdmin = async (req, res, next) => {
    try {
        // First authenticate as user
        await new Promise((resolve, reject) => {
            authenticateUser(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Check if user is admin
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin privileges required.",
            });
        }

        next();
    } catch (error) {
        console.error("Admin auth middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

// Middleware to check if user owns the resource
export const checkOwnership = (resourceModel, resourceIdParam = 'id') => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params[resourceIdParam];
            const resource = await resourceModel.findById(resourceId);

            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: "Resource not found.",
                });
            }

            // Check if user owns the resource or is admin
            if (resource.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. You don't own this resource.",
                });
            }

            req.resource = resource;
            next();
        } catch (error) {
            console.error("Ownership check error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error.",
            });
        }
    };
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
    try {
        let token = req.cookies.token;
        
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.user._id).select("-password");
                if (user) {
                    req.user = user;
                }
            } catch (err) {
                // Token invalid, but continue without user
                console.log("Optional auth failed:", err.message);
            }
        }

        next();
    } catch (error) {
        console.error("Optional auth middleware error:", error);
        next(); // Continue without authentication
    }
};

// Alias for backward compatibility
export const isAdmin = authenticateAdmin;
