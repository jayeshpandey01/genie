import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Worker from '../models/Worker.js';

dotenv.config();

// Sample locations - Comprehensive Mumbai coverage
const sampleLocations = [
    // Mumbai - Western Suburbs
    { city: 'Mumbai', area: 'Andheri West', lat: 19.1136, lng: 72.8697 },
    { city: 'Mumbai', area: 'Andheri East', lat: 19.1197, lng: 72.8694 },
    { city: 'Mumbai', area: 'Bandra West', lat: 19.0596, lng: 72.8295 },
    { city: 'Mumbai', area: 'Bandra East', lat: 19.0544, lng: 72.8406 },
    { city: 'Mumbai', area: 'Juhu', lat: 19.1075, lng: 72.8263 },
    { city: 'Mumbai', area: 'Versova', lat: 19.1318, lng: 72.8118 },
    { city: 'Mumbai', area: 'Goregaon West', lat: 19.1663, lng: 72.8526 },
    { city: 'Mumbai', area: 'Goregaon East', lat: 19.1546, lng: 72.8638 },
    { city: 'Mumbai', area: 'Malad West', lat: 19.1864, lng: 72.8481 },
    { city: 'Mumbai', area: 'Malad East', lat: 19.1858, lng: 72.8489 },
    { city: 'Mumbai', area: 'Kandivali West', lat: 19.2074, lng: 72.8320 },
    { city: 'Mumbai', area: 'Kandivali East', lat: 19.2095, lng: 72.8634 },
    { city: 'Mumbai', area: 'Borivali West', lat: 19.2403, lng: 72.8565 },
    { city: 'Mumbai', area: 'Borivali East', lat: 19.2403, lng: 72.8565 },
    { city: 'Mumbai', area: 'Dahisar', lat: 19.2544, lng: 72.8622 },
    
    // Mumbai - Central & South
    { city: 'Mumbai', area: 'Powai', lat: 19.1176, lng: 72.9060 },
    { city: 'Mumbai', area: 'Kurla', lat: 19.0728, lng: 72.8826 },
    { city: 'Mumbai', area: 'Ghatkopar', lat: 19.0860, lng: 72.9081 },
    { city: 'Mumbai', area: 'Vikhroli', lat: 19.1095, lng: 72.9250 },
    { city: 'Mumbai', area: 'Mulund', lat: 19.1722, lng: 72.9565 },
    { city: 'Mumbai', area: 'Dadar', lat: 19.0176, lng: 72.8479 },
    { city: 'Mumbai', area: 'Matunga', lat: 19.0270, lng: 72.8570 },
    { city: 'Mumbai', area: 'Sion', lat: 19.0433, lng: 72.8626 },
    { city: 'Mumbai', area: 'Chembur', lat: 19.0633, lng: 72.8997 },
    { city: 'Mumbai', area: 'Lower Parel', lat: 18.9975, lng: 72.8305 },
    { city: 'Mumbai', area: 'Worli', lat: 19.0176, lng: 72.8170 },
    { city: 'Mumbai', area: 'Colaba', lat: 18.9067, lng: 72.8147 },
    { city: 'Mumbai', area: 'Fort', lat: 18.9401, lng: 72.8350 },
    { city: 'Mumbai', area: 'Marine Lines', lat: 18.9432, lng: 72.8231 },
    
    // Mumbai - Extended Areas
    { city: 'Mumbai', area: 'Thane West', lat: 19.2183, lng: 72.9781 },
    { city: 'Mumbai', area: 'Thane East', lat: 19.2183, lng: 72.9781 },
    { city: 'Mumbai', area: 'Navi Mumbai - Vashi', lat: 19.0768, lng: 72.9989 },
    { city: 'Mumbai', area: 'Navi Mumbai - Nerul', lat: 19.0330, lng: 73.0297 },
    { city: 'Mumbai', area: 'Navi Mumbai - Kharghar', lat: 19.0433, lng: 73.0673 },
    { city: 'Mumbai', area: 'Navi Mumbai - Panvel', lat: 18.9894, lng: 73.1175 },
    
    // Delhi (keeping some for variety)
    { city: 'Delhi', area: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
    { city: 'Delhi', area: 'Dwarka', lat: 28.5921, lng: 77.0460 },
    { city: 'Delhi', area: 'Rohini', lat: 28.7495, lng: 77.0736 },
    
    // Bangalore (keeping some for variety)
    { city: 'Bangalore', area: 'Koramangala', lat: 12.9352, lng: 77.6245 },
    { city: 'Bangalore', area: 'Whitefield', lat: 12.9698, lng: 77.7499 },
];

// Sample worker data - Expanded Mumbai workers
const sampleWorkers = [
    // Plumbers
    { first_name: 'Rajesh', last_name: 'Kumar', email: 'rajesh.kumar@example.com', phone: '+919876543210', skills: [{ serviceName: 'Plumbing', experienceYears: 5, description: 'Expert in residential plumbing' }], profile: { bio: 'Experienced plumber with 5+ years' } },
    { first_name: 'Deepak', last_name: 'Verma', email: 'deepak.verma@example.com', phone: '+919876543216', skills: [{ serviceName: 'Plumbing', experienceYears: 10, description: 'Senior plumber' }], profile: { bio: 'Senior plumber with 10+ years' } },
    { first_name: 'Suresh', last_name: 'Patil', email: 'suresh.patil@example.com', phone: '+919876543220', skills: [{ serviceName: 'Plumbing', experienceYears: 7, description: 'Commercial plumbing expert' }], profile: { bio: 'Commercial plumbing specialist' } },
    { first_name: 'Ramesh', last_name: 'Yadav', email: 'ramesh.yadav@example.com', phone: '+919876543221', skills: [{ serviceName: 'Plumbing', experienceYears: 6, description: 'Leak detection specialist' }], profile: { bio: 'Expert in leak detection and repair' } },
    { first_name: 'Ganesh', last_name: 'Sawant', email: 'ganesh.sawant@example.com', phone: '+919876543222', skills: [{ serviceName: 'Plumbing', experienceYears: 8, description: 'Bathroom fitting expert' }], profile: { bio: 'Specialist in bathroom installations' } },
    
    // Electricians
    { first_name: 'Amit', last_name: 'Sharma', email: 'amit.sharma@example.com', phone: '+919876543211', skills: [{ serviceName: 'Electrical', experienceYears: 7, description: 'Licensed electrician' }], profile: { bio: 'Certified electrician' } },
    { first_name: 'Vijay', last_name: 'Mehta', email: 'vijay.mehta@example.com', phone: '+919876543223', skills: [{ serviceName: 'Electrical', experienceYears: 9, description: 'Industrial electrician' }], profile: { bio: 'Industrial electrical expert' } },
    { first_name: 'Anil', last_name: 'Joshi', email: 'anil.joshi@example.com', phone: '+919876543224', skills: [{ serviceName: 'Electrical', experienceYears: 5, description: 'Home automation specialist' }], profile: { bio: 'Smart home installation expert' } },
    { first_name: 'Prakash', last_name: 'Deshmukh', email: 'prakash.deshmukh@example.com', phone: '+919876543225', skills: [{ serviceName: 'Electrical', experienceYears: 12, description: 'Master electrician' }], profile: { bio: 'Master electrician with 12+ years' } },
    { first_name: 'Sanjay', last_name: 'Kulkarni', email: 'sanjay.kulkarni@example.com', phone: '+919876543226', skills: [{ serviceName: 'Electrical', experienceYears: 6, description: 'Wiring specialist' }], profile: { bio: 'Expert in electrical wiring' } },
    
    // Cleaning Services
    { first_name: 'Priya', last_name: 'Patel', email: 'priya.patel@example.com', phone: '+919876543212', skills: [{ serviceName: 'Cleaning', experienceYears: 4, description: 'Professional house cleaning' }], profile: { bio: 'Professional cleaner' } },
    { first_name: 'Sunita', last_name: 'Rane', email: 'sunita.rane@example.com', phone: '+919876543227', skills: [{ serviceName: 'Cleaning', experienceYears: 5, description: 'Deep cleaning specialist' }], profile: { bio: 'Deep cleaning expert' } },
    { first_name: 'Rekha', last_name: 'Naik', email: 'rekha.naik@example.com', phone: '+919876543228', skills: [{ serviceName: 'Cleaning', experienceYears: 3, description: 'Office cleaning' }], profile: { bio: 'Office cleaning specialist' } },
    { first_name: 'Meena', last_name: 'Shinde', email: 'meena.shinde@example.com', phone: '+919876543229', skills: [{ serviceName: 'Cleaning', experienceYears: 6, description: 'Carpet cleaning expert' }], profile: { bio: 'Carpet and upholstery cleaning' } },
    { first_name: 'Lata', last_name: 'Pawar', email: 'lata.pawar@example.com', phone: '+919876543230', skills: [{ serviceName: 'Cleaning', experienceYears: 4, description: 'Kitchen cleaning specialist' }], profile: { bio: 'Kitchen deep cleaning expert' } },
    
    // Carpenters
    { first_name: 'Vikram', last_name: 'Singh', email: 'vikram.singh@example.com', phone: '+919876543213', skills: [{ serviceName: 'Carpentry', experienceYears: 8, description: 'Custom furniture' }], profile: { bio: 'Master carpenter' } },
    { first_name: 'Mahesh', last_name: 'Kamble', email: 'mahesh.kamble@example.com', phone: '+919876543231', skills: [{ serviceName: 'Carpentry', experienceYears: 10, description: 'Furniture repair expert' }], profile: { bio: 'Furniture repair specialist' } },
    { first_name: 'Santosh', last_name: 'Gaikwad', email: 'santosh.gaikwad@example.com', phone: '+919876543232', skills: [{ serviceName: 'Carpentry', experienceYears: 7, description: 'Modular kitchen expert' }], profile: { bio: 'Modular kitchen specialist' } },
    { first_name: 'Dinesh', last_name: 'Bhosale', email: 'dinesh.bhosale@example.com', phone: '+919876543233', skills: [{ serviceName: 'Carpentry', experienceYears: 9, description: 'Wooden flooring' }], profile: { bio: 'Wooden flooring expert' } },
    { first_name: 'Ashok', last_name: 'Jadhav', email: 'ashok.jadhav@example.com', phone: '+919876543234', skills: [{ serviceName: 'Carpentry', experienceYears: 11, description: 'Custom wardrobes' }], profile: { bio: 'Custom wardrobe specialist' } },
    
    // Painters
    { first_name: 'Sunita', last_name: 'Reddy', email: 'sunita.reddy@example.com', phone: '+919876543214', skills: [{ serviceName: 'Painting', experienceYears: 6, description: 'Interior painting' }], profile: { bio: 'Professional painter' } },
    { first_name: 'Kiran', last_name: 'More', email: 'kiran.more@example.com', phone: '+919876543235', skills: [{ serviceName: 'Painting', experienceYears: 8, description: 'Exterior painting expert' }], profile: { bio: 'Exterior painting specialist' } },
    { first_name: 'Sachin', last_name: 'Parab', email: 'sachin.parab@example.com', phone: '+919876543236', skills: [{ serviceName: 'Painting', experienceYears: 5, description: 'Texture painting' }], profile: { bio: 'Texture painting expert' } },
    { first_name: 'Nitin', last_name: 'Salvi', email: 'nitin.salvi@example.com', phone: '+919876543237', skills: [{ serviceName: 'Painting', experienceYears: 7, description: 'Waterproofing specialist' }], profile: { bio: 'Waterproofing and painting' } },
    { first_name: 'Rahul', last_name: 'Ghadi', email: 'rahul.ghadi@example.com', phone: '+919876543238', skills: [{ serviceName: 'Painting', experienceYears: 9, description: 'Commercial painting' }], profile: { bio: 'Commercial painting expert' } },
    
    // AC & Appliance Repair
    { first_name: 'Mohammed', last_name: 'Ali', email: 'mohammed.ali@example.com', phone: '+919876543215', skills: [{ serviceName: 'AC Repair', experienceYears: 5, description: 'All brands AC service' }], profile: { bio: 'AC repair specialist' } },
    { first_name: 'Arif', last_name: 'Khan', email: 'arif.khan@example.com', phone: '+919876543239', skills: [{ serviceName: 'AC Repair', experienceYears: 7, description: 'Split AC expert' }], profile: { bio: 'Split AC installation expert' } },
    { first_name: 'Salman', last_name: 'Sheikh', email: 'salman.sheikh@example.com', phone: '+919876543240', skills: [{ serviceName: 'Refrigerator Repair', experienceYears: 6, description: 'Fridge repair' }], profile: { bio: 'Refrigerator repair expert' } },
    { first_name: 'Imran', last_name: 'Ansari', email: 'imran.ansari@example.com', phone: '+919876543241', skills: [{ serviceName: 'Washing Machine Repair', experienceYears: 5, description: 'Washing machine expert' }], profile: { bio: 'Washing machine specialist' } },
    { first_name: 'Farhan', last_name: 'Qureshi', email: 'farhan.qureshi@example.com', phone: '+919876543242', skills: [{ serviceName: 'Microwave Repair', experienceYears: 4, description: 'Microwave repair' }], profile: { bio: 'Microwave repair expert' } },
    
    // Beauty & Salon
    { first_name: 'Anjali', last_name: 'Desai', email: 'anjali.desai@example.com', phone: '+919876543217', skills: [{ serviceName: 'Beauty Services', experienceYears: 5, description: 'Professional beautician' }], profile: { bio: 'Certified beautician' } },
    { first_name: 'Pooja', last_name: 'Iyer', email: 'pooja.iyer@example.com', phone: '+919876543243', skills: [{ serviceName: 'Beauty Services', experienceYears: 6, description: 'Bridal makeup artist' }], profile: { bio: 'Bridal makeup specialist' } },
    { first_name: 'Neha', last_name: 'Kapoor', email: 'neha.kapoor@example.com', phone: '+919876543244', skills: [{ serviceName: 'Beauty Services', experienceYears: 4, description: 'Hair styling expert' }], profile: { bio: 'Hair styling specialist' } },
    { first_name: 'Shruti', last_name: 'Menon', email: 'shruti.menon@example.com', phone: '+919876543245', skills: [{ serviceName: 'Beauty Services', experienceYears: 7, description: 'Spa therapist' }], profile: { bio: 'Spa and massage therapist' } },
    
    // Gardening & Landscaping
    { first_name: 'Ravi', last_name: 'Nair', email: 'ravi.nair@example.com', phone: '+919876543218', skills: [{ serviceName: 'Gardening', experienceYears: 6, description: 'Landscape expert' }], profile: { bio: 'Expert gardener' } },
    { first_name: 'Mohan', last_name: 'Pillai', email: 'mohan.pillai@example.com', phone: '+919876543246', skills: [{ serviceName: 'Gardening', experienceYears: 8, description: 'Terrace garden specialist' }], profile: { bio: 'Terrace garden expert' } },
    { first_name: 'Krishna', last_name: 'Nambiar', email: 'krishna.nambiar@example.com', phone: '+919876543247', skills: [{ serviceName: 'Gardening', experienceYears: 5, description: 'Plant care expert' }], profile: { bio: 'Plant care specialist' } },
    
    // Pest Control
    { first_name: 'Sunil', last_name: 'Thakur', email: 'sunil.thakur@example.com', phone: '+919876543248', skills: [{ serviceName: 'Pest Control', experienceYears: 7, description: 'Termite control expert' }], profile: { bio: 'Termite control specialist' } },
    { first_name: 'Manoj', last_name: 'Gupta', email: 'manoj.gupta@example.com', phone: '+919876543249', skills: [{ serviceName: 'Pest Control', experienceYears: 5, description: 'Rodent control' }], profile: { bio: 'Rodent control expert' } },
    { first_name: 'Ajay', last_name: 'Mishra', email: 'ajay.mishra@example.com', phone: '+919876543250', skills: [{ serviceName: 'Pest Control', experienceYears: 6, description: 'Eco-friendly pest control' }], profile: { bio: 'Eco-friendly pest solutions' } },
    
    // Tutoring
    { first_name: 'Kavita', last_name: 'Joshi', email: 'kavita.joshi@example.com', phone: '+919876543219', skills: [{ serviceName: 'Tutoring', experienceYears: 8, description: 'Math and Science' }], profile: { bio: 'Math and Science tutor' } },
    { first_name: 'Pradeep', last_name: 'Rao', email: 'pradeep.rao@example.com', phone: '+919876543251', skills: [{ serviceName: 'Tutoring', experienceYears: 10, description: 'English tutor' }], profile: { bio: 'English language expert' } },
    { first_name: 'Smita', last_name: 'Bhat', email: 'smita.bhat@example.com', phone: '+919876543252', skills: [{ serviceName: 'Tutoring', experienceYears: 7, description: 'Computer science tutor' }], profile: { bio: 'Computer science teacher' } },
];

async function createSampleWorkers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // Create workers
        const workersToCreate = [];
        
        for (let i = 0; i < sampleWorkers.length; i++) {
            const workerData = sampleWorkers[i];
            const location = sampleLocations[i % sampleLocations.length];
            
            // Check if worker already exists
            const existingWorker = await Worker.findOne({ email: workerData.email });
            if (existingWorker) {
                console.log(`Worker ${workerData.email} already exists, skipping...`);
                continue;
            }

            workersToCreate.push({
                ...workerData,
                password: hashedPassword,
                role: 'worker',
                status: 'approved', // Pre-approved for testing
                location: {
                    area: location.area,
                    city: location.city,
                    state: location.city === 'Mumbai' ? 'Maharashtra' : 
                           location.city === 'Delhi' ? 'Delhi' : 'Karnataka',
                    formattedAddress: `${location.area}, ${location.city}`,
                    coordinates: {
                        lat: location.lat,
                        lng: location.lng
                    },
                    lastUpdated: new Date()
                },
                availability: {
                    status: 'available',
                    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                    workingHours: {
                        start: '09:00',
                        end: '18:00'
                    }
                },
                stats: {
                    totalJobsCompleted: Math.floor(Math.random() * 100) + 20,
                    totalJobsAssigned: Math.floor(Math.random() * 120) + 30,
                    rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5 to 5.0
                    totalRatings: Math.floor(Math.random() * 150) + 50,
                    totalEarnings: Math.floor(Math.random() * 100000) + 50000
                },
                createdAt: new Date(),
                approvedAt: new Date()
            });
        }

        if (workersToCreate.length > 0) {
            const result = await Worker.insertMany(workersToCreate);
            console.log(`\n✅ Successfully created ${result.length} sample workers!`);
            
            console.log('\n📋 Sample Worker Credentials:');
            console.log('Email: Any of the above emails');
            console.log('Password: password123');
            console.log('\nWorkers created:');
            result.forEach(worker => {
                console.log(`- ${worker.first_name} ${worker.last_name} (${worker.email}) - ${worker.location.city}`);
            });
        } else {
            console.log('\n⚠️  All workers already exist in database');
        }

        // Disconnect
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Error creating sample workers:', error);
        process.exit(1);
    }
}

// Run the script
createSampleWorkers();
