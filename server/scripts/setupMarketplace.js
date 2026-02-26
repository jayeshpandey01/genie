#!/usr/bin/env node

/**
 * Marketplace Setup Script
 * Complete setup for the Buy & Sell marketplace including categories, admin user, and database optimization
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

console.log('🚀 Starting Marketplace Setup...\n');

const runScript = async (scriptName, description) => {
    try {
        console.log(`📋 ${description}...`);
        const scriptPath = path.join(__dirname, scriptName);
        execSync(`node ${scriptPath}`, { stdio: 'inherit' });
        console.log(`✅ ${description} completed\n`);
    } catch (error) {
        console.error(`❌ ${description} failed:`, error.message);
        throw error;
    }
};

const setupMarketplace = async () => {
    try {
        console.log('🔧 Marketplace Setup Checklist:');
        console.log('   1. Seed marketplace categories');
        console.log('   2. Create admin user');
        console.log('   3. Optimize database indexes');
        console.log('   4. Verify setup\n');

        // Step 1: Seed categories
        await runScript('seedCategories.js', 'Seeding marketplace categories');

        // Step 2: Create admin user
        await runScript('createAdmin.js', 'Creating admin user');

        // Step 3: Optimize database
        await runScript('optimizeDatabase.js', 'Optimizing database indexes');

        // Step 4: Verify setup
        console.log('🔍 Verifying marketplace setup...');
        
        // Connect to database for verification
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/Genie';
        await mongoose.connect(mongoUri);
        
        // Import models for verification
        const Category = (await import('../models/Category.js')).default;
        const User = (await import('../models/User.js')).default;
        const Listing = (await import('../models/Listing.js')).default;
        
        // Verify categories
        const categories = await Category.find({ isActive: true }).sort({ order: 1 });
        console.log(`   ✅ Categories: ${categories.length} active categories`);
        
        // Verify admin user
        const adminUser = await User.findOne({ role: 'admin' });
        console.log(`   ✅ Admin user: ${adminUser ? adminUser.email : 'Not found'}`);
        
        // Check database indexes
        const listingIndexes = await Listing.collection.getIndexes();
        console.log(`   ✅ Database indexes: ${Object.keys(listingIndexes).length} indexes on Listing collection`);
        
        // Display setup summary
        console.log('\n' + '='.repeat(60));
        console.log('🎉 MARKETPLACE SETUP COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));
        
        console.log('\n📊 Setup Summary:');
        console.log(`   • Categories: ${categories.length} active`);
        categories.forEach(cat => {
            console.log(`     ${cat.icon} ${cat.name} (${cat.slug})`);
        });
        
        console.log(`\n   • Admin User: ${adminUser.email}`);
        console.log('     Password: admin123 (change after first login)');
        
        console.log(`\n   • Database: Optimized with ${Object.keys(listingIndexes).length} indexes`);
        
        console.log('\n🚀 Next Steps:');
        console.log('   1. Start the server: npm run dev');
        console.log('   2. Access admin panel: http://localhost:5173/admin');
        console.log('   3. Login with admin@genie.com / admin123');
        console.log('   4. Change admin password');
        console.log('   5. Start using the marketplace!');
        
        console.log('\n📚 Documentation:');
        console.log('   • API Documentation: /api/marketplace');
        console.log('   • Admin Features: Flag/delete listings, view statistics');
        console.log('   • User Features: Create listings, contact sellers, browse');
        
    } catch (error) {
        console.error('\n❌ Marketplace setup failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   • Check MongoDB connection');
        console.log('   • Verify environment variables in .env');
        console.log('   • Ensure all dependencies are installed');
        process.exit(1);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
    }
};

// Run the setup
setupMarketplace();