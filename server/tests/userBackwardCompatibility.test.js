import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User.js';

describe('User Model Backward Compatibility', () => {
    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await User.deleteMany({});
    });

    test('should create user without marketplace fields and still work', async () => {
        // Test creating a user the old way (without marketplace fields)
        const userData = {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone: '1234567890',
            password: 'password123',
            role: 'user'
        };

        const user = new User(userData);
        await user.save();

        // Verify all existing functionality still works
        expect(user.first_name).toBe('John');
        expect(user.last_name).toBe('Doe');
        expect(user.email).toBe('john@example.com');
        expect(user.phone).toBe('1234567890');
        expect(user.role).toBe('user');
        expect(user.cart).toEqual([]);
        expect(user.createdAt).toBeInstanceOf(Date);

        // Verify password hashing still works
        const isPasswordValid = await user.comparePassword('password123');
        expect(isPasswordValid).toBe(true);

        // Verify marketplace fields are automatically initialized
        expect(user.marketplaceProfile).toBeDefined();
        expect(user.marketplaceProfile.rating).toBe(0);
        expect(user.marketplaceProfile.totalListings).toBe(0);
        expect(user.marketplaceProfile.totalSales).toBe(0);
        expect(user.favoriteListings).toEqual([]);
    });

    test('should work with existing authentication flow', async () => {
        const user = new User({
            first_name: 'Admin',
            last_name: 'User',
            email: 'admin@example.com',
            phone: '1111111111',
            password: 'adminpass',
            role: 'admin'
        });

        await user.save();

        // Test password comparison (used in authentication)
        expect(await user.comparePassword('adminpass')).toBe(true);
        expect(await user.comparePassword('wrongpass')).toBe(false);

        // Verify admin role is preserved
        expect(user.role).toBe('admin');

        // Verify marketplace profile is still initialized for admin
        expect(user.marketplaceProfile).toBeDefined();
    });

    test('should work with existing cart functionality', async () => {
        const serviceId = new mongoose.Types.ObjectId();
        const cartItem = {
            service: serviceId,
            quantity: 1,
            category: 'cleaning',
            type: 'regular',
            title: 'Regular Cleaning',
            image: 'cleaning.jpg',
            time: '1 hour',
            OurPrice: 50,
            MRP: 60,
            total: 50,
            description: ['Basic cleaning service']
        };

        const user = new User({
            first_name: 'Customer',
            last_name: 'User',
            email: 'customer@example.com',
            phone: '2222222222',
            password: 'customerpass',
            cart: [cartItem]
        });

        await user.save();

        // Verify cart functionality works
        expect(user.cart.length).toBe(1);
        expect(user.cart[0].service.toString()).toBe(serviceId.toString());
        expect(user.cart[0].quantity).toBe(1);
        expect(user.cart[0].total).toBe(50);

        // Verify marketplace fields don't interfere
        expect(user.marketplaceProfile).toBeDefined();
        expect(user.favoriteListings).toEqual([]);
    });

    test('should handle user queries that existed before marketplace', async () => {
        // Create users with different roles
        const regularUser = new User({
            first_name: 'Regular',
            last_name: 'User',
            email: 'regular@example.com',
            phone: '3333333333',
            password: 'password123',
            role: 'user'
        });

        const adminUser = new User({
            first_name: 'Admin',
            last_name: 'User',
            email: 'admin@example.com',
            phone: '4444444444',
            password: 'password123',
            role: 'admin'
        });

        await regularUser.save();
        await adminUser.save();

        // Test existing queries still work
        const allUsers = await User.find({});
        expect(allUsers.length).toBe(2);

        const adminUsers = await User.find({ role: 'admin' });
        expect(adminUsers.length).toBe(1);
        expect(adminUsers[0].email).toBe('admin@example.com');

        const userByEmail = await User.findOne({ email: 'regular@example.com' });
        expect(userByEmail).toBeTruthy();
        expect(userByEmail.first_name).toBe('Regular');

        // Verify all users have marketplace fields initialized
        allUsers.forEach(user => {
            expect(user.marketplaceProfile).toBeDefined();
            expect(user.favoriteListings).toBeDefined();
        });
    });

    test('should maintain schema validation for existing fields', async () => {
        // Test that existing validations still work
        const invalidUser = new User({
            // Missing required fields
            email: 'test@example.com'
        });

        await expect(invalidUser.save()).rejects.toThrow();

        // Test unique constraints still work
        const user1 = new User({
            first_name: 'User',
            last_name: 'One',
            email: 'duplicate@example.com',
            phone: '9876543210',
            password: 'password123'
        });

        const user2 = new User({
            first_name: 'User',
            last_name: 'Two',
            email: 'duplicate@example.com', // Duplicate email
            phone: '6666666666',
            password: 'password123'
        });

        await user1.save();
        await expect(user2.save()).rejects.toThrow();
    });
});