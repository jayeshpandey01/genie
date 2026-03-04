# 🧞 Genie - On-Demand Service Marketplace

A full-stack MERN application for booking on-demand services with worker selection, marketplace features, and integrated payment processing.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## ✨ Features

### Core Features
- 🏠 **Service Booking** - Browse and book various home services
- 👷 **Worker Selection** - Choose workers like Ola/Uber (distance-based, ratings, filters)
- 🛒 **Shopping Cart** - Add multiple services with quantity management
- 💳 **Payment Integration** - Razorpay for online payments + Cash on Delivery
- 🏪 **Marketplace** - Buy/sell/rent products and equipment
- 📍 **Location-Based Search** - Find workers within 100km radius
- ⭐ **Ratings & Reviews** - Worker ratings and customer feedback
- 📱 **Responsive Design** - Mobile-first, works on all devices

### User Features
- User authentication (Register/Login)
- Service browsing by categories
- Real-time worker availability
- Worker filtering (rating, distance, experience)
- Order tracking and history
- Profile management

### Worker Features
- Worker registration and approval system
- Location tracking
- Job assignment notifications
- Earnings dashboard
- Availability management
- Skills and experience showcase

### Admin Features
- Admin dashboard
- Service management
- Worker approval/management
- Booking oversight
- Marketplace moderation
- Analytics and reports

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Icons** - Icon library
- **Framer Motion** - Animations
- **Google Maps API** - Location services
- **Recharts** - Data visualization

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Razorpay** - Payment gateway
- **Multer** - File uploads
- **Helmet** - Security headers
- **Express Rate Limit** - API rate limiting

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download](https://www.mongodb.com/try/download/community)
  - OR MongoDB Atlas account (cloud database)
- **npm** or **yarn** - Package manager (comes with Node.js)
- **Git** - Version control

### Optional but Recommended
- **MongoDB Compass** - GUI for MongoDB
- **Postman** - API testing
- **VS Code** - Code editor

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/genie.git
cd genie
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../client
npm install
```

---

## ⚙️ Configuration

### 1. Backend Environment Variables

Create `.env` file in the `server` directory:

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your configuration:

```env
# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/Genie
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/Genie?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# Rate Limiting (Optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### 2. Frontend Environment Variables

Create `.env` file in the `client` directory:

```bash
cd ../client
cp .env.example .env
```

Edit `client/.env`:

```env
# Backend API URL
VITE_BACKEND_URL=http://localhost:5000

# Google Places API (for location autocomplete)
VITE_PLACES_NEW_API_KEY=your_google_places_api_key

# Razorpay (for payment processing)
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 3. Get API Keys

#### Razorpay (Payment Gateway)
1. Sign up at [Razorpay](https://razorpay.com/)
2. Go to Settings → API Keys
3. Generate Test/Live keys
4. Copy Key ID and Key Secret

#### Google Places API (Location Services)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Places API"
4. Create credentials (API Key)
5. Copy the API key

---

## 🏃 Running the Application

### Option 1: Run Both Servers Separately

#### Terminal 1 - Backend Server
```bash
cd server
npm start
# Server runs on http://localhost:5000
```

#### Terminal 2 - Frontend Server
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

### Option 2: Development Mode with Auto-Reload

#### Backend (with nodemon)
```bash
cd server
npm run dev
```

#### Frontend (with Vite HMR)
```bash
cd client
npm run dev
```

### Option 3: Using the Startup Script

```bash
# From root directory
./start-marketplace.sh
```

---

## 🗂️ Project Structure

```
genie/
├── client/                      # Frontend React application
│   ├── public/                  # Static assets
│   │   ├── logo.png
│   │   ├── bg.svg
│   │   └── ...
│   ├── src/
│   │   ├── admin/              # Admin dashboard components
│   │   │   ├── Components/
│   │   │   └── Pages/
│   │   ├── assets/             # Images, icons, fonts
│   │   ├── components/         # Reusable components
│   │   │   ├── WorkerSelection.jsx
│   │   │   ├── ListingForm.jsx
│   │   │   ├── ServiceCart.jsx
│   │   │   └── ...
│   │   ├── context/            # React Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CartContext.jsx
│   │   │   ├── LocationContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── MarketplacePage.jsx
│   │   │   └── ...
│   │   ├── App.jsx             # Main app component
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Global styles
│   ├── .env.example            # Environment variables template
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                      # Backend Node.js application
│   ├── config/                 # Configuration files
│   ├── data/                   # Static data (services, categories)
│   ├── middleware/             # Express middleware
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── models/                 # MongoDB models
│   │   ├── User.js
│   │   ├── Worker.js
│   │   ├── Payment.js
│   │   ├── Listing.js
│   │   └── Service.js
│   ├── routes/                 # API routes
│   │   ├── auth.js
│   │   ├── workers.js
│   │   ├── bookings.js
│   │   ├── razorpay.js
│   │   ├── marketplace.js
│   │   └── ...
│   ├── scripts/                # Utility scripts
│   │   ├── createSampleWorkers.js
│   │   ├── createAdmin.js
│   │   └── setupMarketplace.js
│   ├── uploads/                # File uploads directory
│   ├── .env.example            # Environment variables template
│   ├── package.json
│   └── server.js               # Entry point
│
├── .gitignore
├── README.md                    # This file
└── package.json                # Root package.json (optional)
```

---

## 🎯 Key Features

### 1. Worker Selection System

Users can select workers before payment, similar to Ola/Uber:

- **Distance-based search** - Find workers within 100km
- **Real-time location** - GPS coordinates for accurate distance
- **Filters** - Rating (3+, 4+, 4.5+), Distance (1-100km), Sort options
- **Worker details** - Name, rating, distance, ETA, phone, experience
- **Skill matching** - Automatic mapping of services to worker skills

**Setup Workers:**
```bash
cd server
npm run create:sample-workers
```

This creates 43 sample workers across Mumbai, Delhi, and Bangalore.

### 2. Marketplace Features

Buy, sell, or rent products:

- **Listing creation** - Upload images, set prices
- **Rental system** - Daily/weekly/monthly rental periods
- **Categories** - Electronics, Furniture, Tools, etc.
- **Search & filters** - By category, price, condition, location
- **Image uploads** - Multiple images per listing

### 3. Payment Integration

Dual payment options:

- **Online Payment** - Razorpay (UPI, Cards, Net Banking)
- **Cash on Delivery** - Pay when service is completed
- **Order tracking** - Real-time status updates
- **Payment history** - View all transactions

### 4. Location Services

Smart location handling:

- **Google Places API** - Address autocomplete
- **GPS coordinates** - Accurate distance calculation
- **City selection** - Quick switch between cities
- **Default location** - Mumbai fallback if location not available
- **100km radius** - Wide coverage area

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "password": "password123"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Worker Endpoints

#### Get Nearby Workers
```http
GET /workers/nearby?lat=19.0760&lng=72.8777&radius=100&serviceId=Intensive%20Bathroom%20Cleaning
```

**Response:**
```json
{
  "success": true,
  "workers": [
    {
      "first_name": "Rajesh",
      "last_name": "Kumar",
      "phone": "+919876543210",
      "distance": 5.2,
      "distanceText": "5.2km",
      "rating": 4.8,
      "skills": [...]
    }
  ],
  "count": 5
}
```

#### Get Worker Availability
```http
GET /workers/availability
```

### Payment Endpoints

#### Create Razorpay Order
```http
POST /razorpay/create-order
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 50000,
  "currency": "INR",
  "items": [...]
}
```

#### Create COD Order
```http
POST /razorpay/cod-order
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user_id",
  "items": [...],
  "workerAssignments": [...]
}
```

### Marketplace Endpoints

#### Get All Listings
```http
GET /marketplace/listings?page=1&limit=12&category=Electronics
```

#### Create Listing
```http
POST /marketplace/listings
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "title": "iPhone 13",
  "description": "Like new condition",
  "price": 45000,
  "category": "Electronics",
  "images": [files]
}
```

---

## 🔧 Database Setup

### 1. Start MongoDB

#### Local MongoDB
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

#### MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### 2. Initialize Database

```bash
cd server

# Create admin user
npm run create:admin

# Create sample workers
npm run create:sample-workers

# Setup marketplace categories
npm run setup:marketplace
```

### 3. Verify Database

```bash
# Connect to MongoDB
mongosh

# Use database
use Genie

# Check collections
show collections

# Count documents
db.workers.countDocuments()
db.users.countDocuments()
```

---

## 🧪 Testing

### Run Tests
```bash
cd server
npm test
```

### Test API Endpoints
```bash
# Test worker search
curl "http://localhost:5000/api/workers/nearby?lat=19.0760&lng=72.8777&radius=100"

# Test worker availability
curl "http://localhost:5000/api/workers/availability"
```

### Test in Browser
1. Open http://localhost:5173
2. Register a new user
3. Browse services
4. Add to cart
5. Select workers
6. Complete payment

---

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Try: `mongosh` to test connection

#### 2. No Workers Showing
```
Workers: 0 found
```

**Solution:**
```bash
cd server
npm run create:sample-workers
```

Verify:
```bash
mongosh
use Genie
db.workers.countDocuments()
# Should return 43
```

#### 3. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

#### 4. Razorpay Payment Fails
```
Payment verification failed
```

**Solution:**
- Check Razorpay keys in both `.env` files
- Ensure keys match (test/live)
- Check Razorpay dashboard for errors

#### 5. Google Places Not Working
```
Places API error
```

**Solution:**
- Verify API key in `client/.env`
- Enable Places API in Google Cloud Console
- Check billing is enabled

### Debug Mode

Enable detailed logging:

```env
# server/.env
NODE_ENV=development
```

Check server logs for detailed error messages.

---

## 📚 Additional Documentation

- [Worker Selection Guide](./WORKER_SELECTION_GUIDE.md)
- [Service to Worker Mapping](./SERVICE_TO_WORKER_MAPPING.md)
- [Worker Location Fix](./WORKER_LOCATION_FIX.md)
- [Mumbai Workers List](./MUMBAI_WORKERS_LIST.md)
- [Debug Workers Guide](./DEBUG_WORKERS.md)
- [Quick Test Guide](./QUICK_TEST_GUIDE.md)

---

## 🔐 Security

### Best Practices Implemented

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ HTTP-only cookies
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation
- ✅ XSS protection
- ✅ MongoDB injection prevention
- ✅ Helmet security headers

### Production Checklist

- [ ] Change all default secrets
- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Use MongoDB Atlas (not local)
- [ ] Enable Razorpay live mode
- [ ] Set up proper CORS
- [ ] Configure rate limits
- [ ] Set up monitoring
- [ ] Enable logging

---

## 🚀 Deployment

### Frontend (Netlify/Vercel)

1. Build the app:
```bash
cd client
npm run build
```

2. Deploy `dist` folder to Netlify/Vercel

3. Set environment variables in hosting platform

### Backend (Heroku/Railway/Render)

1. Create `Procfile`:
```
web: node server/server.js
```

2. Set environment variables

3. Deploy to platform

### Database (MongoDB Atlas)

1. Create cluster
2. Whitelist IP addresses
3. Update connection string
4. Run initialization scripts

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Authors

- **Your Name** - Initial work

---

## 🙏 Acknowledgments

- React team for the amazing framework
- MongoDB for the database
- Razorpay for payment integration
- Google for Maps and Places API
- All contributors and testers

---

## 📞 Support

For support, email support@genie.com or join our Slack channel.

---

## 🎉 Quick Start Summary

```bash
# 1. Clone and install
git clone https://github.com/yourusername/genie.git
cd genie

# 2. Setup backend
cd server
npm install
cp .env.example .env
# Edit .env with your configuration

# 3. Setup frontend
cd ../client
npm install
cp .env.example .env
# Edit .env with your configuration

# 4. Start MongoDB
mongosh

# 5. Initialize database
cd ../server
npm run create:sample-workers

# 6. Run servers
# Terminal 1
cd server && npm start

# Terminal 2
cd client && npm run dev

# 7. Open browser
# http://localhost:5173
```

**That's it! You're ready to go! 🚀**

---

**Made with ❤️ by the Genie Team**
