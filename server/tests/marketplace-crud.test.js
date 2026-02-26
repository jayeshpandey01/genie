import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

import marketplaceRoutes from '../routes/marketplace.js';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Category from '../models/Category.js';

// Set up test environment
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';

// Create a test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/marketplace', marketplaceRoutes);

let mongoServer;
let testUser;
let adminUser;
let testCategory;
let authToken;
let adminToken;

beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri);
    
    // Create test users
    testUser = new User({
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone: '1234567890',
        password: 'hashedpassword',
        role: 'user'
    });
    await testUser.save();
    
    adminUser = new User({
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@example.com',
        phone: '0987654321',
        password: 'hashedpassword',
        role: 'admin'
    });
    await adminUser.save();
    
    // Create test category
    testCategory = new Category({
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and gadgets',
        icon: 'electronics-icon',
        order: 1,
        isActive: true
    });
    await testCategory.save();
    
    // Generate auth tokens
    authToken = jwt.sign({ user: { _id: testUser._id } }, process.env.JWT_SECRET);
    adminToken = jwt.sign({ user: { _id: adminUser._id } }, process.env.JWT_SECRET);
});

afterAll(async () => {
    try {
        // Clean up test data
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.dropDatabase();
            await mongoose.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
    } catch (error) {
        console.warn('Cleanup error:', error.message);
    }
}, 30000);

beforeEach(async () => {
    // Clear listings before each test
    await Listing.deleteMany({});
    // Reset category listing count
    testCategory.listingCount = 0;
    await testCategory.save();
});

describe('Marketplace CRUD Operations', () => {
    describe('GET /api/marketplace/listings', () => {
        test('should return empty listings array when no listings exist', async () => {
            const response = await request(app)
                .get('/api/marketplace/listings')
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.listings).toEqual([]);
            expect(response.body.pagination.totalItems).toBe(0);
        });
        
        test('should return active listings with pagination', async () => {
            // Create test listings
            const listing1 = new Listing({
                title: 'Test Laptop',
                description: 'A great laptop for testing',
                category: 'electronics',
                price: 500,
                condition: 'good',
                location: 'Test City',
                seller: testUser._id,
                status: 'active'
            });
            await listing1.save();
            
            const listing2 = new Listing({
                title: 'Test Phone',
                description: 'A smartphone for testing',
                category: 'electronics',
                price: 300,
                condition: 'like-new',
                location: 'Test City',
                seller: testUser._id,
                status: 'active'
            });
            await listing2.save();
            
            const response = await request(app)
                .get('/api/marketplace/listings')
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.listings).toHaveLength(2);
            expect(response.body.pagination.totalItems).toBe(2);
            expect(response.body.listings[0].seller.first_name).toBe('Test');
        });
        
        test('should filter listings by category', async () => {
            // Create listings in different categories
            const electronicsListing = new Listing({
                title: 'Test Laptop',
                description: 'A laptop',
                category: 'electronics',
                price: 500,
                condition: 'good',
                location: 'Test City',
                seller: testUser._id,
                status: 'active'
            });
            await electronicsListing.save();
            
            const furnitureListing = new Listing({
                title: 'Test Chair',
                description: 'A chair',
                category: 'furniture',
                price: 100,
                condition: 'good',
                location: 'Test City',
                seller: testUser._id,
                status: 'active'
            });
            await furnitureListing.save();
            
            const response = await request(app)
                .get('/api/marketplace/listings?category=electronics')
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.listings).toHaveLength(1);
            expect(response.body.listings[0].category).toBe('electronics');
        });
        
        test('should filter listings by price range', async () => {
            const cheapListing = new Listing({
                title: 'Cheap Item',
                description: 'An affordable item',
                category: 'electronics',
                price: 50,
                condition: 'good',
                location: 'Test City',
                seller: testUser._id,
                status: 'active'
            });
            await cheapListing.save();
            
            const expensiveListing = new Listing({
                title: 'Expensive Item',
                description: 'A premium item',
                category: 'electronics',
                price: 1000,
                condition: 'new',
                location: 'Test City',
                seller: testUser._id,
                status: 'active'
            });
            await expensiveListing.save();
            
            const response = await request(app)
                .get('/api/marketplace/listings?priceMin=100&priceMax=500')
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.listings).toHaveLength(0);
            
            const response2 = await request(app)
                .get('/api/marketplace/listings?priceMin=40&priceMax=100')
                .expect(200);
            
            expect(response2.body.success).toBe(true);
            expect(response2.body.listings).toHaveLength(1);
            expect(response2.body.listings[0].price).toBe(50);
        });
    });
    
    describe('GET /api/marketplace/listings/:id', () => {
        test('should return single listing by ID', async () => {
            const listing = new Listing({
                title: 'Test Laptop',
                description: 'A great laptop',
                category: 'electronics',
                price: 500,
                condition: 'good',
                location: 'Test City',
                seller: testUser._id,
                status: 'active'
            });
            await listing.save();
            
            const response = await request(app)
                .get(`/api/marketplace/listings/${listing._id}`)
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.listing.title).toBe('Test Laptop');
            expect(response.body.listing.seller.first_name).toBe('Test');
        });
        
        test('should return 404 for non-existent listing', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            
            const response = await request(app)
                .get(`/api/marketplace/listings/${fakeId}`)
                .expect(404);
            
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('LISTING_NOT_FOUND');
        });
        
        test('should return 400 for invalid ID format', async () => {
            const response = await request(app)
                .get('/api/marketplace/listings/invalid-id')
                .expect(400);
            
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('INVALID_ID');
        });
    });
    
    describe('GET /api/marketplace/categories', () => {
        test('should return active categories', async () => {
            const response = await request(app)
                .get('/api/marketplace/categories')
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.categories).toHaveLength(1);
            expect(response.body.categories[0].name).toBe('Electronics');
        });
    });
    
    describe('POST /api/marketplace/listings', () => {
        test('should create new listing for authenticated user', async () => {
            const listingData = {
                title: 'New Laptop',
                description: 'A brand new laptop for sale',
                category: 'electronics',
                price: 800,
                condition: 'new',
                location: 'New York'
            };
            
            const response = await request(app)
                .post('/api/marketplace/listings')
                .set('Cookie', [`token=${authToken}`])
                .send(listingData)
                .expect(201);
            
            expect(response.body.success).toBe(true);
            expect(response.body.listing.title).toBe('New Laptop');
            expect(response.body.listing.seller._id).toBe(testUser._id.toString());
            expect(response.body.listing.status).toBe('active');
        });
        
        test('should return 401 for unauthenticated user', async () => {
            const listingData = {
                title: 'New Laptop',
                description: 'A brand new laptop for sale',
                category: 'electronics',
                price: 800,
                condition: 'new',
                location: 'New York'
            };
            
            const response = await request(app)
                .post('/api/marketplace/listings')
                .send(listingData)
                .expect(401);
            
            expect(response.body.success).toBe(false);
        });
        
        test('should return 400 for missing required fields', async () => {
            const incompleteData = {
                title: 'New Laptop',
                // missing description, category, price, condition, location
            };
            
            const response = await request(app)
                .post('/api/marketplace/listings')
                .set('Cookie', [`token=${authToken}`])
                .send(incompleteData)
                .expect(400);
            
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });
        
        test('should return 400 for invalid category', async () => {
            const listingData = {
                title: 'New Laptop',
                description: 'A brand new laptop for sale',
                category: 'invalid-category',
                price: 800,
                condition: 'new',
                location: 'New York'
            };
            
            const response = await request(app)
                .post('/api/marketplace/listings')
                .set('Cookie', [`token=${authToken}`])
                .send(listingData)
                .expect(400);
            
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid category');
        });
    });
    
    describe('PUT /api/marketplace/listings/:id', () => {
        let testListing;
        
        beforeEach(async () => {
            testListing = new Listing({
                title: 'Original Title',
                description: 'Original description',
                category: 'electronics',
                price: 500,
                condition: 'good',
                location: 'Original City',
                seller: testUser._id,
                status: 'active'
            });
            await testListing.save();
        });
        
        test('should update listing for owner', async () => {
            const updateData = {
                title: 'Updated Title',
                price: 600
            };
            
            const response = await request(app)
                .put(`/api/marketplace/listings/${testListing._id}`)
                .set('Cookie', [`token=${authToken}`])
                .send(updateData)
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.listing.title).toBe('Updated Title');
            expect(response.body.listing.price).toBe(600);
            expect(response.body.listing.updatedAt).not.toBe(testListing.updatedAt);
        });
        
        test('should update listing for admin', async () => {
            const updateData = {
                title: 'Admin Updated Title'
            };
            
            const response = await request(app)
                .put(`/api/marketplace/listings/${testListing._id}`)
                .set('Cookie', [`token=${adminToken}`])
                .send(updateData)
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.listing.title).toBe('Admin Updated Title');
        });
        
        test('should return 403 for non-owner', async () => {
            // Create another user with unique email and phone
            const timestamp = Date.now();
            const otherUser = new User({
                first_name: 'Other',
                last_name: 'User',
                email: `other-update-${timestamp}@example.com`,
                phone: `555${timestamp.toString().slice(-7)}`,
                password: 'hashedpassword',
                role: 'user'
            });
            await otherUser.save();
            
            const otherToken = jwt.sign({ user: { _id: otherUser._id } }, process.env.JWT_SECRET);
            
            const updateData = {
                title: 'Unauthorized Update'
            };
            
            const response = await request(app)
                .put(`/api/marketplace/listings/${testListing._id}`)
                .set('Cookie', [`token=${otherToken}`])
                .send(updateData)
                .expect(403);
            
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('ACCESS_DENIED');
        });
        
        test('should return 404 for non-existent listing', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            
            const response = await request(app)
                .put(`/api/marketplace/listings/${fakeId}`)
                .set('Cookie', [`token=${authToken}`])
                .send({ title: 'Updated' })
                .expect(404);
            
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('LISTING_NOT_FOUND');
        });
    });
    
    describe('DELETE /api/marketplace/listings/:id', () => {
        let testListing;
        
        beforeEach(async () => {
            testListing = new Listing({
                title: 'To Be Deleted',
                description: 'This listing will be deleted',
                category: 'electronics',
                price: 500,
                condition: 'good',
                location: 'Test City',
                seller: testUser._id,
                status: 'active'
            });
            await testListing.save();
            
            // Update category count
            testCategory.listingCount = 1;
            await testCategory.save();
        });
        
        test('should soft delete listing for owner', async () => {
            const response = await request(app)
                .delete(`/api/marketplace/listings/${testListing._id}`)
                .set('Cookie', [`token=${authToken}`])
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Listing deleted successfully');
            
            // Verify listing is soft deleted
            const deletedListing = await Listing.findById(testListing._id);
            expect(deletedListing.status).toBe('inactive');
            
            // Verify category count is decremented
            const updatedCategory = await Category.findById(testCategory._id);
            expect(updatedCategory.listingCount).toBe(0);
        });
        
        test('should soft delete listing for admin', async () => {
            const response = await request(app)
                .delete(`/api/marketplace/listings/${testListing._id}`)
                .set('Cookie', [`token=${adminToken}`])
                .expect(200);
            
            expect(response.body.success).toBe(true);
        });
        
        test('should return 403 for non-owner', async () => {
            // Create another user with unique email and phone
            const timestamp = Date.now();
            const otherUser = new User({
                first_name: 'Other',
                last_name: 'User',
                email: `other-delete-${timestamp}@example.com`,
                phone: `666${timestamp.toString().slice(-7)}`,
                password: 'hashedpassword',
                role: 'user'
            });
            await otherUser.save();
            
            const otherToken = jwt.sign({ user: { _id: otherUser._id } }, process.env.JWT_SECRET);
            
            const response = await request(app)
                .delete(`/api/marketplace/listings/${testListing._id}`)
                .set('Cookie', [`token=${otherToken}`])
                .expect(403);
            
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('ACCESS_DENIED');
        });
    });
    
    describe('GET /api/marketplace/my-listings', () => {
        beforeEach(async () => {
            // Create test listings for the user
            const listing1 = new Listing({
                title: 'My Laptop',
                description: 'My personal laptop',
                category: 'electronics',
                price: 500,
                condition: 'good',
                location: 'Test City',
                seller: testUser._id,
                status: 'active'
            });
            await listing1.save();
            
            const listing2 = new Listing({
                title: 'My Phone',
                description: 'My old phone',
                category: 'electronics',
                price: 200,
                condition: 'fair',
                location: 'Test City',
                seller: testUser._id,
                status: 'sold'
            });
            await listing2.save();
        });
        
        test('should return user\'s listings', async () => {
            const response = await request(app)
                .get('/api/marketplace/my-listings')
                .set('Cookie', [`token=${authToken}`])
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.listings).toHaveLength(2);
            expect(response.body.statusSummary.active).toBe(1);
            expect(response.body.statusSummary.sold).toBe(1);
        });
        
        test('should filter user\'s listings by status', async () => {
            const response = await request(app)
                .get('/api/marketplace/my-listings?status=active')
                .set('Cookie', [`token=${authToken}`])
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.listings).toHaveLength(1);
            expect(response.body.listings[0].status).toBe('active');
        });
        
        test('should return 401 for unauthenticated user', async () => {
            const response = await request(app)
                .get('/api/marketplace/my-listings')
                .expect(401);
            
            expect(response.body.success).toBe(false);
        });
    });
});