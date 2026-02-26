// Server startup test script
import dotenv from "dotenv";
import mongoose from "mongoose";

// Load environment variables
dotenv.config();

console.log("🔍 Testing Server Configuration...\n");

// Test 1: Environment Variables
console.log("1. Environment Variables:");
const requiredEnvVars = ['JWT_SECRET', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'MONGODB_URI', 'CLIENT_URL'];
let envIssues = 0;

requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (value) {
        console.log(`   ✅ ${envVar}: ${envVar.includes('SECRET') ? '[HIDDEN]' : value}`);
    } else {
        console.log(`   ❌ ${envVar}: NOT SET`);
        envIssues++;
    }
});

if (envIssues > 0) {
    console.log(`\n⚠️  ${envIssues} environment variables are missing!`);
} else {
    console.log("\n✅ All environment variables are set");
}

// Test 2: MongoDB Connection
console.log("\n2. MongoDB Connection:");
try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/Genie");
    console.log("   ✅ MongoDB connected successfully");
    
    // Test database operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`   ✅ Database accessible, ${collections.length} collections found`);
    
    await mongoose.disconnect();
    console.log("   ✅ MongoDB disconnected cleanly");
} catch (error) {
    console.log(`   ❌ MongoDB connection failed: ${error.message}`);
}

// Test 3: Port Availability
console.log("\n3. Port Availability:");
const PORT = process.env.PORT || 5000;
try {
    const net = await import('net');
    const server = net.createServer();
    
    await new Promise((resolve, reject) => {
        server.listen(PORT, () => {
            console.log(`   ✅ Port ${PORT} is available`);
            server.close(resolve);
        });
        server.on('error', reject);
    });
} catch (error) {
    console.log(`   ❌ Port ${PORT} is not available: ${error.message}`);
}

// Test 4: Route File Imports
console.log("\n4. Route File Imports:");
const routeFiles = [
    './routes/users.js',
    './routes/services.js',
    './routes/razorpay.js',
    './routes/auth.js',
    './routes/AdminServices.js',
    './routes/AdminDashboard.js',
    './routes/AdminServicesRouter.js',
    './routes/AdminBookings.js'
];

for (const routeFile of routeFiles) {
    try {
        await import(routeFile);
        console.log(`   ✅ ${routeFile}`);
    } catch (error) {
        console.log(`   ❌ ${routeFile}: ${error.message}`);
    }
}

console.log("\n🎯 Server Configuration Test Complete!");
console.log("\nTo start the server:");
console.log("   npm run dev    (development with auto-restart)");
console.log("   npm start      (production)");

process.exit(0);