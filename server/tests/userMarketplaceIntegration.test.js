import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User.js';

describe('User Marketplace Integration', () => {
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

    describe('Marketplace Profile Fields', () => {
        test('should create user with default marketplace profile', async () => {
            const userData = {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: '1234567890',
                password: 'password123'
            };

            const user = new User(userData);
            await user.save();

            expect(user.marketplaceProfile).toBeDefined();
            expect(user.marketplaceProfile.rating).toBe(0);
            expect(user.marketplaceProfile.totalRatings).toBe(0);
            expect(user.marketplaceProfile.totalListings).toBe(0);
            expect(user.marketplaceProfile.totalSales).toBe(0);
            expect(user.marketplaceProfile.joinedMarketplace).toBeInstanceOf(Date);
            expect(user.marketplaceProfile.isVerified).toBe(false);
            expect(user.favoriteListings).toEqual([]);
        });

        test('should validate rating constraints', async () => {
            const userData = {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: '1234567890',
                password: 'password123',
                marketplaceProfile: {
                    rating: 6 // Invalid - exceeds max
                }
            };

            const user = new User(userData);
            await expect(user.save()).rejects.toThrow();
        });

        test('should validate negative rating', async () => {
            const userData = {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: '1234567890',
                password: 'password123',
                marketplaceProfile: {
                    rating: -1 // Invalid - below min
                }
            };

            const user = new User(userData);
            await expect(user.save()).rejects.toThrow();
        });
    });

    describe('Marketplace Methods', () => {
        let user;

        beforeEach(async () => {
            user = new User({
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: '1234567890',
                password: 'password123'
            });
            await user.save();
        });

        describe('Favorite Listings Management', () => {
            test('should add listing to favorites', async () => {
                const listingId = new mongoose.Types.ObjectId();
                
                await user.addToFavorites(listingId);
                
                expect(user.favoriteListings).toContain(listingId);
                expect(user.favoriteListings.length).toBe(1);
            });

            test('should not add duplicate listings to favorites', async () => {
                const listingId = new mongoose.Types.ObjectId();
                
                await user.addToFavorites(listingId);
                await user.addToFavorites(listingId); // Try to add again
                
                expect(user.favoriteListings.length).toBe(1);
            });

            test('should remove listing from favorites', async () => {
                const listingId = new mongoose.Types.ObjectId();
                
                await user.addToFavorites(listingId);
                expect(user.favoriteListings).toContain(listingId);
                
                await user.removeFromFavorites(listingId);
                expect(user.favoriteListings).not.toContain(listingId);
                expect(user.favoriteListings.length).toBe(0);
            });

            test('should handle removing non-existent listing from favorites', async () => {
                const listingId = new mongoose.Types.ObjectId();
                
                await user.removeFromFavorites(listingId);
                expect(user.favoriteListings.length).toBe(0);
            });
        });

        describe('Listing Count Management', () => {
            test('should increment listing count', async () => {
                expect(user.marketplaceProfile.totalListings).toBe(0);
                
                const updatedUser1 = await user.incrementListingCount();
                expect(updatedUser1.marketplaceProfile.totalListings).toBe(1);
                
                const updatedUser2 = await user.incrementListingCount();
                expect(updatedUser2.marketplaceProfile.totalListings).toBe(2);
            });
        });

        describe('Sales Count Management', () => {
            test('should increment sales count', async () => {
                expect(user.marketplaceProfile.totalSales).toBe(0);
                
                const updatedUser1 = await user.incrementSalesCount();
                expect(updatedUser1.marketplaceProfile.totalSales).toBe(1);
                
                const updatedUser2 = await user.incrementSalesCount();
                expect(updatedUser2.marketplaceProfile.totalSales).toBe(2);
            });
        });

        describe('Rating Management', () => {
            test('should update rating correctly for first rating', async () => {
                expect(user.marketplaceProfile.rating).toBe(0);
                expect(user.marketplaceProfile.totalRatings).toBe(0);
                
                const updatedUser = await user.updateRating(4);
                
                expect(updatedUser.marketplaceProfile.rating).toBe(4);
                expect(updatedUser.marketplaceProfile.totalRatings).toBe(1);
            });

            test('should calculate average rating correctly', async () => {
                await user.updateRating(4);
                const updatedUser = await user.updateRating(5);
                
                expect(updatedUser.marketplaceProfile.rating).toBe(4.5);
                expect(updatedUser.marketplaceProfile.totalRatings).toBe(2);
            });

            test('should handle multiple ratings correctly', async () => {
                await user.updateRating(5);
                await user.updateRating(3);
                const finalUser = await user.updateRating(4);
                
                const expectedAverage = (5 + 3 + 4) / 3;
                expect(finalUser.marketplaceProfile.rating).toBeCloseTo(expectedAverage, 2);
                expect(finalUser.marketplaceProfile.totalRatings).toBe(3);
            });
        });
    });

    describe('Backward Compatibility', () => {
        test('should maintain existing User functionality', async () => {
            const userData = {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: '1234567890',
                password: 'password123',
                role: 'admin'
            };

            const user = new User(userData);
            await user.save();

            // Test existing fields
            expect(user.first_name).toBe('John');
            expect(user.last_name).toBe('Doe');
            expect(user.email).toBe('john@example.com');
            expect(user.phone).toBe('1234567890');
            expect(user.role).toBe('admin');
            expect(user.cart).toEqual([]);
            expect(user.createdAt).toBeInstanceOf(Date);

            // Test password hashing still works
            const isPasswordValid = await user.comparePassword('password123');
            expect(isPasswordValid).toBe(true);

            const isWrongPassword = await user.comparePassword('wrongpassword');
            expect(isWrongPassword).toBe(false);
        });

        test('should work with existing cart functionality', async () => {
            const cartItem = {
                service: new mongoose.Types.ObjectId(),
                quantity: 2,
                category: 'cleaning',
                type: 'deep-clean',
                title: 'Deep Cleaning Service',
                image: 'image.jpg',
                time: '2 hours',
                OurPrice: 100,
                MRP: 120,
                total: 200,
                description: ['Professional cleaning']
            };

            const user = new User({
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: '1234567890',
                password: 'password123',
                cart: [cartItem]
            });

            await user.save();

            expect(user.cart.length).toBe(1);
            expect(user.cart[0].quantity).toBe(2);
            expect(user.cart[0].total).toBe(200);
            
            // Marketplace fields should still be initialized
            expect(user.marketplaceProfile).toBeDefined();
            expect(user.favoriteListings).toEqual([]);
        });
    });

    describe('Database Queries and Population', () => {
        test('should populate favorite listings correctly', async () => {
            // This test would require the Listing model to be available
            // For now, we'll test that the reference is set up correctly
            const user = new User({
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: '1234567890',
                password: 'password123'
            });

            const listingId = new mongoose.Types.ObjectId();
            await user.addToFavorites(listingId);

            // Verify the ObjectId is stored correctly
            expect(user.favoriteListings[0]).toBeInstanceOf(mongoose.Types.ObjectId);
            expect(user.favoriteListings[0].toString()).toBe(listingId.toString());
        });

        test('should find users by marketplace criteria', async () => {
            const user1 = new User({
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: '1234567890',
                password: 'password123'
            });
            await user1.save();
            
            // Increment listing count
            await user1.incrementListingCount();
            await user1.incrementListingCount();

            const user2 = new User({
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'jane@example.com',
                phone: '0987654321',
                password: 'password123'
            });
            await user2.save();

            // Find users with listings
            const usersWithListings = await User.find({
                'marketplaceProfile.totalListings': { $gt: 0 }
            });

            expect(usersWithListings.length).toBe(1);
            expect(usersWithListings[0].email).toBe('john@example.com');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle invalid ObjectId in favorites', async () => {
            const user = new User({
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: '1234567890',
                password: 'password123'
            });

            // This should not throw an error
            await user.removeFromFavorites('invalid-id');
            expect(user.favoriteListings.length).toBe(0);
        });

        test('should maintain data integrity during concurrent operations', async () => {
            const user = new User({
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: '1234567890',
                password: 'password123'
            });
            await user.save();

            // Test concurrent operations - these should now work properly with atomic updates
            const promises = [
                user.incrementListingCount(),
                user.incrementSalesCount(),
                user.updateRating(4),
                user.addToFavorites(new mongoose.Types.ObjectId())
            ];

            const results = await Promise.all(promises);

            // Reload user to get latest state
            const updatedUser = await User.findById(user._id);
            expect(updatedUser.marketplaceProfile.totalListings).toBe(1);
            expect(updatedUser.marketplaceProfile.totalSales).toBe(1);
            expect(updatedUser.marketplaceProfile.rating).toBe(4);
            expect(updatedUser.favoriteListings.length).toBe(1);
        });
    });
});