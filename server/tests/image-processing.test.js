// tests/image-processing.test.js
import { 
    processImage, 
    deleteProcessedImage, 
    getImageUrls, 
    checkProcessedImagesExist,
    getImageCacheHeaders,
    validateImage
} from '../services/imageProcessingService.js';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

describe('Image Processing Service', () => {
    const testImageDir = 'public/assets/marketplace/images';
    
    beforeAll(async () => {
        // Ensure test directory exists
        if (!fs.existsSync(testImageDir)) {
            fs.mkdirSync(testImageDir, { recursive: true });
        }
    });
    
    afterAll(() => {
        // Clean up all test files
        const testFiles = [
            'test-image.jpg',
            'test-image-thumbnail.jpg',
            'test-image-medium.jpg', 
            'test-image-full.jpg',
            'test-image-2.jpg',
            'test-image-2-thumbnail.jpg',
            'test-image-2-medium.jpg', 
            'test-image-2-full.jpg',
            'test-image-3.jpg',
            'test-image-3-thumbnail.jpg',
            'test-image-3-medium.jpg', 
            'test-image-3-full.jpg',
            'test-image-4.jpg',
            'test-image-4-thumbnail.jpg',
            'test-image-4-medium.jpg', 
            'test-image-4-full.jpg',
            'validation-test.jpg',
            'large-test.jpg',
            'small-test.jpg',
            'invalid.jpg'
        ];
        
        testFiles.forEach(filename => {
            const filePath = path.join(testImageDir, filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });
    });

    // Helper function to create a test image
    const createTestImage = async (filename, width = 800, height = 600) => {
        const testImagePath = path.join(testImageDir, filename);
        await sharp({
            create: {
                width,
                height,
                channels: 3,
                background: { r: 255, g: 0, b: 0 }
            }
        })
        .jpeg()
        .toFile(testImagePath);
        return testImagePath;
    };

    describe('processImage', () => {
        test('should create multiple image sizes', async () => {
            const testImagePath = await createTestImage('test-image.jpg');
            const result = await processImage(testImagePath, 'test-image.jpg');
            
            expect(result.success).toBe(true);
            expect(result.processedImages).toHaveProperty('thumbnail');
            expect(result.processedImages).toHaveProperty('medium');
            expect(result.processedImages).toHaveProperty('full');
            
            // Check that files were created
            expect(fs.existsSync(result.processedImages.thumbnail.path)).toBe(true);
            expect(fs.existsSync(result.processedImages.medium.path)).toBe(true);
            expect(fs.existsSync(result.processedImages.full.path)).toBe(true);
        });

        test('should maintain aspect ratio', async () => {
            const testImagePath = await createTestImage('test-image-2.jpg');
            const result = await processImage(testImagePath, 'test-image-2.jpg');
            
            // Check thumbnail dimensions (should be within 200x200 but maintain aspect ratio)
            const thumbnailMetadata = await sharp(result.processedImages.thumbnail.path).metadata();
            expect(thumbnailMetadata.width).toBeLessThanOrEqual(200);
            expect(thumbnailMetadata.height).toBeLessThanOrEqual(200);
            
            // Original aspect ratio: 800/600 = 1.33
            const originalAspectRatio = 800 / 600;
            const thumbnailAspectRatio = thumbnailMetadata.width / thumbnailMetadata.height;
            
            // Allow small tolerance for rounding
            expect(Math.abs(originalAspectRatio - thumbnailAspectRatio)).toBeLessThan(0.01);
        });

        test('should optimize image quality', async () => {
            const testImagePath = await createTestImage('test-image-3.jpg');
            const originalSize = fs.statSync(testImagePath).size;
            
            const result = await processImage(testImagePath, 'test-image-3.jpg');
            
            // Check that processed images are smaller than original (due to optimization)
            const thumbnailSize = result.processedImages.thumbnail.size;
            const mediumSize = result.processedImages.medium.size;
            
            expect(thumbnailSize).toBeLessThan(originalSize);
            expect(mediumSize).toBeLessThan(originalSize);
        });

        test('should handle invalid image format', async () => {
            // Create a text file with image extension
            const invalidImagePath = path.join(testImageDir, 'invalid.jpg');
            fs.writeFileSync(invalidImagePath, 'This is not an image');
            
            await expect(processImage(invalidImagePath, 'invalid.jpg')).rejects.toThrow();
            
            // Clean up
            if (fs.existsSync(invalidImagePath)) {
                fs.unlinkSync(invalidImagePath);
            }
        });
    });

    describe('getImageUrls', () => {
        test('should return URLs for all image sizes', () => {
            const urls = getImageUrls('test-image.jpg');
            
            expect(urls).toHaveProperty('thumbnail');
            expect(urls).toHaveProperty('medium');
            expect(urls).toHaveProperty('full');
            
            expect(urls.thumbnail).toBe('/assets/marketplace/images/test-image-thumbnail.jpg');
            expect(urls.medium).toBe('/assets/marketplace/images/test-image-medium.jpg');
            expect(urls.full).toBe('/assets/marketplace/images/test-image-full.jpg');
        });
    });

    describe('checkProcessedImagesExist', () => {
        test('should check existence of processed images', async () => {
            // First process an image
            const testImagePath = await createTestImage('test-image-4.jpg');
            await processImage(testImagePath, 'test-image-4.jpg');
            
            const exists = checkProcessedImagesExist('test-image-4.jpg');
            
            expect(exists.thumbnail).toBe(true);
            expect(exists.medium).toBe(true);
            expect(exists.full).toBe(true);
        });

        test('should return false for non-existent images', () => {
            const exists = checkProcessedImagesExist('non-existent.jpg');
            
            expect(exists.thumbnail).toBe(false);
            expect(exists.medium).toBe(false);
            expect(exists.full).toBe(false);
        });
    });

    describe('deleteProcessedImage', () => {
        test('should delete all processed image sizes', async () => {
            // First process an image
            const testImagePath = await createTestImage('test-delete.jpg');
            await processImage(testImagePath, 'test-delete.jpg');
            
            // Verify files exist
            const existsBefore = checkProcessedImagesExist('test-delete.jpg');
            expect(existsBefore.thumbnail).toBe(true);
            
            // Delete processed images
            const result = await deleteProcessedImage('test-delete.jpg');
            
            expect(result.success).toBe(true);
            expect(result.deletedFiles.length).toBeGreaterThan(0);
            
            // Verify files are deleted
            const existsAfter = checkProcessedImagesExist('test-delete.jpg');
            expect(existsAfter.thumbnail).toBe(false);
            expect(existsAfter.medium).toBe(false);
            expect(existsAfter.full).toBe(false);
        });
    });

    describe('getImageCacheHeaders', () => {
        test('should return proper caching headers', () => {
            const headers = getImageCacheHeaders();
            
            expect(headers).toHaveProperty('Cache-Control');
            expect(headers).toHaveProperty('ETag');
            expect(headers).toHaveProperty('Last-Modified');
            expect(headers).toHaveProperty('Vary');
            
            expect(headers['Cache-Control']).toContain('public');
            expect(headers['Cache-Control']).toContain('max-age=31536000');
            expect(headers['Cache-Control']).toContain('immutable');
        });
    });

    describe('validateImage', () => {
        test('should validate correct image format and size', async () => {
            const testImagePath = await createTestImage('validation-test.jpg');
            const result = await validateImage(testImagePath);
            
            expect(result.valid).toBe(true);
            expect(result.metadata).toHaveProperty('width');
            expect(result.metadata).toHaveProperty('height');
            expect(result.metadata).toHaveProperty('format');
            expect(result.metadata).toHaveProperty('size');
        });

        test('should reject non-existent file', async () => {
            const result = await validateImage('non-existent.jpg');
            
            expect(result.valid).toBe(false);
            expect(result.error).toContain('does not exist');
        });

        test('should reject oversized images', async () => {
            // Create a large test image
            const largeImagePath = await createTestImage('large-test.jpg', 6000, 6000);
            
            const result = await validateImage(largeImagePath);
            
            expect(result.valid).toBe(false);
            expect(result.error).toContain('too large');
        });

        test('should reject undersized images', async () => {
            // Create a small test image
            const smallImagePath = await createTestImage('small-test.jpg', 50, 50);
            
            const result = await validateImage(smallImagePath);
            
            expect(result.valid).toBe(false);
            expect(result.error).toContain('too small');
        });
    });
});