// services/imageProcessingService.js
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Image size configurations
const IMAGE_SIZES = {
    thumbnail: { width: 200, height: 200, quality: 80 },
    medium: { width: 600, height: 600, quality: 85 },
    full: { width: 1200, height: 1200, quality: 90 }
};

// Base directory for marketplace images
const MARKETPLACE_IMAGES_DIR = 'public/assets/marketplace/images';

/**
 * Process uploaded image to create multiple sizes with optimization
 * @param {string|Buffer} input - Path to the original uploaded image or Buffer data
 * @param {string} baseFilename - Base filename without extension
 * @param {string} outputDir - Output directory (optional, defaults to MARKETPLACE_IMAGES_DIR)
 * @returns {Promise<Object>} Object containing paths and metadata for all processed images
 */
export const processImage = async (input, baseFilename, outputDir = MARKETPLACE_IMAGES_DIR) => {
    try {
        let sharpInput;
        let inputMetadata;

        // Handle both file paths and buffer inputs
        if (Buffer.isBuffer(input)) {
            sharpInput = input;
            inputMetadata = await sharp(input).metadata();
        } else {
            // Ensure the input file exists
            if (!fs.existsSync(input)) {
                throw new Error(`Input image file not found: ${input}`);
            }
            sharpInput = input;
            inputMetadata = await sharp(input).metadata();
        }

        // Get image metadata
        const metadata = inputMetadata;
        
        // Validate image format
        if (!['jpeg', 'jpg', 'png', 'webp'].includes(metadata.format)) {
            throw new Error(`Unsupported image format: ${metadata.format}`);
        }

        const processedImages = {};
        const originalExtension = path.extname(baseFilename);
        const nameWithoutExt = path.basename(baseFilename, originalExtension);

        // Process each size
        for (const [sizeName, config] of Object.entries(IMAGE_SIZES)) {
            const outputFilename = `${nameWithoutExt}-${sizeName}${originalExtension}`;
            const outputPath = path.join(outputDir, outputFilename);

            // Ensure output directory exists
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Create sharp instance for processing
            let sharpInstance = sharp(sharpInput);

            // Resize image while maintaining aspect ratio
            sharpInstance = sharpInstance.resize(config.width, config.height, {
                fit: 'inside', // Maintain aspect ratio, fit within dimensions
                withoutEnlargement: true // Don't enlarge smaller images
            });

            // Apply format-specific optimizations
            switch (metadata.format) {
                case 'jpeg':
                case 'jpg':
                    sharpInstance = sharpInstance.jpeg({ 
                        quality: config.quality,
                        progressive: true,
                        mozjpeg: true // Use mozjpeg encoder for better compression
                    });
                    break;
                case 'png':
                    sharpInstance = sharpInstance.png({ 
                        quality: config.quality,
                        compressionLevel: 9,
                        progressive: true
                    });
                    break;
                case 'webp':
                    sharpInstance = sharpInstance.webp({ 
                        quality: config.quality,
                        effort: 6 // Higher effort for better compression
                    });
                    break;
            }

            // Process and save the image
            await sharpInstance.toFile(outputPath);

            // Get processed image metadata
            const processedMetadata = await sharp(outputPath).metadata();

            processedImages[sizeName] = {
                filename: outputFilename,
                path: outputPath,
                url: outputDir === MARKETPLACE_IMAGES_DIR ? `/assets/marketplace/images/${outputFilename}` : `/${path.relative('public', outputPath)}`,
                width: processedMetadata.width,
                height: processedMetadata.height,
                size: fs.statSync(outputPath).size,
                format: processedMetadata.format
            };
        }

        // Remove the original uploaded file after processing (only if it's a file path, not buffer)
        if (typeof input === 'string') {
            try {
                fs.unlinkSync(input);
            } catch (error) {
                console.warn(`Warning: Could not delete original file ${input}:`, error.message);
            }
        }

        return {
            success: true,
            originalMetadata: {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: Buffer.isBuffer(input) ? input.length : (fs.existsSync(input) ? fs.statSync(input).size : 0)
            },
            processedImages
        };

    } catch (error) {
        console.error('Error processing image:', error);
        
        // Clean up any partially processed files
        const nameWithoutExt = path.basename(baseFilename, path.extname(baseFilename));
        for (const sizeName of Object.keys(IMAGE_SIZES)) {
            const outputFilename = `${nameWithoutExt}-${sizeName}${path.extname(baseFilename)}`;
            const outputPath = path.join(outputDir, outputFilename);
            try {
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            } catch (cleanupError) {
                console.warn(`Warning: Could not clean up file ${outputPath}:`, cleanupError.message);
            }
        }

        throw new Error(`Image processing failed: ${error.message}`);
    }
};

/**
 * Delete all sizes of a processed image and any original file
 * @param {string} baseFilename - Base filename of the image to delete
 * @returns {Promise<Object>} Result of deletion operation
 */
export const deleteProcessedImage = async (baseFilename) => {
    try {
        const originalExtension = path.extname(baseFilename);
        const nameWithoutExt = path.basename(baseFilename, originalExtension);
        const deletedFiles = [];
        const errors = [];

        // Delete all size variants
        for (const sizeName of Object.keys(IMAGE_SIZES)) {
            const filename = `${nameWithoutExt}-${sizeName}${originalExtension}`;
            const filePath = path.join(MARKETPLACE_IMAGES_DIR, filename);

            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    deletedFiles.push(filename);
                }
            } catch (error) {
                errors.push({ filename, error: error.message });
            }
        }

        // Also try to delete the original file if it still exists
        const originalPath = path.join(MARKETPLACE_IMAGES_DIR, baseFilename);
        try {
            if (fs.existsSync(originalPath)) {
                fs.unlinkSync(originalPath);
                deletedFiles.push(baseFilename);
            }
        } catch (error) {
            errors.push({ filename: baseFilename, error: error.message });
        }

        return {
            success: errors.length === 0,
            deletedFiles,
            errors
        };

    } catch (error) {
        console.error('Error deleting processed image:', error);
        return {
            success: false,
            deletedFiles: [],
            errors: [{ filename: baseFilename, error: error.message }]
        };
    }
};

/**
 * Get image URLs for all sizes of a processed image
 * @param {string} baseFilename - Base filename of the image
 * @returns {Object} Object containing URLs for all image sizes
 */
export const getImageUrls = (baseFilename) => {
    const originalExtension = path.extname(baseFilename);
    const nameWithoutExt = path.basename(baseFilename, originalExtension);
    const urls = {};

    for (const sizeName of Object.keys(IMAGE_SIZES)) {
        const filename = `${nameWithoutExt}-${sizeName}${originalExtension}`;
        urls[sizeName] = `/assets/marketplace/images/${filename}`;
    }

    return urls;
};

/**
 * Check if processed images exist for a given base filename
 * @param {string} baseFilename - Base filename to check
 * @returns {Object} Object indicating which sizes exist
 */
export const checkProcessedImagesExist = (baseFilename) => {
    const originalExtension = path.extname(baseFilename);
    const nameWithoutExt = path.basename(baseFilename, originalExtension);
    const exists = {};

    for (const sizeName of Object.keys(IMAGE_SIZES)) {
        const filename = `${nameWithoutExt}-${sizeName}${originalExtension}`;
        const filePath = path.join(MARKETPLACE_IMAGES_DIR, filename);
        exists[sizeName] = fs.existsSync(filePath);
    }

    return exists;
};

/**
 * Get caching headers for image responses
 * @returns {Object} Headers object with caching directives
 */
export const getImageCacheHeaders = () => {
    return {
        'Cache-Control': 'public, max-age=31536000, immutable', // 1 year cache
        'ETag': `"${Date.now()}"`, // Simple ETag based on current time
        'Last-Modified': new Date().toUTCString(),
        'Vary': 'Accept-Encoding'
    };
};

/**
 * Validate image file before processing
 * @param {string|Buffer} input - Path to the image file or Buffer data
 * @returns {Promise<Object>} Validation result
 */
export const validateImage = async (input) => {
    try {
        let metadata;
        let fileSize;

        if (Buffer.isBuffer(input)) {
            metadata = await sharp(input).metadata();
            fileSize = input.length;
        } else {
            if (!fs.existsSync(input)) {
                return { valid: false, error: 'File does not exist' };
            }
            metadata = await sharp(input).metadata();
            fileSize = fs.statSync(input).size;
        }
        
        // Check format
        if (!['jpeg', 'jpg', 'png', 'webp'].includes(metadata.format)) {
            return { valid: false, error: `Unsupported format: ${metadata.format}` };
        }

        // Check dimensions (minimum and maximum)
        const minDimension = 100;
        const maxDimension = 5000;
        
        if (metadata.width < minDimension || metadata.height < minDimension) {
            return { 
                valid: false, 
                error: `Image too small. Minimum dimensions: ${minDimension}x${minDimension}px` 
            };
        }

        if (metadata.width > maxDimension || metadata.height > maxDimension) {
            return { 
                valid: false, 
                error: `Image too large. Maximum dimensions: ${maxDimension}x${maxDimension}px` 
            };
        }

        // Check file size
        const maxFileSize = 5 * 1024 * 1024; // 5MB

        if (fileSize > maxFileSize) {
            return { 
                valid: false, 
                error: `File too large. Maximum size: ${maxFileSize / (1024 * 1024)}MB` 
            };
        }

        return { 
            valid: true, 
            metadata: {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: fileSize
            }
        };

    } catch (error) {
        return { valid: false, error: `Validation failed: ${error.message}` };
    }
};