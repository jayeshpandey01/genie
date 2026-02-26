#!/usr/bin/env node

/**
 * Database Optimization Script
 * Adds performance indexes and optimizes database configuration
 */

import mongoose from 'mongoose';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import Category from '../models/Category.js';

console.log('🔧 Starting Database Optimization...\n');

const optimizeDatabase = async () => {
    try {
        // Connect to database
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/Genie';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to database\n');

        // Optimize Listing collection
        console.log('📊 Optimizing Listing collection...');
        
        // Helper function to create index safely
        const createIndexSafely = async (collection, indexSpec, options) => {
            try {
                await collection.createIndex(indexSpec, options);
                console.log(`   ✅ Created ${options.name || 'index'}: ${JSON.stringify(indexSpec)}`);
            } catch (error) {
                if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
                    console.log(`   ⚠️  Index already exists: ${options.name || JSON.stringify(indexSpec)}`);
                } else {
                    console.log(`   ❌ Failed to create index ${options.name}: ${error.message}`);
                }
            }
        };
        
        // Compound index for filtered browsing (status + category + date)
        await createIndexSafely(
            Listing.collection,
            { status: 1, category: 1, createdAt: -1 },
            { name: 'status_category_date_idx', background: true }
        );

        // Compound index for price filtering
        await createIndexSafely(
            Listing.collection,
            { status: 1, price: 1 },
            { name: 'status_price_idx', background: true }
        );

        // Index for user's own listings
        await createIndexSafely(
            Listing.collection,
            { seller: 1, status: 1 },
            { name: 'seller_status_idx', background: true }
        );

        // Text search index
        await createIndexSafely(
            Listing.collection,
            { title: 'text', description: 'text' },
            { 
                name: 'text_search_idx',
                background: true,
                weights: { title: 10, description: 5 }
            }
        );

        // Index for location-based queries
        await createIndexSafely(
            Listing.collection,
            { status: 1, location: 1 },
            { name: 'status_location_idx', background: true }
        );

        // Index for condition filtering
        await createIndexSafely(
            Listing.collection,
            { status: 1, condition: 1 },
            { name: 'status_condition_idx', background: true }
        );

        // Index for views (for popular listings)
        await createIndexSafely(
            Listing.collection,
            { status: 1, views: -1 },
            { name: 'status_views_idx', background: true }
        );

        // Optimize User collection
        console.log('\n👤 Optimizing User collection...');
        
        // Index for marketplace profile queries
        await createIndexSafely(
            User.collection,
            { 'marketplaceProfile.totalListings': -1 },
            { name: 'marketplace_listings_idx', background: true }
        );

        // Index for marketplace profile rating
        await createIndexSafely(
            User.collection,
            { 'marketplaceProfile.rating': -1 },
            { name: 'marketplace_rating_idx', background: true }
        );

        // Optimize Category collection
        console.log('\n📂 Optimizing Category collection...');
        
        // Index for active categories with listing count
        await createIndexSafely(
            Category.collection,
            { isActive: 1, listingCount: -1 },
            { name: 'active_listing_count_idx', background: true }
        );

        // Index for category ordering
        await createIndexSafely(
            Category.collection,
            { isActive: 1, order: 1 },
            { name: 'active_order_idx', background: true }
        );

        // Display all indexes
        console.log('\n📋 Current Database Indexes:');
        
        const listingIndexes = await Listing.collection.getIndexes();
        console.log('\n   Listing Collection:');
        Object.keys(listingIndexes).forEach(indexName => {
            console.log(`     • ${indexName}`);
        });

        const userIndexes = await User.collection.getIndexes();
        console.log('\n   User Collection:');
        Object.keys(userIndexes).forEach(indexName => {
            console.log(`     • ${indexName}`);
        });

        const categoryIndexes = await Category.collection.getIndexes();
        console.log('\n   Category Collection:');
        Object.keys(categoryIndexes).forEach(indexName => {
            console.log(`     • ${indexName}`);
        });

        // Performance recommendations
        console.log('\n💡 Additional Performance Recommendations:');
        console.log('   • Enable MongoDB profiler to monitor slow queries');
        console.log('   • Set up connection pooling with appropriate pool size');
        console.log('   • Implement read replicas for read-heavy operations');
        console.log('   • Consider sharding for very large datasets (>100M documents)');
        console.log('   • Use MongoDB Compass or similar tools for query analysis');
        console.log('   • Monitor index usage with db.collection.getIndexStats()');
        console.log('   • Implement caching layer (Redis) for frequently accessed data');

        console.log('\n✅ Database optimization completed successfully!');

    } catch (error) {
        console.error('❌ Database optimization failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
};

// Run optimization
optimizeDatabase();