# 🔧 Troubleshooting Guide

Common issues and their solutions.

## 📋 Quick Diagnostics

Run this checklist first:

```bash
# 1. Check Node.js version
node --version
# Should be v16 or higher

# 2. Check MongoDB
mongosh
# Should connect without error

# 3. Check if ports are free
# Windows
netstat -ano | findstr :5000
netstat -ano | findstr :5173

# macOS/Linux
lsof -ti:5000
lsof -ti:5173

# 4. Check environment files exist
ls server/.env
ls client/.env
```

---

## 🐛 Common Issues

### 1. MongoDB Connection Failed

**Error:**
```
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**

#### Check if MongoDB is running
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

#### Test connection
```bash
mongosh
# Should connect successfully
```

#### Check connection string
```env
# server/.env
MONGODB_URI=mongodb://localhost:27017/Genie
```

#### Use MongoDB Atlas (cloud)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/Genie?retryWrites=true&w=majority
```

---

### 2. No Workers Showing

**Error:**
```
Workers: 0 found
No workers available nearby
```

**Solutions:**

#### Create sample workers
```bash
cd server
npm run create:sample-workers
```

#### Verify workers exist
```bash
mongosh
use Genie
db.workers.countDocuments()
# Should return 43
```

#### Check worker status
```bash
db.workers.countDocuments({ status: "approved" })
# Should return 43
```

#### Check worker locations
```bash
db.workers.countDocuments({
  "location.coordinates.lat": { $exists: true }
})
# Should return 43
```

#### If still no workers, delete and recreate
```bash
mongosh
use Genie
db.workers.deleteMany({})

cd server
npm run create:sample-workers
```

---

### 3. Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solutions:**

#### Windows
```bash
# Find process using port
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

#### macOS/Linux
```bash
# Find and kill process
lsof -ti:5000 | xargs kill -9

# Or use different port
# server/.env
PORT=5001
```

---

### 4. Frontend Not Loading

**Error:**
```
Failed to fetch
Network Error
```

**Solutions:**

#### Check backend is running
```bash
curl http://localhost:5000/api/workers/availability
# Should return JSON
```

#### Check CORS settings
```javascript
// server/server.js
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
```

#### Check environment variable
```env
# client/.env
VITE_BACKEND_URL=http://localhost:5000
```

#### Clear browser cache
```
Ctrl + Shift + Delete (Windows/Linux)
Cmd + Shift + Delete (macOS)
```

---

### 5. Payment Integration Issues

**Error:**
```
Razorpay is not defined
Payment verification failed
```

**Solutions:**

#### Check Razorpay keys
```env
# server/.env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# client/.env
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

#### Verify keys match
- Both should use test keys OR both use live keys
- Don't mix test and live keys

#### Check Razorpay script loaded
```html
<!-- client/index.html -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

#### Test in Razorpay dashboard
- Go to Razorpay Dashboard
- Check test payments
- Verify webhook settings

---

### 6. Google Places API Not Working

**Error:**
```
Google Places API error
InvalidKeyMapError
```

**Solutions:**

#### Check API key
```env
# client/.env
VITE_PLACES_NEW_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

#### Enable Places API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to APIs & Services → Library
4. Search "Places API"
5. Click Enable

#### Check billing
- Places API requires billing enabled
- Add payment method in Google Cloud Console

#### Restrict API key (optional)
- Go to Credentials
- Edit API key
- Add HTTP referrer: `http://localhost:5173/*`

---

### 7. Worker Selection Not Working

**Error:**
```
Service: 69a0459ed3bf9d679724be4d
⚠ No skill mapping found
```

**Solution:**

This is fixed! The issue was passing service._id instead of service.title.

#### Verify fix is applied
```javascript
// client/src/pages/Cart.jsx
<WorkerSelection
    serviceId={service.title}  // ✅ Should be title
    // NOT service._id
/>
```

#### Check server logs
```
Service: Intensive Bathroom Cleaning
✓ Mapped "Intensive Bathroom Cleaning" → "Cleaning"
Found 5 workers
```

---

### 8. Images Not Loading

**Error:**
```
404 Not Found
Failed to load resource
```

**Solutions:**

#### Check uploads directory exists
```bash
ls server/uploads
# Should exist
```

#### Create if missing
```bash
mkdir server/uploads
```

#### Check file permissions
```bash
# macOS/Linux
chmod 755 server/uploads
```

#### Check image path
```javascript
// Should be:
`${import.meta.env.VITE_BACKEND_URL}/${service.image}`

// NOT:
`/${service.image}`
```

---

### 9. Authentication Issues

**Error:**
```
Unauthorized
Token expired
Invalid token
```

**Solutions:**

#### Check JWT secret
```env
# server/.env
JWT_SECRET=your_secret_key_minimum_32_characters
```

#### Clear cookies
```javascript
// In browser console
document.cookie.split(";").forEach(c => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
```

#### Re-login
- Logout
- Clear browser cache
- Login again

---

### 10. Build Errors

**Error:**
```
Module not found
Cannot find module
```

**Solutions:**

#### Clean install
```bash
# Backend
cd server
rm -rf node_modules package-lock.json
npm install

# Frontend
cd client
rm -rf node_modules package-lock.json
npm install
```

#### Check Node version
```bash
node --version
# Should be v16 or higher
```

#### Update dependencies
```bash
npm update
```

---

## 🔍 Debug Mode

### Enable Detailed Logging

#### Backend
```env
# server/.env
NODE_ENV=development
```

#### Frontend
```javascript
// Add to component
console.log('Debug:', data);
```

### Check Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by XHR/Fetch
4. Check request/response

### Check Console Errors

1. Open DevTools (F12)
2. Go to Console tab
3. Look for red errors
4. Read error messages

---

## 📊 Health Checks

### Backend Health
```bash
curl http://localhost:5000/api/workers/availability
```

**Expected:**
```json
{
  "success": true,
  "availability": [...],
  "totalWorkers": 43
}
```

### Database Health
```bash
mongosh
use Genie
db.stats()
```

### Frontend Health
```bash
curl http://localhost:5173
# Should return HTML
```

---

## 🆘 Still Having Issues?

### Collect Information

1. **Error message** - Full error text
2. **Console logs** - Backend and frontend
3. **Network tab** - Failed requests
4. **Environment** - OS, Node version, MongoDB version
5. **Steps to reproduce** - What you did before error

### Check Documentation

- [README.md](./README.md) - Full documentation
- [QUICK_SETUP.md](./QUICK_SETUP.md) - Setup guide
- [DEBUG_WORKERS.md](./DEBUG_WORKERS.md) - Worker debugging

### Reset Everything

Nuclear option - start fresh:

```bash
# 1. Stop all servers
# Ctrl+C in all terminals

# 2. Delete node_modules
rm -rf server/node_modules client/node_modules

# 3. Delete database
mongosh
use Genie
db.dropDatabase()

# 4. Reinstall
cd server && npm install
cd ../client && npm install

# 5. Recreate data
cd server
npm run create:sample-workers

# 6. Restart servers
npm start  # Terminal 1
cd ../client && npm run dev  # Terminal 2
```

---

## ✅ Verification Checklist

After fixing issues, verify:

- [ ] MongoDB connected
- [ ] Backend running (port 5000)
- [ ] Frontend running (port 5173)
- [ ] Workers exist in database (43)
- [ ] Can browse services
- [ ] Can add to cart
- [ ] Can select workers
- [ ] Can complete payment
- [ ] No console errors

---

## 📞 Get Help

If you're still stuck:

1. Check [GitHub Issues](https://github.com/yourusername/genie/issues)
2. Create new issue with details
3. Join community Slack/Discord
4. Email support@genie.com

---

**Remember:** Most issues are environment-related. Double-check your .env files! 🔑
