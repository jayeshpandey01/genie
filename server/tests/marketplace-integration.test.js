import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// Set up test environment
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';

// Mock email service to avoid sending real emails during tests
jest.mock('../services/emailService.js', () => ({
    default: {
        sendContactMessage: jest.fn().mockResolvedValue({
            success: true,
            messageId: 'test-message-id',
            previewUrl: 'https://ethereal.email/message/test'
        }),
        sendModerationNotification: jest.fn().mockResolvedValue({
            success: true,
            messageId: 'test-moderation-id'
        })
    }
}));

// Import models
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Category from '../models/Category.js';

// Import routes
import marketplaceRoutes from '../routes/marketplace.js';

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/marketplace', marketplaceRoutes);

describe('Marketplace Integration Tests', () => {
    let mongoServer;
    let testUser;
    let adminUser;
    let testListing;
    let testCategory;
    let userToken;
    let adminToken;

    beforeAll(async () => {
        // Set up email service mock
        const emailService = (await import('../services/emailService.js')).default;
        emailService.sendContactMessage = jest.fn().mockResolvedValue({
            success: true,
            messageId: 'test-message-id',
            previewUrl: 'https://ethereal.email/message/test'
        });
        emailService.sendModerationNotification = jest.fn().mockResolvedValue({
            success: true,
            messageId: 'test-moderation-id'
        });

        // Start in-memory MongoDB
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Clear all collections
        await User.deleteMany({});
        await Listing.deleteMany({});
        await Category.deleteMany({});

        // Create test category
        testCategory = new Category({
            name: 'Electronics',
            slug: 'electronics',
            description: 'Electronic devices and gadgets',
            icon: '📱',
            order: 1,
            isActive: true,
            listingCount: 0
        });
        await testCategory.save();

        // Create test user
        testUser = new User({
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone: '1234567890',
            password: 'password123',
            role: 'user'
        });
        await testUser.save();

        // Create admin user
        adminUser = new User({
            first_name: 'Admin',
            last_name: 'User',
            email: 'admin@example.com',
            phone: '0987654321',
            password: 'admin123',
            role: 'admin'
        });
        await adminUser.save();

        // Create test listing
        testListing = new Listing({
            title: 'Test Laptop',
            description: 'A great laptop for testing',
            category: 'electronics',
            price: 50000,
            condition: 'good',
            location: 'Mumbai, Maharashtra',
            seller: testUser._id,
            status: 'active',
            images: []
        });
        await testListing.save();

        // Generate JWT tokens
        userToken = jwt.sign(
            { user: { _id: testUser._id, role: testUser.role } },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        adminToken = jwt.sign(
            { user: { _id: adminUser._id, role: adminUser.role } },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    describe('Complete User Workflows', () => {
        test('Browse → View → Contact → Create Listing workflow', async () => {
            // 1. Browse listings (unauthenticated)
            const browseResponse = await request(app)
                .get('/api/marketplace/listings')
                .expect(200);

            expect(browseResponse.body.success).toBe(true);
            expect(browseResponse.body.listings).toHaveLength(1);
            expect(browseResponse.body.listings[0].title).toBe('Test Laptop');

            // 2. View specific listing (unauthenticated)
            const viewResponse = await request(app)
                .get(`/api/marketplace/listings/${testListing._id}`)
                .expect(200);

            expect(viewResponse.body.success).toBe(true);
            expect(viewResponse.body.listing.title).toBe('Test Laptop');
            expect(viewResponse.body.listing.seller.first_name).toBe('John');

            // 3. Try to contact seller without authentication (should fail)
            const contactUnauthResponse = await request(app)
                .post(`/api/marketplace/listings/${testListing._id}/contact`)
                .send({
                    message: 'Hi, I am interested in this laptop.'
                })
                .expect(401);

            expect(contactUnauthResponse.body.success).toBe(false);

            // 4. Create another user to contact seller
            const buyer = new User({
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'jane@example.com',
                phone: '5555555555',
                password: 'password123',
                role: 'user'
            });
            await buyer.save();

            const buyerToken = jwt.sign(
                { user: { _id: buyer._id, role: buyer.role } },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // 5. Contact seller (authenticated)
            const contactResponse = await request(app)
                .post(`/api/marketplace/listings/${testListing._id}/contact`)
                .set('Cookie', `token=${buyerToken}`)
                .send({
                    message: 'Hi, I am interested in this laptop.'
                })
                .expect(200);

            expect(contactResponse.body.success).toBe(true);
            expect(contactResponse.body.message).toContain('sent to the seller successfully');

            // 6. Create new listing (authenticated)
            const createResponse = await request(app)
                .post('/api/marketplace/listings')
                .set('Cookie', `token=${buyerToken}`)
                .send({
                    title: 'Gaming Mouse',
                    description: 'High-performance gaming mouse',
                    category: 'electronics',
                    price: 2500,
                    condition: 'new',
                    location: 'Delhi, India'
                })
                .expect(201);

            expect(createResponse.body.success).toBe(true);
            expect(createResponse.body.listing.title).toBe('Gaming Mouse');
            expect(createResponse.body.listing.seller._id).toBe(buyer._id.toString());
        });

        test('Admin moderation workflow', async () => {
            // 1. Admin views all listings
            const adminListingsResponse = await request(app)
                .get('/api/marketplace/admin/listings')
                .set('Cookie', `token=${adminToken}`)
                .expect(200);

            expect(adminListingsResponse.body.success).toBe(true);
            expect(adminListingsResponse.body.listings).toHaveLength(1);

            // 2. Admin flags a listing
            const flagResponse = await request(app)
                .put(`/api/marketplace/admin/listings/${testListing._id}/flag`)
                .set('Cookie', `token=${adminToken}`)
                .send({
                    reason: 'Inappropriate content'
                })
                .expect(200);

            expect(flagResponse.body.success).toBe(true);
            expect(flagResponse.body.message).toContain('flagged successfully');

            // 3. Verify listing is flagged
            const flaggedListing = await Listing.findById(testListing._id);
            expect(flaggedListing.status).toBe('flagged');

            // 4. Admin gets statistics
            const statsResponse = await request(app)
                .get('/api/marketplace/admin/stats')
                .set('Cookie', `token=${adminToken}`)
                .expect(200);

            expect(statsResponse.body.success).toBe(true);
            expect(statsResponse.body.stats.overview.totalListings).toBe(1);
            expect(statsResponse.body.stats.overview.flaggedListings).toBe(1);

            // 5. Regular user cannot access admin endpoints
            const userAdminResponse = await request(app)
                .get('/api/marketplace/admin/listings')
                .set('Cookie', `token=${userToken}`)
                .expect(403);

            expect(userAdminResponse.body.success).toBe(false);
            expect(userAdminResponse.body.message).toContain('Admin privileges required');
        });
    });

    describe('Search and Filter Performance', () => {
        beforeEach(async () => {
            // Create multiple test listings for search/filter testing
            const listings = [];
            for (let i = 0; i < 20; i++) {
                listings.push({
                    title: `Test Item ${i}`,
                    description: `Description for item ${i}`,
                    category: i % 2 === 0 ? 'electronics' : 'furniture',
                    price: 1000 + (i * 500),
                    condition: ['new', 'good', 'fair'][i % 3],
                    location: i % 2 === 0 ? 'Mumbai' : 'Delhi',
                    seller: testUser._id,
                    status: 'active'
                });
            }
            await Listing.insertMany(listings);
        });

        test('Search functionality with large dataset', async () => {
            const searchResponse = await request(app)
                .get('/api/marketplace/listings?search=Test&limit=10')
                .expect(200);

            expect(searchResponse.body.success).toBe(true);
            expect(searchResponse.body.listings.length).toBeLessThanOrEqual(10);
            expect(searchResponse.body.pagination.totalItems).toBeGreaterThan(10);
        });

        test('Filter by category and price range', async () => {
            const filterResponse = await request(app)
                .get('/api/marketplace/listings?category=electronics&priceMin=2000&priceMax=5000')
                .expect(200);

            expect(filterResponse.body.success).toBe(true);
            filterResponse.body.listings.forEach(listing => {
                expect(listing.category).toBe('electronics');
                expect(listing.price).toBeGreaterThanOrEqual(2000);
                expect(listing.price).toBeLessThanOrEqual(5000);
            });
        });

        test('Pagination with different page sizes', async () => {
            const page1Response = await request(app)
                .get('/api/marketplace/listings?page=1&limit=5')
                .expect(200);

            expect(page1Response.body.listings).toHaveLength(5);
            expect(page1Response.body.pagination.currentPage).toBe(1);
            expect(page1Response.body.pagination.hasNext).toBe(true);

            const page2Response = await request(app)
                .get('/api/marketplace/listings?page=2&limit=5')
                .expect(200);

            expect(page2Response.body.listings).toHaveLength(5);
            expect(page2Response.body.pagination.currentPage).toBe(2);
        });
    });

    describe('Error Handling', () => {
        test('Invalid listing ID format', async () => {
            const response = await request(app)
                .get('/api/marketplace/listings/invalid-id')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid listing ID format');
            expect(response.body.code).toBe('INVALID_ID');
        });

        test('Non-existent listing', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/marketplace/listings/${fakeId}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Listing not found');
            expect(response.body.code).toBe('LISTING_NOT_FOUND');
        });

        test('Unauthorized listing modification', async () => {
            // Create another user
            const otherUser = new User({
                first_name: 'Other',
                last_name: 'User',
                email: 'other@example.com',
                phone: '9999999999',
                password: 'password123',
                role: 'user'
            });
            await otherUser.save();

            const otherToken = jwt.sign(
                { user: { _id: otherUser._id, role: otherUser.role } },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Try to edit someone else's listing
            const response = await request(app)
                .put(`/api/marketplace/listings/${testListing._id}`)
                .set('Cookie', `token=${otherToken}`)
                .send({
                    title: 'Modified Title'
                })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Access denied');
        });

        test('Missing required fields in listing creation', async () => {
            const response = await request(app)
                .post('/api/marketplace/listings')
                .set('Cookie', `token=${userToken}`)
                .send({
                    title: 'Incomplete Listing'
                    // Missing required fields
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Missing required fields');
            expect(response.body.errors).toBeDefined();
        });
    });

    describe('Authentication Integration', () => {
        test('JWT token validation', async () => {
            // Valid token
            const validResponse = await request(app)
                .get('/api/marketplace/my-listings')
                .set('Cookie', `token=${userToken}`)
                .expect(200);

            expect(validResponse.body.success).toBe(true);

            // Invalid token
            const invalidResponse = await request(app)
                .get('/api/marketplace/my-listings')
                .set('Cookie', 'token=invalid-token')
                .expect(401);

            expect(invalidResponse.body.success).toBe(false);

            // No token
            const noTokenResponse = await request(app)
                .get('/api/marketplace/my-listings')
                .expect(401);

            expect(noTokenResponse.body.success).toBe(false);
        });

        test('Role-based access control', async () => {
            // User cannot access admin endpoints
            const userAdminResponse = await request(app)
                .get('/api/marketplace/admin/listings')
                .set('Cookie', `token=${userToken}`)
                .expect(403);

            expect(userAdminResponse.body.success).toBe(false);

            // Admin can access admin endpoints
            const adminResponse = await request(app)
                .get('/api/marketplace/admin/listings')
                .set('Cookie', `token=${adminToken}`)
                .expect(200);

            expect(adminResponse.body.success).toBe(true);
        });
    });

    describe('Data Consistency', () => {
        test('Category listing count updates', async () => {
            // Initial count should be 1 (from beforeEach)
            let category = await Category.findOne({ slug: 'electronics' });
            expect(category.listingCount).toBe(0); // Will be updated when listing is created

            // Create a new listing
            await request(app)
                .post('/api/marketplace/listings')
                .set('Cookie', `token=${userToken}`)
                .send({
                    title: 'New Electronics Item',
                    description: 'Another electronic device',
                    category: 'electronics',
                    price: 3000,
                    condition: 'new',
                    location: 'Bangalore, India'
                })
                .expect(201);

            // Check if category count was updated
            category = await Category.findOne({ slug: 'electronics' });
            expect(category.listingCount).toBe(1);
        });

        test('User marketplace profile updates', async () => {
            // Create a listing to increment user's listing count
            await request(app)
                .post('/api/marketplace/listings')
                .set('Cookie', `token=${userToken}`)
                .send({
                    title: 'User Profile Test Item',
                    description: 'Testing user profile updates',
                    category: 'electronics',
                    price: 1500,
                    condition: 'good',
                    location: 'Chennai, India'
                })
                .expect(201);

            // Check if user's marketplace profile was updated
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.marketplaceProfile.totalListings).toBe(1);
        });
    });
});