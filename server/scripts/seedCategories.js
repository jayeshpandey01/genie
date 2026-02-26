#!/usr/bin/env node

/**
 * Category Seeding Script
 * Seeds the database with predefined marketplace categories
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';

// Load environment variables
dotenv.config();

console.log('🌱 Starting Category Seeding...\n');

const categories = [
    {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Phones, laptops, cameras, and electronic gadgets',
        icon: '📱',
        order: 1
    },
    {
        name: 'Furniture',
        slug: 'furniture',
        description: 'Home and office furniture, decor items',
        icon: '🪑',
        order: 2
    },
    {
        name: 'Vehicles',
        slug: 'vehicles',
        description: 'Cars, bikes, scooters, and automotive accessories',
        icon: '🚗',
        order: 3
    },
    {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion, apparel, shoes, and accessories',
        icon: '👕',
        order: 4
    },
    {
        name: 'Books',
        slug: 'books',
        description: 'Books, magazines, educational materials',
        icon: '📚',
        order: 5
    },
    {
        name: 'Sports',
        slug: 'sports',
        description: 'Sports equipment, fitness gear, outdoor activities',
        icon: '⚽',
        order: 6
    },
    {
        name: 'Home & Garden',
        slug: 'home-garden',
        description: 'Home appliances, garden tools, household items',
        icon: '🏠',
        order: 7
    },
    {
        name: 'Other',
        slug: 'other',
        description: 'Miscellaneous items and collectibles',
        icon: '📦',
        order: 8
    }
];

const seedCategories = async () => {
    try {
        // Connect to database
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/Genie';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to database\n');

        // Check if categories already exist
        const existingCategories = await Category.find({});
        if (existingCategories.length > 0) {
            console.log(`⚠️  Found ${existingCategories.length} existing categories:`);
            existingCategories.forEach(cat => {
                console.log(`   • ${cat.name} (${cat.slug}) - ${cat.listingCount} listings`);
            });
            
            console.log('\n❓ Do you want to:');
            console.log('   1. Skip seeding (categories already exist)');
            console.log('   2. Update existing categories');
            console.log('   3. Delete all and recreate');
            
            // For automated seeding, we'll update existing categories
            console.log('\n🔄 Updating existing categories...\n');
            
            for (const categoryData of categories) {
                const existingCategory = await Category.findOne({ slug: categoryData.slug });
                
                if (existingCategory) {
                    // Update existing category
                    existingCategory.name = categoryData.name;
                    existingCategory.description = categoryData.description;
                    existingCategory.icon = categoryData.icon;
                    existingCategory.order = categoryData.order;
                    existingCategory.isActive = true;
                    
                    await existingCategory.save();
                    console.log(`   ✅ Updated: ${categoryData.name}`);
                } else {
                    // Create new category
                    const newCategory = new Category(categoryData);
                    await newCategory.save();
                    console.log(`   ✅ Created: ${categoryData.name}`);
                }
            }
        } else {
            // No existing categories, create all
            console.log('📝 Creating categories...\n');
            
            for (const categoryData of categories) {
                const category = new Category(categoryData);
                await category.save();
                console.log(`   ✅ Created: ${categoryData.name}`);
            }
        }

        // Display final category list
        console.log('\n📊 Final Category List:');
        const finalCategories = await Category.find({}).sort({ order: 1 });
        finalCategories.forEach(cat => {
            console.log(`   ${cat.icon} ${cat.name} (${cat.slug}) - ${cat.listingCount} listings`);
        });

        console.log(`\n🎉 Category seeding completed successfully!`);
        console.log(`   Total categories: ${finalCategories.length}`);
        console.log(`   Active categories: ${finalCategories.filter(cat => cat.isActive).length}`);

    } catch (error) {
        console.error('❌ Category seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Database connection closed');
    }
};

// Run the seeding script
seedCategories();