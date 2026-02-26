import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

// Load environment variables
dotenv.config();

const resetAdminUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/Genie");
        console.log("Connected to MongoDB");

        // Delete existing admin user
        const deletedAdmin = await User.findOneAndDelete({ role: "admin" });
        if (deletedAdmin) {
            console.log("Existing admin user deleted:", deletedAdmin.email);
        } else {
            console.log("No existing admin user found");
        }

        // Create new admin user
        const adminData = {
            first_name: "Admin",
            last_name: "User",
            email: "admin@genie.com",
            phone: "1234567890",
            password: "admin123", // This will be hashed by the User model pre-save hook
            role: "admin"
        };

        // Create and save admin user (password will be hashed automatically by pre-save hook)
        const adminUser = new User(adminData);
        await adminUser.save();

        console.log("✅ New admin user created successfully!");
        console.log("📧 Email: admin@genie.com");
        console.log("🔑 Password: admin123");
        console.log("⚠️  Please change the password after first login!");

        // Test the password by comparing
        const testUser = await User.findOne({ email: "admin@genie.com" });
        const isPasswordCorrect = await testUser.comparePassword("admin123");
        console.log("🧪 Password test:", isPasswordCorrect ? "✅ PASS" : "❌ FAIL");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error resetting admin user:", error);
        process.exit(1);
    }
};

resetAdminUser();