import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Category from '../../models/Category.js';
import Listing from '../../models/Listing.js';

describe('Category Model', () => {
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
        await Category.deleteMany({});
        await Listing.deleteMany({});
    });

    describe('Schema Validation', () => {
        test('should create a valid category with all required fields', async () => {
            const categoryData = {
                name: 'Electronics',
                slug: 'electronics',
                description: 'Electronic devices and gadgets',
                icon: '📱',
                order: 1
            };

            const category = new Category(categoryData);
            const savedCategory = await category.save();

            expect(savedCategory.name).toBe(categoryData.name);
            expect(savedCategory.slug).toBe(categoryData.slug);
            expect(savedCategory.description).toBe(categoryData.description);
            expect(savedCategory.icon).toBe(categoryData.icon);
            expect(savedCategory.order).toBe(categoryData.order);
            expect(savedCategory.isActive).toBe(true); // default value
            expect(savedCategory.listingCount).toBe(0); // default value
            expect(savedCategory.createdAt).toBeDefined();
            expect(savedCategory.updatedAt).toBeDefined();
        });

        test('should require name field', async () => {
            const category = new Category({
                slug: 'electronics',
                icon: '📱'
            });

            await expect(category.save()).rejects.toThrow('Category name is required');
        });

        test('should require slug field', async () => {
            const category = new Category({
                name: 'Electronics',
                icon: '📱'
            });

            await expect(category.save()).rejects.toThrow('Category slug is required');
        });

        test('should require icon field', async () => {
            const category = new Category({
                name: 'Electronics',
                slug: 'electronics'
            });

            await expect(category.save()).rejects.toThrow('Category icon is required');
        });

        test('should enforce unique name constraint', async () => {
            const categoryData = {
                name: 'Electronics',
                slug: 'electronics',
                icon: '📱'
            };

            await new Category(categoryData).save();

            const duplicateCategory = new Category({
                name: 'Electronics',
                slug: 'electronics-2',
                icon: '📱'
            });

            await expect(duplicateCategory.save()).rejects.toThrow();
        });

        test('should enforce unique slug constraint', async () => {
            const categoryData = {
                name: 'Electronics',
                slug: 'electronics',
                icon: '📱'
            };

            await new Category(categoryData).save();

            const duplicateCategory = new Category({
                name: 'Electronics 2',
                slug: 'electronics',
                icon: '📱'
            });

            await expect(duplicateCategory.save()).rejects.toThrow();
        });

        test('should validate slug format', async () => {
            const invalidSlugs = [
                'electronics space', // space
                'electronics_underscore', // underscore
                'electronics!', // special character
                'electronics@special', // special character
                'electronics.dot' // dot
            ];

            for (const slug of invalidSlugs) {
                const category = new Category({
                    name: 'Electronics',
                    slug: slug,
                    icon: '📱'
                });

                await expect(category.save()).rejects.toThrow('Slug must contain only lowercase letters, numbers, and hyphens');
            }
        });

        test('should accept valid slug formats', async () => {
            const validSlugs = [
                'electronics',
                'home-garden',
                'electronics123',
                'category-1-2-3'
            ];

            for (let i = 0; i < validSlugs.length; i++) {
                const category = new Category({
                    name: `Category ${i}`,
                    slug: validSlugs[i],
                    icon: '📱'
                });

                const savedCategory = await category.save();
                expect(savedCategory.slug).toBe(validSlugs[i]);
            }
        });

        test('should enforce maximum length constraints', async () => {
            const category = new Category({
                name: 'A'.repeat(51), // exceeds 50 character limit
                slug: 'electronics',
                description: 'B'.repeat(201), // exceeds 200 character limit
                icon: '📱'
            });

            await expect(category.save()).rejects.toThrow();
        });

        test('should trim whitespace from string fields', async () => {
            const category = new Category({
                name: '  Electronics  ',
                slug: '  electronics  ',
                description: '  Electronic devices  ',
                icon: '  📱  '
            });

            const savedCategory = await category.save();
            expect(savedCategory.name).toBe('Electronics');
            expect(savedCategory.slug).toBe('electronics');
            expect(savedCategory.description).toBe('Electronic devices');
            expect(savedCategory.icon).toBe('📱');
        });
    });

    describe('Static Methods', () => {
        beforeEach(async () => {
            // Create test categories
            const categories = [
                { name: 'Electronics', slug: 'electronics', icon: '📱', order: 1, isActive: true },
                { name: 'Furniture', slug: 'furniture', icon: '🪑', order: 2, isActive: true },
                { name: 'Inactive Category', slug: 'inactive', icon: '❌', order: 3, isActive: false }
            ];

            await Category.insertMany(categories);
        });

        test('findActive should return only active categories sorted by order', async () => {
            const activeCategories = await Category.findActive();

            expect(activeCategories).toHaveLength(2);
            expect(activeCategories[0].name).toBe('Electronics');
            expect(activeCategories[1].name).toBe('Furniture');
            expect(activeCategories.every(cat => cat.isActive)).toBe(true);
        });

        test('findBySlug should return category by slug if active', async () => {
            const category = await Category.findBySlug('electronics');

            expect(category).toBeTruthy();
            expect(category.name).toBe('Electronics');
            expect(category.slug).toBe('electronics');
        });

        test('findBySlug should not return inactive categories', async () => {
            const category = await Category.findBySlug('inactive');

            expect(category).toBeNull();
        });

        test('findBySlug should return null for non-existent slug', async () => {
            const category = await Category.findBySlug('non-existent');

            expect(category).toBeNull();
        });
    });

    describe('Instance Methods', () => {
        let category;

        beforeEach(async () => {
            category = new Category({
                name: 'Electronics',
                slug: 'electronics',
                icon: '📱',
                listingCount: 5
            });
            await category.save();
        });

        test('incrementListingCount should increase count by 1', async () => {
            const initialCount = category.listingCount;
            await category.incrementListingCount();

            expect(category.listingCount).toBe(initialCount + 1);
        });

        test('decrementListingCount should decrease count by 1', async () => {
            const initialCount = category.listingCount;
            await category.decrementListingCount();

            expect(category.listingCount).toBe(initialCount - 1);
        });

        test('decrementListingCount should not go below 0', async () => {
            category.listingCount = 0;
            await category.save();

            await category.decrementListingCount();

            expect(category.listingCount).toBe(0);
        });

        test('incrementListingCount should update updatedAt timestamp', async () => {
            const originalUpdatedAt = category.updatedAt;
            
            // Wait a bit to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));
            
            await category.incrementListingCount();

            expect(category.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        });

        test('decrementListingCount should update updatedAt timestamp', async () => {
            const originalUpdatedAt = category.updatedAt;
            
            // Wait a bit to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));
            
            await category.decrementListingCount();

            expect(category.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        });
    });

    describe('Predefined Categories', () => {
        test('should match the required predefined categories from requirements', async () => {
            const requiredCategories = [
                'Electronics',
                'Furniture', 
                'Vehicles',
                'Clothing',
                'Books',
                'Sports',
                'Home & Garden',
                'Other'
            ];

            const requiredSlugs = [
                'electronics',
                'furniture',
                'vehicles', 
                'clothing',
                'books',
                'sports',
                'home-garden',
                'other'
            ];

            // Create categories matching the seeding script
            const categories = [
                { name: 'Electronics', slug: 'electronics', icon: '📱', order: 1 },
                { name: 'Furniture', slug: 'furniture', icon: '🪑', order: 2 },
                { name: 'Vehicles', slug: 'vehicles', icon: '🚗', order: 3 },
                { name: 'Clothing', slug: 'clothing', icon: '👕', order: 4 },
                { name: 'Books', slug: 'books', icon: '📚', order: 5 },
                { name: 'Sports', slug: 'sports', icon: '⚽', order: 6 },
                { name: 'Home & Garden', slug: 'home-garden', icon: '🏡', order: 7 },
                { name: 'Other', slug: 'other', icon: '📦', order: 8 }
            ];

            await Category.insertMany(categories);

            const savedCategories = await Category.findActive();
            const savedNames = savedCategories.map(cat => cat.name).sort();
            const savedSlugs = savedCategories.map(cat => cat.slug).sort();

            expect(savedNames).toEqual(requiredCategories.sort());
            expect(savedSlugs).toEqual(requiredSlugs.sort());
        });
    });

    describe('Listing Count Tracking', () => {
        test('should accurately track listing counts', async () => {
            const category = new Category({
                name: 'Electronics',
                slug: 'electronics',
                icon: '📱'
            });
            await category.save();

            // Initial count should be 0
            expect(category.listingCount).toBe(0);

            // Simulate adding listings
            await category.incrementListingCount();
            await category.incrementListingCount();
            await category.incrementListingCount();

            expect(category.listingCount).toBe(3);

            // Simulate removing a listing
            await category.decrementListingCount();

            expect(category.listingCount).toBe(2);
        });
    });

    describe('Middleware', () => {
        test('should update updatedAt timestamp on save when modified', async () => {
            const category = new Category({
                name: 'Electronics',
                slug: 'electronics',
                icon: '📱'
            });
            await category.save();

            const originalUpdatedAt = category.updatedAt;
            
            // Wait a bit to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Modify and save
            category.description = 'Updated description';
            await category.save();

            expect(category.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        });

        test('should not update updatedAt timestamp on new document save', async () => {
            const category = new Category({
                name: 'Electronics',
                slug: 'electronics',
                icon: '📱'
            });

            const beforeSave = new Date();
            await category.save();
            const afterSave = new Date();

            // For new documents, updatedAt should be close to createdAt
            expect(Math.abs(category.updatedAt.getTime() - category.createdAt.getTime())).toBeLessThan(1000);
        });
    });
});