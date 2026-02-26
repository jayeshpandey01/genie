import mongoose from "mongoose";
import dotenv from "dotenv";
import Service from "../models/Service.js";
import ServiceDetail from "../models/ServiceDetail.js";
import User from "../models/User.js";
import { servicesData } from "../data/servicesData.js";

// Load environment variables
dotenv.config();

const setupDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/Genie");
        console.log("✅ Connected to MongoDB");

        console.log("\n🗄️  Setting up database...");

        // 1. Setup Services
        console.log("\n1️⃣  Setting up Services...");
        await Service.deleteMany({});
        
        const servicesWithOrder = servicesData.map((service, index) => ({
            ...service,
            order: index,
        }));
        
        const insertedServices = await Service.insertMany(servicesWithOrder);
        console.log(`✅ ${insertedServices.length} services inserted`);
        
        // List inserted services
        insertedServices.forEach(service => {
            console.log(`   📋 ${service.serviceName} (Order: ${service.order})`);
        });

        // 2. Setup Admin User
        console.log("\n2️⃣  Setting up Admin User...");
        
        // Delete existing admin
        const deletedAdmin = await User.findOneAndDelete({ role: "admin" });
        if (deletedAdmin) {
            console.log("   🗑️  Deleted existing admin user");
        }

        // Create new admin user
        const adminData = {
            first_name: "Admin",
            last_name: "User",
            email: "admin@genie.com",
            phone: "1234567890",
            password: "admin123",
            role: "admin"
        };

        const adminUser = new User(adminData);
        await adminUser.save();
        console.log("✅ Admin user created");

        // Test admin password
        const testUser = await User.findOne({ email: "admin@genie.com" });
        const isPasswordCorrect = await testUser.comparePassword("admin123");
        console.log(`   🧪 Password test: ${isPasswordCorrect ? "✅ PASS" : "❌ FAIL"}`);

        // 3. Test Services API
        console.log("\n3️⃣  Testing Services API...");
        const allServices = await Service.find();
        console.log(`✅ Found ${allServices.length} services in database`);

        if (allServices.length > 0) {
            console.log("   📋 Available services:");
            allServices.forEach(service => {
                console.log(`      • ${service.serviceName}`);
                console.log(`        Image: ${service.serviceImage}`);
                console.log(`        Order: ${service.order}`);
            });
        }

        // 4. Database Statistics
        console.log("\n📊 Database Statistics:");
        const serviceCount = await Service.countDocuments();
        const serviceDetailCount = await ServiceDetail.countDocuments();
        const userCount = await User.countDocuments();
        const adminCount = await User.countDocuments({ role: "admin" });

        console.log(`   Services: ${serviceCount}`);
        console.log(`   Service Details: ${serviceDetailCount}`);
        console.log(`   Users: ${userCount}`);
        console.log(`   Admins: ${adminCount}`);

        console.log("\n🎉 Database setup complete!");
        console.log("\n📝 Next steps:");
        console.log("   1. Start the server: npm run dev");
        console.log("   2. Test services endpoint: curl http://localhost:5000/api/services");
        console.log("   3. Login with admin@genie.com / admin123");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error setting up database:", error);
        process.exit(1);
    }
};

setupDatabase();