import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Category from '../models/Category.js';
import emailService from '../services/emailService.js';

describe('Contact System Integration', () => {
    let mongoServer;
    let testUser;
    let sellerUser;
    let testListing;
    let testCategory;

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
    });

    afterEach(async () => {
        // Clear all collections after each test
        await User.deleteMany({});
        await Listing.deleteMany({});
        await Category.deleteMany({});
    });

    describe('Email Service', () => {
        test('should initialize email service successfully', async () => {
            expect(emailService).toBeDefined();
            expect(typeof emailService.sendContactMessage).toBe('function');
        });

        test('should generate proper email template', () => {
            const templateData = {
                listing: {
                    title: 'Test Laptop',
                    price: 500,
                    category: 'electronics',
                    condition: 'good',
                    location: 'Test City',
                    createdAt: new Date()
                },
                buyer: {
                    first_name: 'John',
                    last_name: 'Buyer',
                    phone: '1234567890',
                    email: 'buyer@example.com'
                },
                seller: {
                    first_name: 'Jane',
                    last_name: 'Seller',
                    email: 'seller@example.com'
                },
                message: 'Hi, I am interested in this laptop.'
            };

            const emailContent = emailService.generateContactEmailTemplate(templateData);

            expect(emailContent.html).toContain('Test Laptop');
            expect(emailContent.html).toContain('₹500');
            expect(emailContent.html).toContain('John Buyer');
            expect(emailContent.html).toContain('Hi, I am interested in this laptop.');
            expect(emailContent.html).toContain('Genie Marketplace');

            expect(emailContent.text).toContain('Test Laptop');
            expect(emailContent.text).toContain('₹500');
            expect(emailContent.text).toContain('John Buyer');
            expect(emailContent.text).toContain('Hi, I am interested in this laptop.');
        });

        test('should format listing details correctly in email', () => {
            const templateData = {
                listing: {
                    title: 'Gaming Laptop',
                    price: 1200,
                    category: 'electronics',
                    condition: 'like-new',
                    location: 'Mumbai, Maharashtra',
                    createdAt: new Date('2024-01-15')
                },
                buyer: {
                    first_name: 'Alice',
                    last_name: 'Johnson',
                    phone: '555-0123',
                    email: 'alice@example.com'
                },
                seller: {
                    first_name: 'Bob',
                    last_name: 'Smith',
                    email: 'bob@example.com'
                },
                message: 'Is this still available?'
            };

            const emailContent = emailService.generateContactEmailTemplate(templateData);

            // Check category formatting
            expect(emailContent.html).toContain('Electronics');
            expect(emailContent.text).toContain('Electronics');

            // Check condition formatting
            expect(emailContent.html).toContain('Like new');
            expect(emailContent.text).toContain('Like new');

            // Check price formatting
            expect(emailContent.html).toContain('₹1,200');
            expect(emailContent.text).toContain('₹1,200');

            // Check date formatting (format may vary by locale)
            expect(emailContent.html).toMatch(/1[5\/]\/1[5\/]\/2024|15\/1\/2024/);
            expect(emailContent.text).toMatch(/1[5\/]\/1[5\/]\/2024|15\/1\/2024/);
        });

        test('should include proper reply-to and contact information', () => {
            const templateData = {
                listing: {
                    title: 'Test Item',
                    price: 100,
                    category: 'other',
                    condition: 'good',
                    location: 'Test Location',
                    createdAt: new Date()
                },
                buyer: {
                    first_name: 'Test',
                    last_name: 'Buyer',
                    phone: '123-456-7890',
                    email: 'testbuyer@example.com'
                },
                seller: {
                    first_name: 'Test',
                    last_name: 'Seller',
                    email: 'testseller@example.com'
                },
                message: 'Test message'
            };

            const emailContent = emailService.generateContactEmailTemplate(templateData);

            // Check that buyer contact info is included
            expect(emailContent.html).toContain('testbuyer@example.com');
            expect(emailContent.html).toContain('123-456-7890');
            expect(emailContent.text).toContain('testbuyer@example.com');
            expect(emailContent.text).toContain('123-456-7890');

            // Check reply instructions
            expect(emailContent.html).toContain('reply directly to this email');
            expect(emailContent.text).toContain('reply directly to this email');
        });
    });

    describe('Contact Data Validation', () => {
        test('should validate required contact message data', () => {
            const validData = {
                listing: testListing,
                buyer: testUser,
                seller: sellerUser,
                message: 'Valid message'
            };

            // This should not throw
            expect(() => {
                emailService.generateContactEmailTemplate(validData);
            }).not.toThrow();
        });

        test('should handle special characters in message', () => {
            const templateData = {
                listing: {
                    title: 'Test & Special "Chars" <Item>',
                    price: 100,
                    category: 'other',
                    condition: 'good',
                    location: 'Test Location',
                    createdAt: new Date()
                },
                buyer: {
                    first_name: 'Test',
                    last_name: 'Buyer',
                    phone: '123-456-7890',
                    email: 'testbuyer@example.com'
                },
                seller: {
                    first_name: 'Test',
                    last_name: 'Seller',
                    email: 'testseller@example.com'
                },
                message: 'Message with "quotes" & <special> chars!'
            };

            const emailContent = emailService.generateContactEmailTemplate(templateData);

            // Should contain the special characters (HTML escaped for security in HTML, unescaped in text)
            expect(emailContent.html).toContain('Test &amp; Special &quot;Chars&quot; &lt;Item&gt;');
            expect(emailContent.html).toContain('Message with &quot;quotes&quot; &amp; &lt;special&gt; chars!');
            expect(emailContent.text).toContain('Test &amp; Special &quot;Chars&quot; &lt;Item&gt;');
            expect(emailContent.text).toContain('Message with &quot;quotes&quot; &amp; &lt;special&gt; chars!');
        });
    });
});