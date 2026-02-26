// middleware/upload.js
import multer from "multer";
import path from "path";
import fs from "fs";
import { processImage, deleteProcessedImage, getImageUrls, getImageCacheHeaders } from "../services/imageProcessingService.js";

// Ensure marketplace images directory exists
const marketplaceImagesDir = "public/assets/marketplace/images";
if (!fs.existsSync(marketplaceImagesDir)) {
    fs.mkdirSync(marketplaceImagesDir, { recursive: true });
}

// Multer storage configuration for marketplace images
const marketplaceStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, marketplaceImagesDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with listing ID and timestamp
        const listingId = req.params.id;
        const timestamp = Date.now();
        const randomSuffix = Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        
        const filename = `listing-${listingId}-${timestamp}-${randomSuffix}${ext}`;
        cb(null, filename);
    },
});

// File filter for marketplace images
const marketplaceFileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    
    if (allowedExtensions.includes(ext)) {
        // Check MIME type as additional security
        const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/webp'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
        }
    } else {
        cb(new Error('Invalid file extension. Only .jpg, .jpeg, .png, and .webp files are allowed.'), false);
    }
};

// Multer configuration for marketplace image uploads
export const marketplaceImageUpload = multer({
    storage: marketplaceStorage,
    fileFilter: marketplaceFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per image
        files: 8 // Maximum 8 images per request
    }
});

// Middleware to validate image count per listing
export const validateImageCount = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Import Listing model dynamically to avoid circular dependency
        const { default: Listing } = await import('../models/Listing.js');
        
        // Find the listing
        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found',
                code: 'LISTING_NOT_FOUND'
            });
        }
        
        // Check if user owns the listing or is admin
        if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only upload images to your own listings.',
                code: 'ACCESS_DENIED'
            });
        }
        
        // Check current image count
        const currentImageCount = listing.images.length;
        const newImageCount = req.files ? req.files.length : 0;
        
        if (currentImageCount + newImageCount > 8) {
            return res.status(400).json({
                success: false,
                message: `Cannot upload ${newImageCount} images. Listing already has ${currentImageCount} images. Maximum allowed is 8 images per listing.`,
                code: 'IMAGE_LIMIT_EXCEEDED',
                details: {
                    currentCount: currentImageCount,
                    attemptedUpload: newImageCount,
                    maxAllowed: 8
                }
            });
        }
        
        // Add listing to request for use in route handler
        req.listing = listing;
        next();
        
    } catch (error) {
        console.error('Error validating image count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate image upload',
            error: error.message
        });
    }
};

// Error handling middleware for multer errors
export const handleUploadErrors = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum file size is 5MB per image.',
                code: 'FILE_TOO_LARGE',
                details: {
                    maxSize: '5MB',
                    field: error.field
                }
            });
        }
        
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum 8 images can be uploaded at once.',
                code: 'TOO_MANY_FILES',
                details: {
                    maxFiles: 8
                }
            });
        }
        
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file field. Use "images" field for file uploads.',
                code: 'UNEXPECTED_FILE_FIELD',
                details: {
                    expectedField: 'images',
                    receivedField: error.field
                }
            });
        }
        
        return res.status(400).json({
            success: false,
            message: 'File upload error',
            code: 'UPLOAD_ERROR',
            error: error.message
        });
    }
    
    // Handle custom file filter errors
    if (error.message.includes('Invalid file type') || error.message.includes('Invalid file extension')) {
        return res.status(400).json({
            success: false,
            message: error.message,
            code: 'INVALID_FILE_TYPE',
            details: {
                allowedTypes: ['JPEG', 'PNG', 'WebP'],
                allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
            }
        });
    }
    
    // Pass other errors to the next error handler
    next(error);
};

// Utility function to clean up uploaded files on error
export const cleanupUploadedFiles = (files) => {
    if (!files || !Array.isArray(files)) return;
    
    files.forEach(file => {
        try {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
                console.log(`Cleaned up uploaded file: ${file.filename}`);
            }
        } catch (error) {
            console.error(`Error cleaning up file ${file.filename}:`, error);
        }
    });
};

// Utility function to delete image file from filesystem
export const deleteImageFile = async (filename) => {
    try {
        // Delete all processed sizes of the image
        const result = await deleteProcessedImage(filename);
        
        if (result.success) {
            console.log(`Deleted processed image files for: ${filename}`);
            return true;
        } else {
            console.error(`Error deleting some image files for ${filename}:`, result.errors);
            return result.deletedFiles.length > 0; // Return true if at least some files were deleted
        }
    } catch (error) {
        console.error(`Error deleting image file ${filename}:`, error);
        return false;
    }
};

// Utility function to get image URL (returns URLs for all sizes)
export const getImageUrl = (filename) => {
    return getImageUrls(filename);
};

// Process uploaded images to create multiple sizes
export const processUploadedImages = async (files) => {
    const processedResults = [];
    const errors = [];

    for (const file of files) {
        try {
            const result = await processImage(file.path, file.filename);
            processedResults.push({
                originalFilename: file.filename,
                originalName: file.originalname,
                ...result
            });
        } catch (error) {
            console.error(`Error processing image ${file.filename}:`, error);
            errors.push({
                filename: file.filename,
                originalName: file.originalname,
                error: error.message
            });
            
            // Clean up the original file if processing failed
            try {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            } catch (cleanupError) {
                console.warn(`Could not clean up failed upload ${file.path}:`, cleanupError);
            }
        }
    }

    return { processedResults, errors };
};

// Middleware to set caching headers for image responses
export const setImageCacheHeaders = (req, res, next) => {
    const headers = getImageCacheHeaders();
    Object.entries(headers).forEach(([key, value]) => {
        res.set(key, value);
    });
    next();
};