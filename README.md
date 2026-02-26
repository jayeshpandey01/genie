<div align="center">
  <img src="client/public/logo.png" alt="GENIE Logo" width="120" height="120">
  <h1>🧞 GENIE</h1>
  <p><i>Your Trusted Home Services & Marketplace Companion</i></p>

  ![GitHub repo size](https://img.shields.io/github/repo-size/Agarwalyash14/Genie)
  ![Visitors](https://visitor-badge.laobi.icu/badge?page_id=Agarwalyash14.Genie)
  ![GitHub stars](https://img.shields.io/github/stars/Agarwalyash14/Genie)
  ![GitHub forks](https://img.shields.io/github/forks/Agarwalyash14/Genie)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  ![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
  ![React](https://img.shields.io/badge/React-v18.3-blue)
  ![MongoDB](https://img.shields.io/badge/MongoDB-v8.5-green)
</div>

---

## 📑 About

**GENIE** is a comprehensive on-demand home services platform with an integrated buy-sell marketplace, designed to revolutionize how urban dwellers maintain their living spaces and trade goods locally. Built using the MERN stack (MongoDB, Express.js, React, Node.js), GENIE connects homeowners with verified service professionals and enables peer-to-peer marketplace transactions.

![GENIE](https://raw.githubusercontent.com/Agarwalyash14/Genie/main/client/public/main_page.jpeg)

---

## 🌟 Key Features

### 🏠 Home Services Platform
- **Verified Professionals**: Access to thoroughly vetted service providers
- **Real-time Booking**: Schedule services on-demand or in advance
- **Secure Payments**: Integrated payment system using Razorpay
- **Service Tracking**: Real-time tracking of service status and bookings
- **Review System**: Transparent ratings and reviews for quality assurance
- **User Profiles**: Personalized dashboards for customers and service providers
- **Location Services**: Google Maps integration with auto-detect and manual entry
- **Multiple Service Categories**:
  - 💇 Women's Salon & Spa
  - 💈 Men's Salon & Spa
  - ❄️ AC Appliances & Repair
  - 🧹 Cleaning & Pest Control
  - ⚡ Electrician Services
  - 🎨 Painting Services
  - And more...

### 🛒 Buy-Sell Marketplace
- **Local Trading**: Buy and sell items within your community
- **Category-Based Browsing**: Electronics, Furniture, Vehicles, Clothing, Books, Sports, Home & Garden
- **Advanced Filtering**: Filter by price range, condition, location, and category
- **Image Upload**: Multi-image support with carousel view
- **Seller Profiles**: Verified seller badges and ratings
- **Contact Sellers**: Direct messaging system
- **My Listings**: Manage your posted items
- **Favorites**: Save items for later
- **Search & Sort**: Powerful search with multiple sorting options
- **Responsive Design**: Optimized for all devices

### 🔐 Security & Performance
- **JWT Authentication**: Secure token-based authentication
- **Password Encryption**: bcrypt hashing for user passwords
- **Input Validation**: Joi schema validation for all inputs
- **Rate Limiting**: Protection against API abuse
- **XSS Protection**: Cross-site scripting prevention
- **NoSQL Injection Prevention**: MongoDB sanitization
- **Secure Cookies**: HTTP-only cookies with SameSite protection
- **Performance Optimization**: Debounced API calls, database indexing, lean queries

---

## 💻 Tech Stack

### Frontend
- **Framework**: React 18.3 with Vite
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS 3.4
- **UI Components**: 
  - Framer Motion (animations)
  - React Icons
  - Lucide React
  - React Loading Skeleton
- **State Management**: Context API
- **HTTP Client**: Axios
- **Maps**: Google Maps API (@react-google-maps/api)
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js 4.19
- **Database**: MongoDB 8.5 with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Security**:
  - Helmet (HTTP headers)
  - Express Rate Limit
  - Express Mongo Sanitize
  - XSS protection
  - Joi validation
- **File Upload**: Multer with Sharp (image processing)
- **Payment**: Razorpay SDK
- **Email**: Nodemailer
- **Logging**: Morgan
- **Compression**: Gzip compression

### Development Tools
- **Build Tool**: Vite 6.0
- **Linting**: ESLint
- **Testing**: Jest, Supertest
- **Process Manager**: Nodemon
- **Version Control**: Git

### Integrations
- **Payment Gateway**: Razorpay
- **Maps & Location**: Google Places API
- **Authentication**: JWT tokens with HTTP-only cookies

---

## 🚀 Setup and Installation

### Prerequisites
- Node.js (v18 or later)
- npm (Node Package Manager)
- MongoDB (v4.4 or later) - Local or Atlas
- Git
- Google Places API Key
- Razorpay Account (for payments)

### Quick Start

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Agarwalyash14/Genie.git
   cd Genie
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   
   # Create .env file (see configuration below)
   cp .env.example .env
   
   # Generate JWT secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   
   # Start development server
   npm run dev
   ```
   Server will run on http://localhost:5000

3. **Frontend Setup**
   ```bash
   cd client
   npm install
   
   # Create .env file (see configuration below)
   cp .env.example .env
   
   # Start development server
   npm run dev
   ```
   Frontend will run on http://localhost:5173

4. **Database Setup**
   ```bash
   # From server directory
   
   # Create admin user
   npm run create:admin
   
   # Seed marketplace categories
   npm run seed:categories
   
   # Setup marketplace (optional)
   npm run setup:marketplace
   
   # Optimize database (add indexes)
   npm run optimize:db
   ```

---

## ⚙️ Environment Configuration

### Server (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/Genie
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/Genie?retryWrites=true&w=majority

# Security
JWT_SECRET=your_64_character_jwt_secret_here_generate_using_crypto
# Generate using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here

# Email Configuration (Optional)
EMAIL_FROM=noreply@genie-marketplace.com
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Or use SMTP:
# SMTP_HOST=smtp.your-provider.com
# SMTP_PORT=587
# SMTP_SECURE=false
```

### Client (.env)
```env
# Backend API
VITE_BACKEND_URL=http://localhost:5000

# Google Places API
VITE_PLACES_NEW_API_KEY=your_google_places_api_key_here
VITE_GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# Payment Gateway (Razorpay)
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
```

### Getting API Keys

#### Google Places API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Places API" and "Maps JavaScript API"
4. Create credentials (API Key)
5. Restrict key to your domain (optional)

#### Razorpay
1. Sign up at [Razorpay](https://razorpay.com/)
2. Go to Settings → API Keys
3. Generate Test/Live keys
4. Use test keys for development (start with `rzp_test_`)

---

## 🔑 Admin Access

### Default Admin Credentials
- **Email**: `admin@gmail.com`
- **Password**: `admin@1234`
- **Admin Panel**: `http://localhost:5173/admin`

### Creating Custom Admin
```bash
cd server
npm run create:admin
# Follow the prompts to create a new admin user
```

### Admin Features
- Dashboard with analytics
- Manage all services
- View all bookings
- Manage marketplace listings
- User management
- Payment tracking

---

## 📁 Project Structure

```
Genie/
├── client/                      # React frontend
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── admin/              # Admin panel components
│   │   ├── assets/             # Images, icons, SVGs
│   │   ├── components/         # Reusable components
│   │   ├── context/            # React Context providers
│   │   ├── hooks/              # Custom React hooks
│   │   ├── layout/             # Layout components
│   │   ├── pages/              # Page components
│   │   ├── utils/              # Utility functions
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # Entry point
│   ├── .env                    # Environment variables
│   └── package.json
│
├── server/                      # Express backend
│   ├── middleware/             # Express middleware
│   │   ├── auth.js            # Authentication
│   │   ├── validation.js      # Input validation
│   │   └── upload.js          # File upload
│   ├── models/                 # MongoDB models
│   │   ├── User.js
│   │   ├── Service.js
│   │   ├── Booking.js
│   │   ├── Payment.js
│   │   ├── Listing.js
│   │   └── Category.js
│   ├── routes/                 # API routes
│   │   ├── users.js
│   │   ├── services.js
│   │   ├── razorpay.js
│   │   ├── marketplace.js
│   │   └── admin/
│   ├── scripts/                # Utility scripts
│   │   ├── createAdmin.js
│   │   ├── seedCategories.js
│   │   ├── setupMarketplace.js
│   │   └── optimizeDatabase.js
│   ├── uploads/                # User uploaded files
│   ├── .env                    # Environment variables
│   ├── server.js               # Entry point
│   └── package.json
│
├── .kiro/                       # Kiro AI configuration
├── docs/                        # Documentation
│   ├── SECURITY_FIXES_APPLIED.md
│   ├── PERFORMANCE_OPTIMIZATION.md
│   ├── MARKETPLACE_CURRENCY_UPDATE.md
│   ├── LOCATION_INTEGRATION_COMPLETE.md
│   └── CODEBASE_CLEANUP_SUMMARY.md
│
└── README.md                    # This file
```

---

## 🎯 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout
- `GET /api/users/user` - Get current user

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:serviceName/details` - Get service details
- `GET /api/services/:serviceName/:subcategory` - Get subcategory services

### Cart & Bookings
- `GET /api/users/cart` - Get user cart
- `PUT /api/users/cart` - Update cart
- `POST /api/users/cart/add` - Add to cart
- `DELETE /api/users/cart/remove/:id` - Remove from cart
- `GET /api/razorpay/bookings` - Get user bookings

### Marketplace
- `GET /api/marketplace/listings` - Get all listings (with filters)
- `GET /api/marketplace/listings/:id` - Get listing details
- `POST /api/marketplace/listings` - Create listing (auth required)
- `PUT /api/marketplace/listings/:id` - Update listing (auth required)
- `DELETE /api/marketplace/listings/:id` - Delete listing (auth required)
- `GET /api/marketplace/categories` - Get all categories
- `GET /api/marketplace/my-listings` - Get user's listings (auth required)

### Payments
- `POST /api/razorpay/create-order` - Create Razorpay order
- `POST /api/razorpay/verify-payment` - Verify payment

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/services` - Manage services
- `GET /api/admin/bookings` - View all bookings
- `GET /api/admin/payments` - View all payments

---

## 🌈 Features in Detail

### Location Detection System
- **Auto-detect**: Browser geolocation with Google Places reverse geocoding
- **Manual Entry**: Area, city, and 6-digit pincode validation
- **Persistent**: Saves location in localStorage
- **Privacy-first**: Clear explanation of data usage

### Marketplace Filters
- **Price Range**: ₹1,000 - ₹50,000+ (Indian Rupees)
- **Condition**: New, Like New, Good, Fair
- **Category**: 8+ categories
- **Location**: Filter by city/area
- **Sort**: Price, Date, Views, Relevance

### Payment Integration
- **Razorpay Gateway**: Secure payment processing
- **Order Tracking**: Real-time payment status
- **Payment History**: View all transactions
- **Refund Support**: Integrated refund system

### Security Features
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Joi schema validation
- **Rate Limiting**: 100 requests per 15 minutes
- **XSS Protection**: Sanitized inputs and outputs
- **CORS**: Configured for specific origins
- **Secure Cookies**: HTTP-only, SameSite strict

---

## 🚀 Performance Optimizations

### Client-Side
- **Debounced API Calls**: 500ms debounce on cart updates
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Progressive image loading
- **Local Storage**: Cart persistence for unauthenticated users
- **Retry Logic**: Automatic retry for failed requests

### Server-Side
- **Database Indexing**: Indexes on frequently queried fields
- **Lean Queries**: Plain objects for read-only operations
- **Field Selection**: Only fetch required fields
- **Connection Pooling**: Max 10 MongoDB connections
- **Compression**: Gzip compression for responses
- **Static File Caching**: 1-day cache for assets

### Results
- **60% faster page loads** (from ~5s to ~2s)
- **80% fewer API calls** during cart operations
- **50-70% faster database queries**
- **30-40% faster user data retrieval**

---

## 🧪 Testing

### Run Tests
```bash
# Server tests
cd server
npm test

# Watch mode
npm run test:watch
```

### Test Coverage
- Unit tests for models
- Integration tests for API routes
- Authentication tests
- Payment verification tests

---

## 📊 Scripts Reference

### Server Scripts
```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm test               # Run tests
npm run create:admin   # Create admin user
npm run seed:categories # Seed marketplace categories
npm run setup:marketplace # Setup marketplace
npm run optimize:db    # Add database indexes
npm run security:audit # Run security audit
npm run security:fix   # Fix security vulnerabilities
```

### Client Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## 🌍 Deployment

### Frontend (Vercel/Netlify)
1. Build the client: `npm run build`
2. Deploy the `dist` folder
3. Set environment variables in hosting platform
4. Configure redirects for SPA routing

### Backend (Heroku/Railway/Render)
1. Set environment variables
2. Ensure MongoDB Atlas connection
3. Deploy from GitHub or CLI
4. Run database setup scripts

### Database (MongoDB Atlas)
1. Create cluster on MongoDB Atlas
2. Whitelist IP addresses
3. Create database user
4. Update MONGODB_URI in .env

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Genie.git
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. **Commit Changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```

4. **Push to Branch**
   ```bash
   git push origin feature/AmazingFeature
   ```

5. **Open Pull Request**
   - Describe your changes
   - Link related issues
   - Add screenshots if applicable

### Contribution Guidelines
- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation
- Ensure all tests pass

---

## 🐛 Known Issues & Solutions

### Issue: Cart validation errors
**Solution**: Fixed in latest version. Cart now handles both `_id` and `service` field names.

### Issue: Slow page loading
**Solution**: Implemented debouncing, database indexing, and query optimization. 60% performance improvement.

### Issue: Location not persisting
**Solution**: Location now saved in localStorage and synced with backend.

### Issue: Payment verification failing
**Solution**: Enhanced signature verification and error handling.

For more issues and solutions, see [MARKETPLACE_TROUBLESHOOTING.md](MARKETPLACE_TROUBLESHOOTING.md)

---

## 📚 Documentation

- [Security Fixes Applied](SECURITY_FIXES_APPLIED.md)
- [Performance Optimization](PERFORMANCE_OPTIMIZATION.md)
- [Marketplace Currency Update](MARKETPLACE_CURRENCY_UPDATE.md)
- [Location Integration](LOCATION_INTEGRATION_COMPLETE.md)
- [Codebase Cleanup Summary](CODEBASE_CLEANUP_SUMMARY.md)
- [Project Structure](PROJECT_STRUCTURE.md)
- [Setup Guide](SETUP.md)

---

## 🛣️ Roadmap & Future Enhancements

### Phase 1 (Current)
- ✅ Home services booking
- ✅ Buy-sell marketplace
- ✅ Payment integration
- ✅ Location detection
- ✅ Admin panel

### Phase 2 (In Progress)
- 🔄 Real-time chat between buyers and sellers
- 🔄 Push notifications
- 🔄 Advanced search with AI
- 🔄 Service provider ratings
- 🔄 Multi-language support

### Phase 3 (Planned)
- 📋 Mobile app (React Native)
- 📋 Video consultations
- 📋 Subscription plans
- 📋 Loyalty rewards program
- 📋 AI-powered recommendations

### Phase 4 (Future)
- 📋 Geographic expansion
- 📋 Service diversification
- 📋 Community features
- 📋 Sustainability initiatives
- 📋 Advanced analytics dashboard

---

## 💡 Use Cases

### For Homeowners
- Book cleaning services for weekly maintenance
- Hire electrician for urgent repairs
- Schedule salon appointments at home
- Buy second-hand furniture locally
- Sell unused electronics

### For Service Providers
- Manage bookings and schedules
- Build professional reputation
- Receive secure payments
- Track earnings and analytics
- Grow customer base

### For Marketplace Users
- Find great deals on used items
- Sell items quickly and safely
- Connect with local buyers/sellers
- Browse by category and location
- Save favorite items

---

## 🏆 Achievements

- 🎯 **60% Performance Improvement**: Optimized loading times
- 🔒 **28 Security Fixes**: Comprehensive security enhancements
- 🧹 **54 Files Cleaned**: Removed redundant code and files
- 💱 **Indian Rupee Support**: Localized for Indian market
- 📍 **Location Detection**: Auto-detect with manual fallback
- 🛒 **Full Marketplace**: Complete buy-sell functionality

---

## 📞 Support

### Get Help
- 📧 Email: support@genie.com
- 💬 Discord: [Join our community](#)
- 📖 Documentation: [Read the docs](#)
- 🐛 Issues: [GitHub Issues](https://github.com/Agarwalyash14/Genie/issues)

### FAQ

**Q: How do I reset my password?**
A: Use the "Forgot Password" link on the login page.

**Q: Can I use this in production?**
A: Yes, but ensure you:
- Use production API keys
- Set strong JWT secret (64+ characters)
- Enable HTTPS
- Configure proper CORS
- Set up monitoring

**Q: How do I add new service categories?**
A: Run `npm run seed:categories` or add via admin panel.

**Q: Is the marketplace free to use?**
A: Yes, posting and browsing are free. Transaction fees may apply for payments.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 GENIE

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **React Team**: For the amazing framework
- **MongoDB**: For the flexible database
- **Razorpay**: For secure payment processing
- **Google**: For Maps and Places API
- **Tailwind CSS**: For beautiful styling
- **Open Source Community**: For countless libraries and tools

---

## 📈 Stats

![GitHub commit activity](https://img.shields.io/github/commit-activity/m/Agarwalyash14/Genie)
![GitHub last commit](https://img.shields.io/github/last-commit/Agarwalyash14/Genie)
![GitHub issues](https://img.shields.io/github/issues/Agarwalyash14/Genie)
![GitHub pull requests](https://img.shields.io/github/issues-pr/Agarwalyash14/Genie)

---

<div align="center">
  <p>Made with ❤️ by the GENIE Team</p>
  <p>
    <a href="https://github.com/Agarwalyash14/Genie">⭐ Star us on GitHub</a> •
    <a href="https://github.com/Agarwalyash14/Genie/issues">🐛 Report Bug</a> •
    <a href="https://github.com/Agarwalyash14/Genie/issues">✨ Request Feature</a>
  </p>
  
  **Happy Coding! 🚀**
</div>
#   g e n i e  
 