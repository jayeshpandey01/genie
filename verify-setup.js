#!/usr/bin/env node

const http = require('http');

console.log('🔍 Verifying Worker Selection Setup...\n');

// Test 1: Check if backend is running
function testBackend() {
    return new Promise((resolve) => {
        console.log('1️⃣  Testing backend connection...');
        const req = http.get('http://localhost:5000/api/workers/nearby?lat=19.0760&lng=72.8777&radius=100', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.success && json.count > 0) {
                        console.log(`   ✅ Backend is running`);
                        console.log(`   ✅ Found ${json.count} workers\n`);
                        resolve(true);
                    } else {
                        console.log(`   ⚠️  Backend running but no workers found`);
                        console.log(`   Response: ${JSON.stringify(json, null, 2)}\n`);
                        resolve(false);
                    }
                } catch (e) {
                    console.log(`   ❌ Invalid response from backend`);
                    console.log(`   Error: ${e.message}\n`);
                    resolve(false);
                }
            });
        });
        
        req.on('error', (e) => {
            console.log(`   ❌ Backend not running`);
            console.log(`   Error: ${e.message}`);
            console.log(`   💡 Start backend: cd server && npm start\n`);
            resolve(false);
        });
        
        req.setTimeout(5000, () => {
            console.log(`   ❌ Backend timeout`);
            console.log(`   💡 Check if server is running on port 5000\n`);
            req.destroy();
            resolve(false);
        });
    });
}

// Test 2: Check if frontend is running
function testFrontend() {
    return new Promise((resolve) => {
        console.log('2️⃣  Testing frontend connection...');
        const req = http.get('http://localhost:5173', (res) => {
            if (res.statusCode === 200) {
                console.log(`   ✅ Frontend is running\n`);
                resolve(true);
            } else {
                console.log(`   ⚠️  Frontend returned status ${res.statusCode}\n`);
                resolve(false);
            }
        });
        
        req.on('error', (e) => {
            console.log(`   ❌ Frontend not running`);
            console.log(`   Error: ${e.message}`);
            console.log(`   💡 Start frontend: cd client && npm run dev\n`);
            resolve(false);
        });
        
        req.setTimeout(5000, () => {
            console.log(`   ❌ Frontend timeout\n`);
            req.destroy();
            resolve(false);
        });
    });
}

// Main
async function main() {
    const backendOk = await testBackend();
    const frontendOk = await testFrontend();
    
    console.log('📊 Summary:');
    console.log('─'.repeat(50));
    console.log(`Backend:  ${backendOk ? '✅ OK' : '❌ NOT RUNNING'}`);
    console.log(`Frontend: ${frontendOk ? '✅ OK' : '❌ NOT RUNNING'}`);
    console.log('─'.repeat(50));
    
    if (backendOk && frontendOk) {
        console.log('\n🎉 Everything is set up correctly!');
        console.log('\n📝 Next steps:');
        console.log('   1. Open http://localhost:5173');
        console.log('   2. Login to your account');
        console.log('   3. Add a service to cart');
        console.log('   4. Go to cart and click "Select Workers"');
        console.log('   5. Click "Set Location" and choose "Mumbai"');
        console.log('   6. You should see workers!\n');
    } else {
        console.log('\n⚠️  Setup incomplete. Please fix the issues above.\n');
        
        if (!backendOk) {
            console.log('🔧 To fix backend:');
            console.log('   cd server');
            console.log('   npm start\n');
        }
        
        if (!frontendOk) {
            console.log('🔧 To fix frontend:');
            console.log('   cd client');
            console.log('   npm run dev\n');
        }
    }
    
    process.exit(backendOk && frontendOk ? 0 : 1);
}

main();
