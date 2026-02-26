import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import marketplaceRoutes from '../routes/marketplace.js';
import Listing from '../models/Listing.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Create a test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/marketplace', marketplaceRoutes);

describe('Marketplace Search and Filter Functionality', () => {
    let testUser;
    let testListings = [];

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/genie-test');
        
        // Create test user
        const hashedPassword = await bcrypt.hash('testpassword123', 10);
        testUser = new User({
            first_name: 'Test',
            last_name: 'User',
            email: 'testuser@example.com',
            password: hashedPassword,
            phone: '555-0123',
            role: 'user'
        });
        await testUser.save();

        // Create test categories
        await Category.deleteMany({});
        const categories = [
            { name: 'Electronics', slug: 'electronics', description: 'Electronic devices', icon: '📱', order: 1, isActive: true, listingCount: 0 },
            { name: 'Furniture', slug: 'furniture', description: 'Home furniture', icon: '🪑', order: 2, isActive: true, listingCount: 0 },
            { name: 'Books', slug: 'books', description: 'Books and literature', icon: '📚', order: 3, isActive: true, listingCount: 0 }
        ];
        await Category.insertMany(categories);

        // Create test listings
        await Listing.deleteMany({});
        const listings = [
            {
                title: 'iPhone 14 Pro Max',
                description: 'Brand new iPhone with advanced camera system',
                category: 'electronics',
                price: 1099,
                condition: 'new',
                location: 'Mumbai, Maharashtra',
                seller: testUser._id,
                status: 'active'
            },
            {
                title: 'MacBook Pro Laptop',
                description: 'Professional laptop for developers and designers',
                category: 'electronics',
                price: 2499,
                condition: 'like-new',
                location: 'New York, NY',
                seller: testUser._id,
                status: 'active'
            },
            {
                title: 'Gaming Laptop ASUS',
                description: 'High-performance gaming laptop with RTX graphics',
                category: 'electronics',
                price: 1799,
                condition: 'good',
                location: 'Austin, TX',
                seller: testUser._id,
                status: 'active'
            },
            {
                title: 'Vintage Leather Sofa',
                description: 'Beautiful vintage brown leather sofa',
                category: 'furniture',
                price: 650,
                condition: 'good',
                location: 'Chicago, IL',
                seller: testUser._id,
                status: 'active'
            },
            {
                title: 'Programming Books Collection',
                description: 'Collection of programming books for developers',
                category: 'books',
                price: 75,
                condition: 'good',
                location: 'Portland, OR',
                seller: testUser._id,
                status: 'active'
            }
        ];
        
        testListings = await Listing.insertMany(listings);
    });

    afterAll(async () => {
        // Clean up test data
        await Listing.deleteMany({});
        await Category.deleteMany({});
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    describe('Text Search Functionality', () => {
        test('should search across titles, descriptions, and categories', async () => {
            const response = await request(app)
                .get('/api/marketplace/listings?search=laptop')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.listings.length).toBeGreaterThan(0);
            
            // Should find both MacBook Pro and Gaming Laptop
            const titles = response.body.listings.map(l => l.title);
            expect(titles.some(title => title.includes('MacBook'))).toBe(true);
            expect(titles.some(title => title.includes('Gaming Laptop'))).toBe(true);
        });

        test('should return results ordered by relevance and recency', async () => {
            const response = await request(app)
                .get('/api/marketplace/listings?search=programming')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.listings.length).toBeGreaterThan(0);
            
            // Results should be ordered (text score first, then by creation date)
            const listings = response.body.listings;
            expect(listings[0].title).toContain('Programming');
        });

        test('should handle empty search gracefully', async () => {
            const response = await request(app)
                .get('/api/marketplace/listings?search=')
                .expect(200);

            expect(response.body.success).toBe(true);
            // Should return all active listings when search is empty
            expect(response.body.listings.length).toBe(testListings.length);
        });
    });

    describe('Filter Functionality', () => {
        test('should filter by category', async () => {
            const response = await request(app)
                .get('/api/marketplace/listings?category=electronics')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.listings.length).toBe(3); // iPhone, MacBook, Gaming Laptop
            
            response.body.listings.forEach(listing => {
                expect(listing.category).toBe('electronics');
            });
        });

        test('should filter by price range', async () => {
            const response = await request(app)
                .get('/api/marketplace/listings?priceMin=100&priceMax=1000')
                .expect(200);

            expect(response.body.success).toBe(true);
            
            response.body.listings.forEach(listing => {
                expect(listing.price).toBeGreaterThanOrEqual(100);
                expect(listing.price).toBeLessThanOrEqual(1000);
            });
        });

        test('should filter by condition', async () => {
            const response = await request(app)
                .get('/api/marketplace/listings?condition=good')
                .expect(200);

            expect(response.body.success).toBe(true);
            
            response.body.listings.forEach(listing => {
                expect(listing.condition).toBe('good');
            });
        });

        test('should filter by location', async () => {
            const response = await request(app)
                .get('/api/marketplace/listings?location=CA')
                .expect(200);

            expect(response.body.success).toBe(true);
            
            response.body.listings.forEach(listing => {
                expect(listing.location).toMatch(/CA/i);
            });
        });

        test('should combine multiple filters using AND logic', async () => {
            const response = await request(app)
                .get('/api/marketplace/listings?category=electronics&priceMax=1500&condition=good')
                .expect(200);

            expect(response.body.success).toBe(true);
            
            response.body.listings.forEach(listing => {
                expect(listing.category).toBe('electronics');
                expect(listing.price).toBeLessThanOrEqual(1500);
                expect(listing.condition).toBe('good');
            });
        });
    });

    describe('Autocomplete Suggestions', () => {
        test('should provide autocomplete suggestions based on existing data', async () => {
            const response = await request(app)
                .get('/api/marketplace/search/suggestions?q=lap')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.suggestions).toBeInstanceOf(Array);
            expect(response.body.suggestions.length).toBeGreaterThan(0);
            expect(response.body.suggestions).toContain('laptop');
        });

        test('should return category suggestions', async () => {
            const response = await request(app)
                .get('/api/marketplace/search/suggestions?q=elect')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.suggestions).toContain('Electronics');
        });

        test('should handle short queries', async () => {
            const response = await request(app)
                .get('/api/marketplace/search/suggestions?q=a')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.suggestions).toEqual([]);
        });

        test('should limit number of suggestions', async () => {
            const response = await request(app)
                .get('/api/marketplace/search/suggestions?q=a')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.suggestions.length).toBeLessThanOrEqual(10);
        });
    });

    describe('Result Ordering', () => {
        test('should sort by price ascending', async () => {
            const response = await request(app)
                .get('/api/marketplace/listings?sortBy=price&sortOrder=asc')
                .expect(200);

            expect(response.body.success).toBe(true);
            
            const prices = response.body.listings.map(l => l.price);
            for (let i = 1; i < prices.length; i++) {
                expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
            }
        });

        test('should sort by price descending', async () => {
            const response = await request(app)
                .get('/api/marketplace/listings?sortBy=price&sortOrder=desc')
                .expect(200);

            expect(response.body.success).toBe(true);
            
            const prices = response.body.listings.map(l => l.price);
            for (let i = 1; i < prices.length; i++) {
                expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
            }
        });

        test('should sort by creation date (recency)', async () => {
            const response = await request(app)
                .get('/api/marketplace/listings?sortBy=createdAt&sortOrder=desc')
                .expect(200);

            expect(response.body.success).toBe(true);
            
            const dates = response.body.listings.map(l => new Date(l.createdAt).getTime());
            for (let i = 1; i < dates.length; i++) {
                expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
            }
        });
    });

    describe('Pagination', () => {
        test('should implement proper pagination', async () => {
            const response = await request(app)
                .get('/api/marketplace/listings?page=1&limit=2')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.listings.length).toBeLessThanOrEqual(2);
            expect(response.body.pagination).toHaveProperty('currentPage', 1);
            expect(response.body.pagination).toHaveProperty('totalPages');
            expect(response.body.pagination).toHaveProperty('totalItems');
            expect(response.body.pagination).toHaveProperty('hasNext');
            expect(response.body.pagination).toHaveProperty('hasPrev');
        });
    });

    describe('Enhanced Search Features', () => {
        test('should provide helpful message when no search results found', async () => {
            const response = await request(app)
                .get('/api/marketplace/listings?search=nonexistentitem12345')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.listings.length).toBe(0);
            expect(response.body.searchMessage).toBeDefined();
            expect(response.body.searchMessage.type).toBe('no_results');
            expect(response.body.searchMessage.message).toContain('nonexistentitem12345');
            expect(response.body.searchMessage.suggestions).toBeInstanceOf(Array);
            expect(response.body.searchMessage.suggestions.length).toBeGreaterThan(0);
        });

        test('should provide helpful message when no filter results found', async () => {
            const response = await request(app)
                .get('/api/marketplace/listings?category=electronics&priceMin=10000&priceMax=20000')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.listings.length).toBe(0);
            expect(response.body.searchMessage).toBeDefined();
            expect(response.body.searchMessage.type).toBe('no_results_filtered');
            expect(response.body.searchMessage.message).toContain('filters');
            expect(response.body.searchMessage.suggestions).toBeInstanceOf(Array);
        });

        test('should not show search message when results are found', async () => {
            const response = await request(app)
                .get('/api/marketplace/listings?search=laptop')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.listings.length).toBeGreaterThan(0);
            expect(response.body.searchMessage).toBeNull();
        });
    });

    describe('Advanced Search Functionality', () => {
        test('should perform advanced search with relevance scoring', async () => {
            const response = await request(app)
                .get('/api/marketplace/search/advanced?q=laptop&sortBy=relevance')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.listings.length).toBeGreaterThan(0);
            expect(response.body.searchParams).toBeDefined();
            expect(response.body.searchParams.query).toBe('laptop');
            expect(response.body.searchParams.sortBy).toBe('relevance');
            expect(response.body.searchParams.boosts).toBeDefined();
        });

        test('should handle advanced search with custom boost parameters', async () => {
            const response = await request(app)
                .get('/api/marketplace/search/advanced?q=programming&boost_title=3&boost_recent=2&boost_category=1.5')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.searchParams.boosts.title).toBe(3);
            expect(response.body.searchParams.boosts.recent).toBe(2);
            expect(response.body.searchParams.boosts.category).toBe(1.5);
        });

        test('should require minimum query length for advanced search', async () => {
            const response = await request(app)
                .get('/api/marketplace/search/advanced?q=a')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('at least 2 characters');
        });

        test('should combine advanced search with filters', async () => {
            const response = await request(app)
                .get('/api/marketplace/search/advanced?q=laptop&category=electronics&priceMax=2000')
                .expect(200);

            expect(response.body.success).toBe(true);
            response.body.listings.forEach(listing => {
                expect(listing.category).toBe('electronics');
                expect(listing.price).toBeLessThanOrEqual(2000);
            });
        });
    });

    describe('Enhanced Autocomplete Features', () => {
        test('should provide enhanced autocomplete with relevance scoring', async () => {
            const response = await request(app)
                .get('/api/marketplace/search/suggestions?q=lap')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.suggestions).toBeInstanceOf(Array);
            expect(response.body.count).toBeDefined();
            expect(response.body.count).toBe(response.body.suggestions.length);
            expect(response.body.suggestions).toContain('laptop');
        });

        test('should prioritize exact prefix matches in autocomplete', async () => {
            const response = await request(app)
                .get('/api/marketplace/search/suggestions?q=prog')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.suggestions.length).toBeGreaterThan(0);
            // Should prioritize "programming" over partial matches
            expect(response.body.suggestions[0]).toBe('programming');
        });

        test('should include category suggestions in autocomplete', async () => {
            const response = await request(app)
                .get('/api/marketplace/search/suggestions?q=elect')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.suggestions).toContain('Electronics');
        });

        test('should limit autocomplete suggestions appropriately', async () => {
            const response = await request(app)
                .get('/api/marketplace/search/suggestions?q=a')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.suggestions.length).toBeLessThanOrEqual(10);
        });
    });

    describe('Filter Metadata', () => {
        test('should provide filter metadata for frontend', async () => {
            const response = await request(app)
                .get('/api/marketplace/listings')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.filters).toHaveProperty('categories');
            expect(response.body.filters).toHaveProperty('priceRange');
            expect(response.body.filters).toHaveProperty('conditions');
            
            expect(response.body.filters.categories).toBeInstanceOf(Array);
            expect(response.body.filters.priceRange).toBeInstanceOf(Array);
            expect(response.body.filters.priceRange).toHaveLength(2);
            expect(response.body.filters.conditions).toBeInstanceOf(Array);
        });
    });
});