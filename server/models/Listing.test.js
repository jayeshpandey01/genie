import mongoose from "mongoose";
import Listing from "./Listing.js";
import User from "./User.js";

// Mock user data for testing
const mockUser = {
    _id: new mongoose.Types.ObjectId(),
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '1234567890'
};

describe('Listing Model', () => {
    // Test data
    const validListingData = {
        title: 'iPhone 13 Pro',
        description: 'Excellent condition iPhone 13 Pro with original box and accessories.',
        category: 'electronics',
        price: 799.99,
        condition: 'like-new',
        location: 'Mumbai, Maharashtra',
        images: ['iphone13-1.jpg', 'iphone13-2.jpg'],
        seller: mockUser._id
    };

    describe('Validation', () => {
        test('should create a valid listing', () => {
            const listing = new Listing(validListingData);
            const validationError = listing.validateSync();
            expect(validationError).toBeUndefined();
        });

        test('should require title', () => {
            const listingData = { ...validListingData };
            delete listingData.title;
            const listing = new Listing(listingData);
            const validationError = listing.validateSync();
            expect(validationError.errors.title).toBeDefined();
        });

        test('should require description', () => {
            const listingData = { ...validListingData };
            delete listingData.description;
            const listing = new Listing(listingData);
            const validationError = listing.validateSync();
            expect(validationError.errors.description).toBeDefined();
        });

        test('should require category', () => {
            const listingData = { ...validListingData };
            delete listingData.category;
            const listing = new Listing(listingData);
            const validationError = listing.validateSync();
            expect(validationError.errors.category).toBeDefined();
        });

        test('should validate category enum', () => {
            const listingData = { ...validListingData, category: 'invalid-category' };
            const listing = new Listing(listingData);
            const validationError = listing.validateSync();
            expect(validationError.errors.category).toBeDefined();
        });

        test('should require price', () => {
            const listingData = { ...validListingData };
            delete listingData.price;
            const listing = new Listing(listingData);
            const validationError = listing.validateSync();
            expect(validationError.errors.price).toBeDefined();
        });

        test('should validate price is not negative', () => {
            const listingData = { ...validListingData, price: -10 };
            const listing = new Listing(listingData);
            const validationError = listing.validateSync();
            expect(validationError.errors.price).toBeDefined();
        });

        test('should require condition', () => {
            const listingData = { ...validListingData };
            delete listingData.condition;
            const listing = new Listing(listingData);
            const validationError = listing.validateSync();
            expect(validationError.errors.condition).toBeDefined();
        });

        test('should validate condition enum', () => {
            const listingData = { ...validListingData, condition: 'invalid-condition' };
            const listing = new Listing(listingData);
            const validationError = listing.validateSync();
            expect(validationError.errors.condition).toBeDefined();
        });

        test('should require location', () => {
            const listingData = { ...validListingData };
            delete listingData.location;
            const listing = new Listing(listingData);
            const validationError = listing.validateSync();
            expect(validationError.errors.location).toBeDefined();
        });

        test('should require seller', () => {
            const listingData = { ...validListingData };
            delete listingData.seller;
            const listing = new Listing(listingData);
            const validationError = listing.validateSync();
            expect(validationError.errors.seller).toBeDefined();
        });

        test('should limit images to 8', () => {
            const listingData = { 
                ...validListingData, 
                images: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg', '9.jpg']
            };
            const listing = new Listing(listingData);
            const validationError = listing.validateSync();
            expect(validationError.errors.images).toBeDefined();
        });

        test('should validate image filename format', () => {
            const listingData = { 
                ...validListingData, 
                images: ['invalid-image-name']
            };
            const listing = new Listing(listingData);
            const validationError = listing.validateSync();
            expect(validationError.errors['images.0']).toBeDefined();
        });

        test('should validate status enum', () => {
            const listingData = { ...validListingData, status: 'invalid-status' };
            const listing = new Listing(listingData);
            const validationError = listing.validateSync();
            expect(validationError.errors.status).toBeDefined();
        });
    });

    describe('Instance Methods', () => {
        let listing;

        beforeEach(() => {
            listing = new Listing(validListingData);
        });

        test('should increment views', () => {
            const initialViews = listing.views;
            // Mock the save method since we're not connected to DB
            listing.save = jest.fn().mockResolvedValue(listing);
            
            listing.incrementViews();
            expect(listing.views).toBe(initialViews + 1);
        });

        test('should mark as sold', () => {
            // Mock the save method
            listing.save = jest.fn().mockResolvedValue(listing);
            
            listing.markAsSold();
            expect(listing.status).toBe('sold');
            expect(listing.updatedAt).toBeInstanceOf(Date);
        });

        test('should check if user can edit - owner', () => {
            const canEdit = listing.canEdit(mockUser._id, 'user');
            expect(canEdit).toBe(true);
        });

        test('should check if user can edit - admin', () => {
            const differentUserId = new mongoose.Types.ObjectId();
            const canEdit = listing.canEdit(differentUserId, 'admin');
            expect(canEdit).toBe(true);
        });

        test('should check if user can edit - unauthorized', () => {
            const differentUserId = new mongoose.Types.ObjectId();
            const canEdit = listing.canEdit(differentUserId, 'user');
            expect(canEdit).toBe(false);
        });
    });

    describe('Default Values', () => {
        test('should set default status to active', () => {
            const listing = new Listing(validListingData);
            expect(listing.status).toBe('active');
        });

        test('should set default views to 0', () => {
            const listing = new Listing(validListingData);
            expect(listing.views).toBe(0);
        });

        test('should set default images to empty array', () => {
            const listingData = { ...validListingData };
            delete listingData.images;
            const listing = new Listing(listingData);
            expect(listing.images).toEqual([]);
        });

        test('should set createdAt and updatedAt', () => {
            const listing = new Listing(validListingData);
            expect(listing.createdAt).toBeInstanceOf(Date);
            expect(listing.updatedAt).toBeInstanceOf(Date);
        });
    });
});