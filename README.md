# StyleHub - MERN Stack E-Commerce Application

A complete, production-ready MERN (MongoDB, Express, React, Node.js) stack e-commerce application for Clothing & Apparel shopping.

## � Live Demo

**Visit StyleHub**: [https://stylehub-live.com](https://stylehub-live.com)

**Features:**
- Browse clothing & apparel products
- Create account with Google or Facebook OAuth
- Add items to cart and checkout
- Secure payment via Stripe or PayMongo
- Track orders in real-time
- Admin dashboard for store management

## 🚀 Quick Start Links

- **Frontend**: [https://stylehub-live.com](https://stylehub-live.com)
- **API Documentation**: [https://stylehub-api.com/docs](https://stylehub-api.com/docs)
- **Admin Panel**: [https://stylehub-live.com/admin](https://stylehub-live.com/admin)

---

## �🌟 Features

### Backend Features
- **User Authentication**: Register, Login, Google OAuth, Facebook OAuth
- **JWT Token Management**: Secure token-based authentication
- **Product Management**: CRUD operations for products and categories
- **Cart System**: Add, update, remove items from cart
- **Order Management**: Create, track, and manage orders
- **Stripe Payment Integration**: Secure payment processing with webhooks
- **Email Notifications**: Order confirmations and admin notifications
- **Admin Dashboard**: Manage products, categories, and orders
- **MVC Architecture**: Clean and organized code structure

### Frontend Features
- **Responsive Design**: Mobile-first approach
- **User Authentication**: Login and registration with Google & Facebook OAuth
- **Product Browsing**: Filter by category and sort by price/rating
- **Shopping Cart**: Dynamic cart management
- **Checkout Flow**: Stripe & PayMongo payment integration
- **Order Tracking**: View order history and status
- **Admin Panel**: Manage store operations
- **Modern UI**: Built with React and CSS

## 📁 Project Structure

```
stylehub/
├── backend/
│   ├── config/          # Database and service configurations
│   ├── controllers/     # Business logic
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth and error handling
│   ├── utils/           # Helper functions
│   ├── server.js        # Main server file
│   ├── seed.js          # Database seeding script
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # Context API for state management
│   │   ├── services/    # API calls
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env
│
├── package.json         # Root package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (Local or Atlas)
- Stripe Account (for payments)
- Google OAuth Credentials

### Installation

1. **Clone the repository**
   ```bash
   cd stylehub
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

   Or manually:
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

## 📦 Deployment

### Deploy Frontend (Vercel / Netlify)

**Option 1: Vercel (Recommended)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from frontend directory
cd frontend
vercel
```

**Option 2: Netlify**
```bash
# Build frontend
npm run build

# Deploy dist folder to Netlify
```

**Environment Variables to Set:**
```
VITE_API_URL=https://stylehub-api.com/api
VITE_FACEBOOK_APP_ID=your_facebook_app_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Deploy Backend (Railway / Heroku)

**Option 1: Railway**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Option 2: Heroku**
```bash
# Deploy using Git
git push heroku main
```

**Environment Variables to Set:**
```
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_key
PAYMONGO_SECRET_KEY=your_paymongo_key
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

---

### Backend Setup

1. **Configure environment variables**
   
   Edit `backend/.env`:
   ```env
   # MongoDB Connection
   MONGO_URI=mongodb://localhost:27017/stylehub

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_change_this_in_production
   JWT_EXPIRY=7d

   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # Email Configuration (Gmail)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   ADMIN_EMAIL=admin@stylehub.com

   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

2. **Seed database with sample data**
   ```bash
   cd backend
   npm run dev
   # In another terminal
   npm run seed
   ```

3. **Start backend server**
   ```bash
   cd backend
   npm run dev
   ```
   Server will run on `http://localhost:5000`

### Frontend Setup

1. **Configure environment variables**
   
   Edit `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   VITE_APP_NAME=StyleHub
   VITE_APP_ENV=development
   ```

2. **Start frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   App will run on `http://localhost:3000`

## 🛠️ Development

### Run both backend and frontend
```bash
npm run dev
```

### Backend only
```bash
npm run dev:backend
```

### Frontend only
```bash
npm run dev:frontend
```

## 📊 Database Collections

### Users
- firstName, lastName
- email (unique)
- password (hashed with bcryptjs)
- googleId (for OAuth)
- Contact information
- Role (user/admin)

### Products
- name, description
- price, originalPrice
- category (reference)
- images, sizes, colors
- stock information
- ratings and reviews

### Categories
- name (unique)
- description
- slug (auto-generated)

### Carts
- userId (reference)
- items array with product details
- totalPrice, totalItems

### Orders
- orderId (unique)
- userId (reference)
- items array
- totalAmount
- shippingAddress
- paymentStatus, orderStatus
- trackingNumber (optional)

### Payments
- paymentId (unique)
- orderId (reference)
- amount, currency
- status (pending/succeeded/failed/refunded)
- Stripe session/transaction details

## 🔐 Authentication

### JWT Flow
1. User register/login
2. Server generates JWT token
3. Token stored in localStorage
4. Token sent with every API request in Authorization header
5. Server verifies token before processing request

### Google OAuth
1. User clicks "Sign in with Google"
2. Google returns credential with user info
3. App sends to backend verification
4. Backend creates/updates user and generates JWT
5. User logged in automatically

## 💳 Payment Flow

1. User views cart and proceeds to checkout
2. Fills shipping address
3. Clicks "Pay with Stripe"
4. Backend creates Stripe checkout session
5. User redirected to Stripe checkout page
6. User enters card details
7. Stripe processes payment
8. Success/Cancel page displayed
9. Backend saves order and processes

## 📧 Email Notifications

### Order Confirmation
- Sent to customer email
- Contains order ID, items, total
- Uses Nodemailer with Gmail

### Admin Notification
- Sent to admin email
- Contains customer info and order details
- Alerts admin of new orders

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google-login` - Google OAuth login
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/update-profile` - Update profile (protected)
- `POST /api/auth/logout` - Logout (protected)

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)
- `POST /api/products/:id/review` - Add review (protected)

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

### Cart
- `GET /api/cart` - Get user cart (protected)
- `POST /api/cart/add` - Add to cart (protected)
- `PUT /api/cart/update` - Update cart item (protected)
- `POST /api/cart/remove` - Remove from cart (protected)
- `DELETE /api/cart/clear` - Clear cart (protected)

### Orders
- `GET /api/orders` - Get user orders (protected)
- `GET /api/orders/:id` - Get order details (protected)
- `POST /api/orders` - Create order (protected)
- `PUT /api/orders/:id` - Update order status (admin)
- `DELETE /api/orders/:id` - Cancel order (protected)
- `GET /api/orders/admin/all` - Get all orders (admin)

### Payments
- `POST /api/payments/create-checkout-session` - Create Stripe session (protected)
- `POST /api/payments/verify` - Verify payment (protected)
- `POST /api/payments/webhook` - Stripe webhook
- `GET /api/payments/history` - Get payment history (protected)
- `POST /api/payments/refund` - Refund payment (admin)

## 🧪 Testing

### Test User Accounts
After seeding, use these credentials:
- Email: test@example.com
- Password: password123

### Test Products
8 sample products are seeded in 4 categories:
- Men (Classic T-Shirt, Premium Jeans, Polo Shirt)
- Women (Summer Dress, Athletic Leggings)
- Kids (Kids Hoodie)
- Accessories (Leather Bag, Sunglasses)

## 📝 Environment Variables Reference

### Backend `.env`
```
MONGO_URI            - MongoDB connection string
JWT_SECRET          - Secret key for JWT tokens
JWT_EXPIRY          - JWT token expiry time
STRIPE_SECRET_KEY   - Stripe API secret key
STRIPE_PUBLISHABLE_KEY - Stripe publishable key
STRIPE_WEBHOOK_SECRET  - Stripe webhook secret
GOOGLE_CLIENT_ID    - Google OAuth client ID
GOOGLE_CLIENT_SECRET - Google OAuth client secret
EMAIL_USER          - Gmail address for sending emails
EMAIL_PASS          - Gmail app password
ADMIN_EMAIL         - Admin email address
PORT                - Server port (default: 5000)
NODE_ENV            - Environment (development/production)
FRONTEND_URL        - Frontend URL for CORS
```

### Frontend `.env`
```
VITE_API_URL           - Backend API URL
VITE_STRIPE_PUBLISHABLE_KEY - Stripe publishable key
VITE_GOOGLE_CLIENT_ID  - Google OAuth client ID
VITE_APP_NAME          - App name
VITE_APP_ENV           - Environment
```

## 🚢 Deployment

### Backend Deployment (Heroku/Railway)
1. Push code to Git repository
2. Set environment variables on hosting platform
3. Ensure MongoDB Atlas is configured
4. Deploy backend

### Frontend Deployment (Vercel/Netlify)
1. Update `VITE_API_URL` to production backend URL
2. Build: `npm run build:frontend`
3. Deploy `frontend/dist` folder

## 📚 Technologies Used

### Backend
- **Node.js & Express** - Server framework
- **MongoDB & Mongoose** - Database
- **JWT** - Authentication
- **Bcryptjs** - Password hashing
- **Stripe & PayMongo** - Payment processing
- **Nodemailer** - Email service
- **Google & Facebook OAuth** - Social authentication
- **CORS** - Cross-origin requests
- **Dotenv** - Environment variables

### Frontend
- **React 18** - UI library
- **React Router v6** - Navigation
- **Axios** - HTTP client
- **Context API** - State management
- **Stripe.js & PayMongo** - Payment integration
- **Google & Facebook OAuth** - Social authentication
- **Vite** - Build tool & development server
- **CSS3** - Responsive styling

## 🌍 Production URLs

Update these URLs in your environment when deploying:

| Environment | Frontend URL | Backend API | Status |
|-------------|-------------|------------|--------|
| **Development** | http://localhost:8000 | http://localhost:7000/api | 🔴 Local |
| **Production** | https://stylehub-live.com | https://api.stylehub-live.com | ✅ Live |
| **GitHub** | [Repository](https://github.com/ryseianprinceberalde-eng/stylehub) | - | ✅ Open Source |

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running locally or Atlas credentials are correct
- Check `MONGO_URI` in `.env`

### Stripe Error
- Verify API keys in `.env`
- Ensure CORS is configured properly
- Check Stripe webhook configuration

### Email Not Sending
- Enable "Less secure app access" or use app-specific password
- Check Gmail credentials in `.env`
- Ensure 2FA is enabled for Gmail

### CORS Issues
- Verify `FRONTEND_URL` in backend `.env`
- Check allowed origins in express CORS setup

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

StyleHub Development Team

## 🤝 Contributing

Contributions are welcome! Please create a pull request with clear descriptions of changes.

## 📞 Support

For issues and questions, please create an issue in the repository.

---

**Happy Coding! 🚀**
