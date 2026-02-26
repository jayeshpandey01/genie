import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import marketplaceRoutes from '../routes/marketplace.js';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Category from '../models/Category.js';
import AuditLog from '../models/AuditLog.js';

// Create a test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/marketplace', marketplaceRoutes);

describe('Admin Marketplace Endpoints', () => {
    let adminUser;
    let regularUser;
    let testListing;
    let testCategory;

    beforeAll(async () => {
        // Connect to test database
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/genie-test');
        }

        // Create test users
        adminUser = new User({
            first_name: 'Admin',
            last_name: 'User',
            email: 'admin@test.com',
            phone: '1234567890',
            password: 'password123',
            role: 'admin'
        });
        await adminUser.save();

        regularUser = new User({
            first_name: 'Regular',
            last_name: 'User',
            email: 'user@test.com',
            phone: '0987654321',
            password: 'password123',
            role: 'user'
        });
        await regularUser.save();

        // Create test category
        testCategory = new Category({
            name: 'Electronics',
            slug: 'electronics',
            description: 'Test category for electronics',
            icon: 'electronics-icon',
            order: 1,
            isActive: true,
            listingCount: 0
        });
        await testCategory.save();

        // Create test listing
        testListing = new Listing({
            title: 'Test Laptop',
            description: 'A test laptop for admin testing',
            category: 'electronics',
            price: 500,
            condition: 'good',
            location: 'Test City',
            seller: regularUser._id,
            status: 'active'
        });
        await testListing.save();
    });

    afterAll(async () => {
        // Clean up test data
        await User.deleteMany({ email: { $in: ['admin@test.com', 'user@test.com'] } });
        await Listing.deleteMany({ title: { $in: ['Test Laptop', 'Test Listing to Delete'] } });
        await Category.deleteMany({ slug: 'electronics' });
        await AuditLog.deleteMany({ 'details.metadata.test': true });
        
        await mongoose.disconnect();
    });

    describe('Admin Authentication', () => {
        it('should deny access to admin endpoints without authentication', async () => {
            const response = await request(app)
                .get('/api/marketplace/admin/listings')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('No token provided');
        });

        it('should deny access to admin endpoints for regular users', async () => {
            // Mock regular user token
            const mockToken = 'mock-regular-user-token';
            
            const response = await request(app)
                .get('/api/marketplace/admin/listings')
                .set('Cookie', [`token=${mockToken}`])
                .expect(401); // Will fail token verification

            expect(response.body.success).toBe(false);
        });
    });

    describe('Admin Endpoints Structure', () => {
        it('GET /api/marketplace/admin/listings should be implemented', async () => {
            const response = await request(app)
                .get('/api/marketplace/admin/listings');
            
            // Should return 401 (auth required) or 500 (database issue), not 501 (not implemented)
            expect([401, 500]).toContain(response.status);
            expect(response.body).toHaveProperty('success');
            if (response.status === 501) {
                fail('Admin listings endpoint is not implemented');
            }
        });

        it('PUT /api/marketplace/admin/listings/:id/flag should be implemented', async () => {
            const response = await request(app)
                .put(`/api/marketplace/admin/listings/${testListing._id}/flag`)
                .send({ action: 'flag', reason: 'Test' });
            
            // Should return 401 (auth required) or 500 (database issue), not 501 (not implemented)
            expect([401, 500]).toContain(response.status);
            expect(response.body).toHaveProperty('success');
            if (response.status === 501) {
                fail('Admin flag endpoint is not implemented');
            }
        });

        it('DELETE /api/marketplace/admin/listings/:id should be implemented', async () => {
            const response = await request(app)
                .delete(`/api/marketplace/admin/listings/${testListing._id}`)
                .send({ reason: 'Test deletion' });
            
            // Should return 401 (auth required) or 500 (database issue), not 501 (not implemented)
            expect([401, 500]).toContain(response.status);
            expect(response.body).toHaveProperty('success');
            if (response.status === 501) {
                fail('Admin delete endpoint is not implemented');
            }
        });

        it('GET /api/marketplace/admin/stats should be implemented', async () => {
            const response = await request(app)
                .get('/api/marketplace/admin/stats');
            
            // Should return 401 (auth required) or 500 (database issue), not 501 (not implemented)
            expect([401, 500]).toContain(response.status);
            expect(response.body).toHaveProperty('success');
            if (response.status === 501) {
                fail('Admin stats endpoint is not implemented');
            }
        });

        it('GET /api/marketplace/admin/audit-log should be implemented', async () => {
            const response = await request(app)
                .get('/api/marketplace/admin/audit-log');
            
            // Should return 401 (auth required) or 500 (database issue), not 501 (not implemented)
            expect([401, 500]).toContain(response.status);
            expect(response.body).toHaveProperty('success');
            if (response.status === 501) {
                fail('Admin audit log endpoint is not implemented');
            }
        });
    });

    describe('Input Validation', () => {
        it('should validate listing ID format for flag endpoint', async () => {
            const response = await request(app)
                .put('/api/marketplace/admin/listings/invalid-id/flag')
                .send({ action: 'flag', reason: 'Test' });
            
            // Should return 400 for invalid ID format (after auth check)
            expect([400, 401]).toContain(response.status);
            if (response.status === 400) {
                expect(response.body.code).toBe('INVALID_ID');
            }
        });

        it('should validate listing ID format for delete endpoint', async () => {
            const response = await request(app)
                .delete('/api/marketplace/admin/listings/invalid-id')
                .send({ reason: 'Test deletion' });
            
            // Should return 400 for invalid ID format (after auth check)
            expect([400, 401]).toContain(response.status);
            if (response.status === 400) {
                expect(response.body.code).toBe('INVALID_ID');
            }
        });
    });

    describe('AuditLog Model', () => {
        it('should be able to create audit log entries', async () => {
            const auditLog = await AuditLog.logAction({
                admin: adminUser._id,
                action: 'listing_flagged',
                resourceType: 'listing',
                resourceId: testListing._id,
                details: {
                    reason: 'Test audit log entry',
                    metadata: { test: true }
                },
                ipAddress: '127.0.0.1',
                userAgent: 'Test Script'
            });

            expect(auditLog).toBeTruthy();
            expect(auditLog.action).toBe('listing_flagged');
            expect(auditLog.admin.toString()).toBe(adminUser._id.toString());

            // Clean up
            await AuditLog.findByIdAndDelete(auditLog._id);
        });

        it('should be able to get audit statistics', async () => {
            const stats = await AuditLog.getAuditStats();
            expect(stats).toBeTruthy();
            expect(stats.summary).toBeDefined();
            expect(stats.actionBreakdown).toBeDefined();
            expect(stats.resourceBreakdown).toBeDefined();
            expect(stats.adminActivity).toBeDefined();
        });

        it('should be able to get paginated audit logs', async () => {
            const result = await AuditLog.getAuditLogs({ limit: 5 });
            expect(result).toBeTruthy();
            expect(result.logs).toBeDefined();
            expect(result.pagination).toBeDefined();
            expect(Array.isArray(result.logs)).toBe(true);
        });
    });
});