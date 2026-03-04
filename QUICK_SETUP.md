# ⚡ Quick Setup Guide - Genie

Get up and running in 5 minutes!

## 📋 Prerequisites

- Node.js (v16+)
- MongoDB (running)
- Git

## 🚀 Installation Steps

### 1. Clone & Install (2 minutes)

```bash
# Clone repository
git clone https://github.com/yourusername/genie.git
cd genie

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment (1 minute)

#### Backend (.env)
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/Genie
JWT_SECRET=your_secret_key_change_this
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

#### Frontend (.env)
```bash
cd ../client
cp .env.example .env
```

Edit `client/.env`:
```env
VITE_BACKEND_URL=http://localhost:5000
VITE_PLACES_NEW_API_KEY=your_google_api_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 3. Setup Database (1 minute)

```bash
# Start MongoDB (if not running)
mongosh

# Create sample workers
cd server
npm run create:sample-workers
```

### 4. Run Application (1 minute)

#### Terminal 1 - Backend
```bash
cd server
npm start
```

#### Terminal 2 - Frontend
```bash
cd client
npm run dev
```

### 5. Open Browser

Navigate to: **http://localhost:5173**

---

## ✅ Verification

### Check Backend
```bash
curl http://localhost:5000/api/workers/availability
```

Should return worker data.

### Check Frontend
1. Open http://localhost:5173
2. Should see homepage
3. Browse services
4. Add to cart
5. Select workers

---

## 🎯 Quick Commands

```bash
# Create sample workers
cd server && npm run create:sample-workers

# Create admin user
cd server && npm run create:admin

# Start backend
cd server && npm start

# Start frontend
cd client && npm run dev

# Check database
mongosh
use Genie
db.workers.countDocuments()
```

---

## 🐛 Quick Fixes

### No Workers Showing?
```bash
cd server
npm run create:sample-workers
```

### MongoDB Not Connected?
```bash
# Start MongoDB
mongosh

# Check connection
use Genie
show collections
```

### Port Already in Use?
```bash
# Kill process on port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

---

## 📚 Next Steps

1. Read full [README.md](./README.md)
2. Check [Worker Selection Guide](./WORKER_SELECTION_GUIDE.md)
3. Review [API Documentation](./README.md#api-documentation)
4. Test all features

---

## 🎉 You're Done!

The application should now be running:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

**Happy coding! 🚀**
