import mongoose from "mongoose";
import dotenv from "dotenv";
import Worker from "../models/Worker.js";

dotenv.config();

const approveWorker = async (email) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        const worker = await Worker.findOne({ email: email.toLowerCase() });
        
        if (!worker) {
            console.log("❌ Worker not found:", email);
            process.exit(1);
        }

        console.log(`📋 Worker found: ${worker.first_name} ${worker.last_name}`);
        console.log(`📧 Email: ${worker.email}`);
        console.log(`📱 Phone: ${worker.phone}`);
        console.log(`📊 Current Status: ${worker.status}`);
        
        if (worker.status === 'approved') {
            console.log("✅ Worker is already approved!");
            process.exit(0);
        }

        worker.status = 'approved';
        worker.approvedAt = new Date();
        await worker.save();

        console.log("\n✅ Worker approved successfully!");
        console.log(`🎉 ${worker.first_name} can now login`);

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\n✅ Disconnected from MongoDB");
    }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.log("❌ Please provide worker email");
    console.log("Usage: node scripts/approveWorker.js <email>");
    console.log("Example: node scripts/approveWorker.js rajesh.pandey@gmail.com");
    process.exit(1);
}

approveWorker(email);
