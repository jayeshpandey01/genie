# Genie Application Setup Guide

## Critical Issues Fixed

This document outlines the critical issues that were identified and resolved in the Genie application.

### Issues Resolved

1. **JWT Token Field Inconsistency** - Fixed authentication token payload structure
2. **Login Route Password Hashing Bug** - Removed incorrect password re-hashing
3. **Missing Environment Variables Validation** - Added startup validation
4. **Unprotected Admin Routes** - Added authentication middleware to all admin endpoints
5. **Razorpay Payment Status Mutation** - Fixed payment object mutation issue
6. **Missing Admin User Creation** - Added admin creation script
7. **Asset Path Issues** - Fixed incorrect public asset paths (bg.svg)

## Asset Path Fix

**Fixed:** `import bg from "../../public/bg.svg";` 
**To:** `import bg from "/bg.svg";`

In Vite, files in the `public` directory are served at the root path. Use `/filename.ext` instead of `/public/filename.ext`.

## Setup Instructions

### 1. Environment Variables

**Server (.env file created):**
```
PORT = 5000
CLIENT_URL = http://localhost:5173
NODE_ENV = development
MONGODB_URI = mongodb://localhost:27017/Genie
JWT_SECRET = your_jwt_secret_key_here_please_change_this_to_a_secure_random_string
RAZORPAY_KEY_SECRET = your_razorpay_secret_key_here
RAZORPAY_KEY_ID = your_razorpay_key_id_here
```

**Client (.env file created):**
```
VITE_PLACES_NEW_API_KEY = YOUR_GOOGLE_PLACES_API_KEY
VITE_BACKEND_URL = http://localhost:5000
VITE_RAZORPAY_KEY_ID = YOUR_RAZORPAY_KEY_ID
```

### 2. Required Actions

1. **Update JWT_SECRET**: Change the JWT_SECRET to a secure random string (at least 32 characters)
2. **Add Razorpay Keys**: Get your Razorpay API keys and update both server and client .env files
3. **Add Google Places API Key**: Get Google Places API key for location services
4. **Setup MongoDB**: Ensure MongoDB is running locally or update MONGODB_URI for cloud database

### 3. Create Admin User

Run the admin creation script:
```bash
cd server
node scripts/createAdmin.js
```

Default admin credentials:
- Email: admin@genie.com
- Password: admin123

**IMPORTANT**: Change the admin password after first login!

### 4. Install Dependencies

**Server:**
```bash
cd server
npm install
```

**Client:**
```bash
cd client
npm install
```

### 5. Start the Application

**Start Server (Development):**
```bash
cd server
npm run dev
```

**Start Client:**
```bash
cd client
npm run dev
```

## Testing Backend-Frontend Connectivity

### Method 1: Using Browser Console
1. Start both server and client
2. Open browser console (F12)
3. Run this command:
```javascript
// Test basic connectivity
fetch('http://localhost:5000/api/services')
  .then(response => response.json())
  .then(data => console.log('✅ Backend connected:', data))
  .catch(error => console.error('❌ Backend connection failed:', error));
```

### Method 2: Using Connectivity Test Component
A `ConnectivityTest` component has been created. To use it:

1. Temporarily add it to your App.jsx:
```jsx
import ConnectivityTest from './components/ConnectivityTest';

// Add this line in your component return:
<ConnectivityTest />
```

2. Or run the test programmatically:
```javascript
import { runConnectivityTest } from './utils/connectivityTest';
runConnectivityTest();
```

### Method 3: Manual API Testing
Test individual endpoints:
```bash
# Test services endpoint
curl http://localhost:5000/api/services

# Test with credentials
curl -X GET http://localhost:5000/api/services -H "Content-Type: application/json" --cookie-jar cookies.txt
```

## Common Connectivity Issues & Solutions

### 1. CORS Errors
**Symptoms:** Browser console shows CORS policy errors
**Solution:** 
- Ensure `CLIENT_URL` in server `.env` matches your frontend URL
- Check that server CORS is configured with `credentials: true`

### 2. Network Errors
**Symptoms:** "Network Error" or "ERR_CONNECTION_REFUSED"
**Solutions:**
- Verify server is running on port 5000
- Check `VITE_BACKEND_URL` in client `.env` is correct
- Ensure no firewall blocking the connection

### 3. Environment Variable Issues
**Symptoms:** API calls fail with undefined URLs
**Solutions:**
- Restart the client after changing `.env` files
- Verify environment variables are prefixed with `VITE_` for client
- Check that `.env` files are in the correct directories

### 4. Authentication Issues
**Symptoms:** 401/403 errors on API calls
**Solutions:**
- Ensure cookies are being sent with requests (`withCredentials: true`)
- Verify JWT_SECRET is the same in server `.env`
- Check that admin user exists (run createAdmin.js script)

## Security Notes

1. **Change Default Passwords**: The admin user is created with a default password. Change it immediately.
2. **Secure JWT Secret**: Use a strong, random JWT secret in production.
3. **Environment Variables**: Never commit .env files to version control.
4. **HTTPS in Production**: Use HTTPS in production and update CORS settings accordingly.

## Authentication Flow

The application now has proper authentication:
- All admin routes require admin authentication
- JWT tokens use consistent payload structure: `{ user: { _id: user._id } }`
- Password comparison works correctly without re-hashing

## Next Steps

1. Test the login/registration flow
2. Test admin panel access
3. Configure payment gateway with real Razorpay keys
4. Set up production database
5. Deploy with proper environment variables

## Troubleshooting Commands

```bash
# Check if server is running
curl http://localhost:5000/api/services

# Check server logs
cd server && npm run dev

# Check client build
cd client && npm run build

# Test MongoDB connection
cd server && node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Genie')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB failed:', err));
"
```