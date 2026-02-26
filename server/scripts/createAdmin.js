import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";

// Load environment variables
dotenv.config();

const createAdminUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/Genie");
        console.log("Connected to MongoDB");

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: "admin" });
        if (existingAdmin) {
            console.log("Admin user already exists:", existingAdmin.email);
            
            // Ensure admin has marketplace profile
            if (!existingAdmin.marketplaceProfile) {
                existingAdmin.marketplaceProfile = {
                    rating: 5.0,
                    totalRatings: 0,
                    totalListings: 0,
                    totalSales: 0,
                    favoriteListings: []
                };
                await existingAdmin.save();
                console.log("✅ Added marketplace profile to existing admin");
            }
            
            process.exit(0);
        }

        // Create admin user
        const adminData = {
            first_name: "Admin",
            last_name: "User",
            email: "admin@genie.com",
            phone: "1234567890",
            password: "admin123", // This will be hashed by the User model pre-save hook
            role: "admin",
            marketplaceProfile: {
                rating: 5.0,
                totalRatings: 0,
                totalListings: 0,
                totalSales: 0,
                favoriteListings: []
            }
        };

        // Create and save admin user (password will be hashed automatically by pre-save hook)
        const adminUser = new User(adminData);
        await adminUser.save();

        console.log("🎉 Admin user created successfully!");
        console.log("📧 Email: admin@genie.com");
        console.log("🔑 Password: admin123");
        console.log("⚠️  Please change the password after first login!");
        console.log("🛍️  Marketplace profile initialized");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating admin user:", error);
        process.exit(1);
    }
};

createAdminUser();