// middleware/validation.js
import joi from 'joi';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';

// Rate limiting configurations
export const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: 900
    },
    skipSuccessfulRequests: true,
});

export const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 search requests per minute
    message: {
        error: 'Too many search requests, please slow down.',
        retryAfter: 60
    },
});

// Security middleware
export const securityMiddleware = [
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:", "https:"],
                scriptSrc: ["'self'"],
                connectSrc: ["'self'", process.env.CLIENT_URL],
            },
        },
    }),
    mongoSanitize(), // Prevent NoSQL injection
];

// Input sanitization
export const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return xss(input.trim());
    }
    if (typeof input === 'object' && input !== null) {
        const sanitized = {};
        for (const [key, value] of Object.entries(input)) {
            sanitized[key] = sanitizeInput(value);
        }
        return sanitized;
    }
    return input;
};

// Validation schemas
export const schemas = {
    register: joi.object({
        first_name: joi.string().min(2).max(50).pattern(/^[a-zA-Z\s]+$/).required(),
        last_name: joi.string().min(2).max(50).pattern(/^[a-zA-Z\s]+$/).required(),
        email: joi.string().email().required(),
        phone: joi.string().pattern(/^\d{10}$/).required(),
        password: joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
            .messages({
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
            }),
        location: joi.object({
            area: joi.string().allow('').optional(),
            city: joi.string().allow('').optional(),
            state: joi.string().allow('').optional(),
            pincode: joi.string().allow('').optional(),
            formattedAddress: joi.string().allow('').optional(),
            coordinates: joi.object({
                lat: joi.number().optional(),
                lng: joi.number().optional()
            }).optional()
        }).optional()
    }),

    login: joi.object({
        email: joi.string().email().required(),
        password: joi.string().required(),
    }),

    listing: joi.object({
        title: joi.string().min(5).max(100).required(),
        description: joi.string().min(20).max(2000).required(),
        price: joi.number().min(0).max(1000000).required(),
        category: joi.string().required(),
        condition: joi.string().valid('new', 'like-new', 'good', 'fair', 'poor').required(),
        location: joi.string().min(2).max(100).required(),
        contactInfo: joi.object({
            phone: joi.string().pattern(/^\d{10}$/).required(),
            email: joi.string().email().required(),
            preferredContact: joi.string().valid('phone', 'email').required(),
        }).required(),
    }),

    search: joi.object({
        search: joi.string().max(100).optional(),
        category: joi.string().max(50).optional(),
        priceMin: joi.number().min(0).max(999999).optional(),
        priceMax: joi.number().min(0).max(1000000).optional(),
        condition: joi.alternatives().try(
            joi.string().valid('new', 'like-new', 'good', 'fair', 'poor'),
            joi.array().items(joi.string().valid('new', 'like-new', 'good', 'fair', 'poor'))
        ).optional(),
        location: joi.string().max(100).optional(),
        page: joi.number().integer().min(1).max(1000).optional(),
        limit: joi.number().integer().min(1).max(50).optional(), // Cap at 50 items per page
        sortBy: joi.string().valid('createdAt', 'price', 'title', 'views').optional(),
        sortOrder: joi.string().valid('asc', 'desc').optional(),
    }),

    payment: joi.object({
        razorpay_order_id: joi.string().required(),
        razorpay_payment_id: joi.string().required(),
        razorpay_signature: joi.string().required(),
        orderDetails: joi.object({
            _id: joi.string().required(),
            items: joi.array().required(),
            summary: joi.object().required(),
            customerDetails: joi.object().required(),
        }).required(),
    }),
};

// Validation middleware factory
export const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { 
            abortEarly: false,
            stripUnknown: true 
        });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }
        
        // Sanitize the validated input
        req.body = sanitizeInput(value);
        next();
    };
};

// Query validation middleware
export const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, { 
            abortEarly: false,
            stripUnknown: true 
        });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            
            return res.status(400).json({
                success: false,
                message: 'Query validation failed',
                errors
            });
        }
        
        // Sanitize the validated query
        req.query = sanitizeInput(value);
        next();
    };
};

// CSRF protection (to be implemented with csurf)
export const csrfProtection = (req, res, next) => {
    // Skip CSRF for GET requests and API endpoints in development
    if (req.method === 'GET' || process.env.NODE_ENV === 'development') {
        return next();
    }
    
    // In production, implement proper CSRF token validation
    // This is a placeholder - implement with csurf middleware
    next();
};