// tests/image-upload-integration.test.js
import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { processUploadedImages } from '../middleware/upload.js';
import { getImageUrls } from '../services/imageProcessingService.js';

describe('Image Upload Integration', () => {
    const testImageDir = 'public/assets/marketplace/images';
    
    beforeAll(async () => {
        // Ensure test directory exists
        if (!fs.existsSync(testImageDir)) {
            fs.mkdirSync(testImageDir, { recursive: true });
        }
    });
    
    afterAll(() => {
        // Clean up test files
        const testFiles = [
            'test-upload.jpg',
            'test-upload-thumbnail.jpg',
            'test-upload-medium.jpg',
            'test-upload-full.jpg'
        ];
        
        testFiles.forEach(filename => {
            const filePath = path.join(testImageDir, filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });
    });

    describe('processUploadedImages middleware function', () => {
        test('should process uploaded files and create multiple sizes', async () => {
            // Create a test image file
            const testImagePath = path.join(testImageDir, 'test-upload.jpg');
            await sharp({
                create: {
                    width: 800,
                    height: 600,
                    channels: 3,
                    background: { r: 255, g: 0, b: 0 }
                }
            })
            .jpeg()
            .toFile(testImagePath);

            // Mock file object like multer would create
            const mockFiles = [{
                filename: 'test-upload.jpg',
                originalname: 'original-test.jpg',
                path: testImagePath,
                size: fs.statSync(testImagePath).size
            }];

            const result = await processUploadedImages(mockFiles);

            expect(result.processedResults).toHaveLength(1);
            expect(result.errors).toHaveLength(0);

            const processedResult = result.processedResults[0];
            expect(processedResult.success).toBe(true);
            expect(processedResult.processedImages).toHaveProperty('thumbnail');
            expect(processedResult.processedImages).toHaveProperty('medium');
            expect(processedResult.processedImages).toHaveProperty('full');

            // Verify files were created
            expect(fs.existsSync(processedResult.processedImages.thumbnail.path)).toBe(true);
            expect(fs.existsSync(processedResult.processedImages.medium.path)).toBe(true);
            expect(fs.existsSync(processedResult.processedImages.full.path)).toBe(true);
        });

        test('should handle processing errors gracefully', async () => {
            // Create an invalid image file
            const invalidImagePath = path.join(testImageDir, 'invalid-upload.jpg');
            fs.writeFileSync(invalidImagePath, 'This is not an image');

            const mockFiles = [{
                filename: 'invalid-upload.jpg',
                originalname: 'invalid.jpg',
                path: invalidImagePath,
                size: fs.statSync(invalidImagePath).size
            }];

            const result = await processUploadedImages(mockFiles);

            expect(result.processedResults).toHaveLength(0);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].filename).toBe('invalid-upload.jpg');

            // Verify the invalid file was cleaned up
            expect(fs.existsSync(invalidImagePath)).toBe(false);
        });
    });

    describe('getImageUrls function', () => {
        test('should return correct URL structure for all image sizes', () => {
            const filename = 'test-image.jpg';
            const urls = getImageUrls(filename);

            expect(urls).toEqual({
                thumbnail: '/assets/marketplace/images/test-image-thumbnail.jpg',
                medium: '/assets/marketplace/images/test-image-medium.jpg',
                full: '/assets/marketplace/images/test-image-full.jpg'
            });
        });

        test('should handle different file extensions', () => {
            const pngFilename = 'test-image.png';
            const webpFilename = 'test-image.webp';

            const pngUrls = getImageUrls(pngFilename);
            const webpUrls = getImageUrls(webpFilename);

            expect(pngUrls.thumbnail).toBe('/assets/marketplace/images/test-image-thumbnail.png');
            expect(webpUrls.thumbnail).toBe('/assets/marketplace/images/test-image-thumbnail.webp');
        });
    });

    describe('Image size configurations', () => {
        test('should create images with correct maximum dimensions', async () => {
            // Create a large test image
            const testImagePath = path.join(testImageDir, 'large-test.jpg');
            await sharp({
                create: {
                    width: 2000,
                    height: 1500,
                    channels: 3,
                    background: { r: 0, g: 255, b: 0 }
                }
            })
            .jpeg()
            .toFile(testImagePath);

            const mockFiles = [{
                filename: 'large-test.jpg',
                originalname: 'large-original.jpg',
                path: testImagePath,
                size: fs.statSync(testImagePath).size
            }];

            const result = await processUploadedImages(mockFiles);
            const processedImages = result.processedResults[0].processedImages;

            // Check thumbnail dimensions
            expect(processedImages.thumbnail.width).toBeLessThanOrEqual(200);
            expect(processedImages.thumbnail.height).toBeLessThanOrEqual(200);

            // Check medium dimensions
            expect(processedImages.medium.width).toBeLessThanOrEqual(600);
            expect(processedImages.medium.height).toBeLessThanOrEqual(600);

            // Check full dimensions
            expect(processedImages.full.width).toBeLessThanOrEqual(1200);
            expect(processedImages.full.height).toBeLessThanOrEqual(1200);

            // Clean up
            ['large-test.jpg', 'large-test-thumbnail.jpg', 'large-test-medium.jpg', 'large-test-full.jpg'].forEach(filename => {
                const filePath = path.join(testImageDir, filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        });
    });

    describe('Image optimization', () => {
        test('should compress images while maintaining quality', async () => {
            // Create a test image
            const testImagePath = path.join(testImageDir, 'compression-test.jpg');
            await sharp({
                create: {
                    width: 1000,
                    height: 800,
                    channels: 3,
                    background: { r: 128, g: 128, b: 128 }
                }
            })
            .jpeg({ quality: 100 }) // Start with high quality
            .toFile(testImagePath);

            const originalSize = fs.statSync(testImagePath).size;

            const mockFiles = [{
                filename: 'compression-test.jpg',
                originalname: 'compression-original.jpg',
                path: testImagePath,
                size: originalSize
            }];

            const result = await processUploadedImages(mockFiles);
            const processedImages = result.processedResults[0].processedImages;

            // All processed images should be smaller than original due to optimization
            expect(processedImages.thumbnail.size).toBeLessThan(originalSize);
            expect(processedImages.medium.size).toBeLessThan(originalSize);
            expect(processedImages.full.size).toBeLessThan(originalSize);

            // Clean up
            ['compression-test-thumbnail.jpg', 'compression-test-medium.jpg', 'compression-test-full.jpg'].forEach(filename => {
                const filePath = path.join(testImageDir, filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        });
    });
});