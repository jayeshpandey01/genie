import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Category from '../models/Category.js';
import marketplaceRouter from '../routes/marketplace.js';
import cookieParser from 'cookie-parser';

// Set up test environment
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';

// Mock email service to avoid sending real emails during tests
jest.mock('../services/emailService.js');

import emailService from '../services/emailService.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/marketplace', marketplaceRouter);

describe('Contact Seller Endpoint', () => {
    let mongoServer;
    let testUser;
    let sellerUser;
    let testListing;
    let testCategory;
    let userToken;
    let sellerToken;

    beforeAll(async () => {
        // Set up email service mock
        emailService.sendContactMessage = jest.fn().mockResolvedValue({
            success: true,
            messageId: 'test-message-id',
            previewUrl: 'https://ethereal.email/message/test'
        });

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
            icon: 'laptop',
            order: 1,
            isActive: true,
            listingCount: 0
        });
        await testCategory.save();

        // Create test users
        testUser = new User({
            first_name: 'John',
            last_name: 'Buyer',
            email: 'buyer@example.com',
            password: 'hashedpassword',
            phone: '1234567890',
            role: 'user'
        });
        await testUser.save();

        sellerUser = new User({
            first_name: 'Jane',
            last_name: 'Seller',
            email: 'seller@example.com',
            password: 'hashedpassword',
            phone: '0987654321',
            role: 'user'
        });
        await sellerUser.save();

        // Create test listing
        testListing = new Listing({
            title: 'Test Laptop',
            description: 'A great laptop for testing',
            category: 'electronics',
            price: 500,
            condition: 'good',
            location: 'Test City',
            seller: sellerUser._id,
            status: 'active'
        });
        await testListing.save();

        // Generate JWT tokens
        userToken = jwt.sign(
            { user: { _id: testUser._id, role: testUser.role } },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        sellerToken = jwt.sign(
            { user: { _id: sellerUser._id, role: sellerUser.role } },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
    });

    afterEach(async () => {
        // Clear all collections after each test
        await User.deleteMany({});
        await Listing.deleteMany({});
        await Category.deleteMany({});
    });

    describe('POST /api/marketplace/listings/:id/contact', () => {
        test('should successfully send contact message', async () => {
            const contactData = {
                message: 'Hi, I am interested in buying this laptop. Is it still available?',
                subject: 'Inquiry about your laptop'
            };

            const response = await request(app)
                .post(`/api/marketplace/listings/${testListing._id}/contact`)
                .set('Cookie', `token=${userToken}`)
                .send(contactData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('sent to the seller successfully');
            expect(response.body.contactInfo).toEqual({
                sellerName: 'Jane Seller',
                sellerPhone: '0987654321',
                listingTitle: 'Test Laptop'
            });

            // Verify email service was called
            expect(emailService.sendContactMessage).toHaveBeenCalledWith({
                listing: expect.objectContaining({
                    title: 'Test Laptop',
                    price: 500,
                    category: 'electronics',
                    condition: 'good',
                    location: 'Test City'
                }),
                buyer: expect.objectContaining({
                    first_name: 'John',
                    last_name: 'Buyer',
                    phone: '1234567890',
                    email: 'buyer@example.com'
                }),
                seller: expect.objectContaining({
                    first_name: 'Jane',
                    last_name: 'Seller',
                    email: 'seller@example.com'
                }),
                message: contactData.message,
                subject: contactData.subject
            });
        });

        test('should return 401 for unauthenticated user', async () => {
            const contactData = {
                message: 'Hi, I am interested in this item.'
            };

            const response = await request(app)
                .post(`/api/marketplace/listings/${testListing._id}/contact`)
                .send(contactData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Access denied');
        });

        test('should return 400 for invalid listing ID', async () => {
            const contactData = {
                message: 'Hi, I am interested in this item.'
            };

            const response = await request(app)
                .post('/api/marketplace/listings/invalid-id/contact')
                .set('Cookie', `token=${userToken}`)
                .send(contactData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('INVALID_ID');
        });

        test('should return 404 for non-existent listing', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const contactData = {
                message: 'Hi, I am interested in this item.'
            };

            const response = await request(app)
                .post(`/api/marketplace/listings/${nonExistentId}/contact`)
                .set('Cookie', `token=${userToken}`)
                .send(contactData)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('LISTING_NOT_FOUND');
        });

        test('should return 400 for missing message', async () => {
            const response = await request(app)
                .post(`/api/marketplace/listings/${testListing._id}/contact`)
                .set('Cookie', `token=${userToken}`)
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Message is required');
            expect(response.body.errors).toEqual([
                { field: 'message', message: 'Message cannot be empty' }
            ]);
        });

        test('should return 400 for empty message', async () => {
            const contactData = {
                message: '   '  // Only whitespace
            };

            const response = await request(app)
                .post(`/api/marketplace/listings/${testListing._id}/contact`)
                .set('Cookie', `token=${userToken}`)
                .send(contactData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Message is required');
        });

        test('should return 400 for message too long', async () => {
            const contactData = {
                message: 'a'.repeat(2001)  // Exceeds 2000 character limit
            };

            const response = await request(app)
                .post(`/api/marketplace/listings/${testListing._id}/contact`)
                .set('Cookie', `token=${userToken}`)
                .send(contactData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Message is too long');
            expect(response.body.errors).toEqual([
                { field: 'message', message: 'Message must be 2000 characters or less' }
            ]);
        });

        test('should return 400 for inactive listing', async () => {
            // Make listing inactive
            testListing.status = 'sold';
            await testListing.save();

            const contactData = {
                message: 'Hi, I am interested in this item.'
            };

            const response = await request(app)
                .post(`/api/marketplace/listings/${testListing._id}/contact`)
                .set('Cookie', `token=${userToken}`)
                .send(contactData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('LISTING_NOT_ACTIVE');
        });

        test('should return 400 when user tries to contact themselves', async () => {
            const contactData = {
                message: 'Hi, I am interested in this item.'
            };

            const response = await request(app)
                .post(`/api/marketplace/listings/${testListing._id}/contact`)
                .set('Cookie', `token=${sellerToken}`)  // Seller trying to contact themselves
                .send(contactData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('SELF_CONTACT_NOT_ALLOWED');
        });

        test('should handle email service errors gracefully', async () => {
            // Mock email service to throw error
            emailService.sendContactMessage.mockRejectedValueOnce(
                new Error('Failed to send contact email: SMTP connection failed')
            );

            const contactData = {
                message: 'Hi, I am interested in this item.'
            };

            const response = await request(app)
                .post(`/api/marketplace/listings/${testListing._id}/contact`)
                .set('Cookie', `token=${userToken}`)
                .send(contactData)
                .expect(503);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('EMAIL_SERVICE_ERROR');
            expect(response.body.message).toContain('Email service is currently unavailable');

            // Reset mock for other tests
            emailService.sendContactMessage.mockResolvedValue({
                success: true,
                messageId: 'test-message-id',
                previewUrl: 'https://ethereal.email/message/test'
            });
        });

        test('should trim message content', async () => {
            const contactData = {
                message: '   Hi, I am interested in this item.   ',
                subject: '   Inquiry about laptop   '
            };

            await request(app)
                .post(`/api/marketplace/listings/${testListing._id}/contact`)
                .set('Cookie', `token=${userToken}`)
                .send(contactData)
                .expect(200);

            // Verify email service was called with trimmed content
            expect(emailService.sendContactMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Hi, I am interested in this item.',
                    subject: 'Inquiry about laptop'
                })
            );
        });

        test('should include email preview URL in development', async () => {
            // Set NODE_ENV to development
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            const contactData = {
                message: 'Hi, I am interested in this item.'
            };

            const response = await request(app)
                .post(`/api/marketplace/listings/${testListing._id}/contact`)
                .set('Cookie', `token=${userToken}`)
                .send(contactData)
                .expect(200);

            expect(response.body.emailPreview).toBe('https://ethereal.email/message/test');

            // Restore original NODE_ENV
            process.env.NODE_ENV = originalEnv;
        });

        test('should not include email preview URL in production', async () => {
            // Set NODE_ENV to production
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const contactData = {
                message: 'Hi, I am interested in this item.'
            };

            const response = await request(app)
                .post(`/api/marketplace/listings/${testListing._id}/contact`)
                .set('Cookie', `token=${userToken}`)
                .send(contactData)
                .expect(200);

            expect(response.body.emailPreview).toBeUndefined();

            // Restore original NODE_ENV
            process.env.NODE_ENV = originalEnv;
        });
    });
});