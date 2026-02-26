// tests/image-upload-endpoints.test.js
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import jwt from 'jsonwebtoken';
import marketplaceRoutes from '../routes/marketplace.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User.js';
import Listing from '../models/Listing.js';

// Create a test app with proper middleware order
const app = express();
app.use(express.json());
app.use(cookieParser());

// Add authentication middleware for testing
app.use((req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only');
            req.user = decoded.user;
        } catch (error) {
            // Token invalid, continue without user
        }
    }
    next();
});

app.use('/api/marketplace', marketplaceRoutes);

describe('Image Upload API Endpoints', () => {
    let testUser;
    let testListing;
    let authToken;
    let testImagePath;
    let mongoServer;
    const testImageDir = 'public/assets/marketplace/images';

    beforeAll(async () => {
        // Start in-memory MongoDB instance
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
        
        // Ensure test directory exists
        if (!fs.existsSync(testImageDir)) {
            fs.mkdirSync(testImageDir, { recursive: true });
        }

        // Create test user
        testUser = new User({
            first_name: 'Test',
            last_name: 'User',
            email: 'testuser@example.com',
            password: 'password123',
            phone: '1234567890',
            role: 'user'
        });
        await testUser.save();

        // Create auth token with proper structure
        authToken = jwt.sign(
            { user: { _id: testUser._id, role: testUser.role } },
            process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only',
            { expiresIn: '1h' }
        );

        // Create test listing
        testListing = new Listing({
            title: 'Test Listing for Image Upload',
            description: 'Test description',
            category: 'electronics',
            price: 100,
            condition: 'good',
            location: 'Test City',
            seller: testUser._id,
            status: 'active'
        });
        await testListing.save();

        // Create test image file
        testImagePath = path.join(testImageDir, 'test-upload.jpg');
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
    }, 30000);

    afterAll(async () => {
        // Clean up test data
        if (testUser) {
            await User.findByIdAndDelete(testUser._id);
        }
        if (testListing) {
            await Listing.findByIdAndDelete(testListing._id);
        }

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
                try {
                    fs.unlinkSync(filePath);
                } catch (error) {
                    console.warn(`Could not delete test file ${filename}:`, error.message);
                }
            }
        });

        // Close database connection
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
    }, 30000);

    describe('POST /api/marketplace/listings/:id/images', () => {
        test('should require authentication', async () => {
            const response = await request(app)
                .post(`/api/marketplace/listings/${testListing._id}/images`)
                .field('test', 'value'); // Send a simple field instead of file attachment

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. No token provided.');
        });

        test('should validate listing exists', async () => {
            const fakeListingId = '507f1f77bcf86cd799439011';
            
            const response = await request(app)
                .post(`/api/marketplace/listings/${fakeListingId}/images`)
                .set('Cookie', `token=${authToken}`)
                .attach('images', testImagePath)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Listing not found');
            expect(response.body.code).toBe('LISTING_NOT_FOUND');
        });

        test('should validate listing ownership', async () => {
            // Create another user and listing
            const otherUser = new User({
                first_name: 'Other',
                last_name: 'User',
                email: 'otheruser@example.com',
                password: 'password123',
                phone: '0987654321',
                role: 'user'
            });
            await otherUser.save();

            const otherListing = new Listing({
                title: 'Other User Listing',
                description: 'Other description',
                category: 'electronics',
                price: 200,
                condition: 'good',
                location: 'Other City',
                seller: otherUser._id,
                status: 'active'
            });
            await otherListing.save();

            const response = await request(app)
                .post(`/api/marketplace/listings/${otherListing._id}/images`)
                .set('Cookie', `token=${authToken}`)
                .attach('images', testImagePath)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. You can only upload images to your own listings.');
            expect(response.body.code).toBe('ACCESS_DENIED');

            // Clean up
            await User.findByIdAndDelete(otherUser._id);
            await Listing.findByIdAndDelete(otherListing._id);
        });

        test('should require at least one image file', async () => {
            const response = await request(app)
                .post(`/api/marketplace/listings/${testListing._id}/images`)
                .set('Cookie', `token=${authToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('No images provided for upload');
            expect(response.body.code).toBe('NO_FILES');
        });

        test('should successfully upload and process images', async () => {
            const response = await request(app)
                .post(`/api/marketplace/listings/${testListing._id}/images`)
                .set('Cookie', `token=${authToken}`)
                .attach('images', testImagePath)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('Successfully uploaded and processed');
            expect(response.body.uploadedImages).toHaveLength(1);
            expect(response.body.totalImages).toBe(1);

            const uploadedImage = response.body.uploadedImages[0];
            expect(uploadedImage).toHaveProperty('filename');
            expect(uploadedImage).toHaveProperty('originalName');
            expect(uploadedImage).toHaveProperty('sizes');
            expect(uploadedImage).toHaveProperty('urls');
            expect(uploadedImage.sizes).toHaveProperty('thumbnail');
            expect(uploadedImage.sizes).toHaveProperty('medium');
            expect(uploadedImage.sizes).toHaveProperty('full');

            // Verify listing was updated
            const updatedListing = await Listing.findById(testListing._id);
            expect(updatedListing.images).toHaveLength(1);
        });

        test('should enforce maximum image limit (8 images)', async () => {
            // First, add 6 more images to reach 7 total (1 existing + 6 mock)
            const listing = await Listing.findById(testListing._id);
            const mockImages = Array.from({ length: 6 }, (_, i) => `mock-image-${i}.jpg`);
            listing.images.push(...mockImages);
            await listing.save();

            // Try to add one more image (should succeed - total 8)
            const response1 = await request(app)
                .post(`/api/marketplace/listings/${testListing._id}/images`)
                .set('Cookie', `token=${authToken}`)
                .attach('images', testImagePath)
                .expect(201);

            expect(response1.body.success).toBe(true);
            expect(response1.body.totalImages).toBe(8); // 1 existing + 6 mock + 1 new

            // Try to add another image (should fail - would exceed limit)
            const response2 = await request(app)
                .post(`/api/marketplace/listings/${testListing._id}/images`)
                .set('Cookie', `token=${authToken}`)
                .attach('images', testImagePath)
                .expect(400);

            expect(response2.body.success).toBe(false);
            expect(response2.body.message).toContain('Maximum allowed is 8 images per listing');
            expect(response2.body.code).toBe('IMAGE_LIMIT_EXCEEDED');
        });
    });

    describe('DELETE /api/marketplace/listings/:id/images/:filename', () => {
        let imageFilename;

        beforeEach(async () => {
            // Reset listing images and add one test image
            const listing = await Listing.findById(testListing._id);
            listing.images = ['test-image.jpg'];
            await listing.save();
            imageFilename = 'test-image.jpg';
        });

        test('should require authentication', async () => {
            const response = await request(app)
                .delete(`/api/marketplace/listings/${testListing._id}/images/${imageFilename}`)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. No token provided.');
        });

        test('should validate listing exists', async () => {
            const fakeListingId = '507f1f77bcf86cd799439011';
            
            const response = await request(app)
                .delete(`/api/marketplace/listings/${fakeListingId}/images/${imageFilename}`)
                .set('Cookie', `token=${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Listing not found');
            expect(response.body.code).toBe('LISTING_NOT_FOUND');
        });

        test('should validate listing ownership', async () => {
            // Create another user and listing
            const otherUser = new User({
                first_name: 'Other',
                last_name: 'User',
                email: 'otheruser2@example.com',
                password: 'password123',
                phone: '0987654322',
                role: 'user'
            });
            await otherUser.save();

            const otherListing = new Listing({
                title: 'Other User Listing 2',
                description: 'Other description',
                category: 'electronics',
                price: 200,
                condition: 'good',
                location: 'Other City',
                seller: otherUser._id,
                status: 'active',
                images: ['other-image.jpg']
            });
            await otherListing.save();

            const response = await request(app)
                .delete(`/api/marketplace/listings/${otherListing._id}/images/other-image.jpg`)
                .set('Cookie', `token=${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. You can only delete images from your own listings.');
            expect(response.body.code).toBe('ACCESS_DENIED');

            // Clean up
            await User.findByIdAndDelete(otherUser._id);
            await Listing.findByIdAndDelete(otherListing._id);
        });

        test('should validate image exists in listing', async () => {
            const response = await request(app)
                .delete(`/api/marketplace/listings/${testListing._id}/images/nonexistent-image.jpg`)
                .set('Cookie', `token=${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Image not found in this listing');
            expect(response.body.code).toBe('IMAGE_NOT_FOUND');
        });

        test('should successfully delete image from listing', async () => {
            const response = await request(app)
                .delete(`/api/marketplace/listings/${testListing._id}/images/${imageFilename}`)
                .set('Cookie', `token=${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Image deleted successfully');
            expect(response.body.deletedImage).toBe(imageFilename);
            expect(response.body.remainingImages).toBe(0);

            // Verify listing was updated
            const updatedListing = await Listing.findById(testListing._id);
            expect(updatedListing.images).toHaveLength(0);
        });
    });

    describe('Image serving endpoint', () => {
        test('GET /api/marketplace/images/:filename should serve images with caching headers', async () => {
            // Create a test image file
            const testImageFilename = 'serve-test.jpg';
            const testImagePath = path.join(testImageDir, testImageFilename);
            
            await sharp({
                create: {
                    width: 200,
                    height: 200,
                    channels: 3,
                    background: { r: 0, g: 255, b: 0 }
                }
            })
            .jpeg()
            .toFile(testImagePath);

            const response = await request(app)
                .get(`/api/marketplace/images/${testImageFilename}`)
                .expect(200);

            // Check caching headers
            expect(response.headers['cache-control']).toContain('public');
            expect(response.headers['cache-control']).toContain('max-age');
            expect(response.headers).toHaveProperty('etag');
            expect(response.headers).toHaveProperty('last-modified');

            // Clean up
            if (fs.existsSync(testImagePath)) {
                fs.unlinkSync(testImagePath);
            }
        });

        test('GET /api/marketplace/images/:filename should return 404 for non-existent images', async () => {
            const response = await request(app)
                .get('/api/marketplace/images/nonexistent-image.jpg')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Image not found');
            expect(response.body.code).toBe('IMAGE_NOT_FOUND');
        });
    });
});