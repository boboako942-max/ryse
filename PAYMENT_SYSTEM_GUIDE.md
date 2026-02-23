# MERN E-Commerce Payment System - Complete Implementation Guide

## 🎯 Overview

A production-ready payment system supporting:
- **💳 Stripe** - Credit/Debit Cards in USD
- **📱 GCash (PayMongo)** - Mobile Payments in PHP
- **💱 Real-time Exchange Rate Conversion** - Live USD ↔ PHP
- **🔒 Security** - Backend validation, webhook handling, proper encryption

---

## 📁 Folder Structure

```
stylehub/
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   ├── stripe.js
│   │   ├── gcash.js
│   │   └── payments.js              ✨ NEW - Payment configuration
│   ├── controllers/
│   │   └── paymentController.js     ✨ UPDATED - Real-time conversion
│   ├── models/
│   │   ├── Order.js                 ✨ UPDATED - Exchange rate tracking
│   │   └── Payment.js               ✨ UPDATED - Currency handling
│   ├── routes/
│   │   └── paymentRoutes.js         ✨ UPDATED - Exchange rate endpoint
│   └── utils/
│       └── exchangeRate.js          ✨ NEW - Exchange rate fetching
│
└── frontend/
    └── src/
        └── pages/
            └── Checkout.jsx         ✨ UPDATED - Live conversion display
```

---

## 🔧 Backend Setup

### 1. **Exchange Rate Utility** (`utils/exchangeRate.js`)

**Features:**
- Fetches real-time USD → PHP exchange rate from free APIs
- Caches rate for 5 minutes (configurable)
- Falls back to default rate if API fails
- Uses `exchangerate-api.com` as primary, `openexchangerates.org` as fallback

**APIs Used:**
```
Primary:   https://api.exchangerate-api.com/v4/latest/USD
Fallback:  https://openexchangerates.org/api/latest.json
Default Rate: 56.5 PHP per USD
```

**Key Functions:**
```javascript
fetchExchangeRate()    // Get current rate with caching
convertUSDtoPHP(usd, rate)    // USD → PHP conversion
convertPHPtoUSD(php, rate)    // PHP → USD conversion
```

### 2. **Payment Configuration** (`config/payments.js`)

Centralized configuration for:
- Payment methods & gateways
- Order & payment statuses
- Currency mappings
- Amount limits & defaults
- URL generators

### 3. **Updated Models**

#### Order Schema
```javascript
{
  totalAmount: Number,        // USD amount
  totalAmountPHP: Number,     // PHP amount
  currency: 'usd' | 'php',    // Currency used
  exchangeRate: Number,       // Rate used (e.g., 56.5)
  exchangeRateSource: 'cache' | 'api' | 'default'
}
```

#### Payment Schema
```javascript
{
  amountUSD: Number,          // USD amount
  amountPHP: Number,          // PHP amount
  currency: 'usd' | 'php',    // Currency charged
  exchangeRate: Number,       // Rate used
  exchangeRateSource: String
}
```

### 4. **Payment Controller Updates**

#### Stripe Checkout
```javascript
POST /api/payments/create-checkout-session
Body: { items, shippingAddress }
Response: { sessionId, currency: 'usd', totalAmountUSD }
```

**Flow:**
1. Validate items & calculate total in USD
2. Create Stripe session (charged in USD only)
3. Save exchange rate for records

#### GCash Payment
```javascript
POST /api/payments/gcash/create
Body: { items, shippingAddress, totalAmount }
Response: { paymentDetails, exchangeRate, referenceId }
```

**Flow:**
1. Fetch real-time exchange rate
2. Convert USD → PHP using current rate
3. Create order with both amounts
4. Save exchange rate used

#### Get Exchange Rate
```javascript
GET /api/payments/exchange-rate
Response: { rate: 56.5, source: 'cache', timestamp }
```

### 5. **Payment Routes** (`routes/paymentRoutes.js`)

```javascript
POST   /api/payments/create-checkout-session  // Stripe
POST   /api/payments/verify                   // Verify Stripe
GET    /api/payments/history                  // User history
POST   /api/payments/refund                   // Admin refund
POST   /api/payments/gcash/create             // GCash
POST   /api/payments/gcash/verify             // Verify GCash
GET    /api/payments/exchange-rate            // ✨ NEW
POST   /api/payments/gcash/webhook            // PayMongo webhook
```

---

## 🎨 Frontend Setup

### Updated Checkout Component (`Checkout.jsx`)

**Features:**
1. **Real-time Exchange Rate Fetching**
   - Calls `/api/payments/exchange-rate` on mount
   - Auto-refreshes live rate
   - Falls back seamlessly if API fails

2. **Currency Display**
   - Shows USD amount
   - Shows equivalent PHP amount
   - Displays exchange rate used
   - Updates dynamically when method changes

3. **Smart Forms**
   - Auto-fills with user profile data
   - "Use My Profile" button to restore defaults
   - Validates all required fields

4. **Payment Methods**
   - Stripe: Charges in USD
   - GCash: Charges in PHP (calculated from USD)

### Checkout UI Flow

```
[Load Page]
    ↓
[Fetch live exchange rate]
    ↓
[Auto-fill with user data]
    ↓
[Display both USD & PHP amounts]
    ↓
[Select payment method]
    ├─ Stripe (USD)
    └─ GCash (PHP with live conversion)
```

---

## 💰 Currency Conversion Logic

### Example Transaction:

**Scenario:** User buys $100 USD worth of products

#### Stripe Payment:
```
USD Amount:    $100.00
Currency:      USD
Charge Amount: $100.00  (on credit card)
Exchange Rate: 1 USD = ₱56.50 (saved for records)
```

#### GCash Payment:
```
USD Amount:        $100.00
Exchange Rate:     1 USD = ₱56.50 (fetched live)
PHP Amount:        ₱5,650.00
Currency:          PHP
Charge Amount:     ₱5,650.00  (via GCash)
Exchange Rate Used: 56.50      (saved in order)
```

---

## 🔒 Security Measures

### 1. **Backend Validation**
```javascript
✓ Validate all required fields
✓ Verify amount limits (min/max)
✓ Authenticate user (authMiddleware)
✓ Store correct currency with amount
✓ Save exchange rate used (audit trail)
```

### 2. **Secret Key Management**
```env
STRIPE_SECRET_KEY      (only backend)
STRIPE_WEBHOOK_SECRET  (only backend)
PAYMONGO_SECRET_KEY    (only backend)
```

**Frontend only gets:**
```env
VITE_STRIPE_PUBLISHABLE_KEY (public safe key)
VITE_API_URL               (backend URL)
VITE_GOOGLE_CLIENT_ID      (public safe)
```

### 3. **Webhook Verification**
```javascript
// Validate Stripe signature
const event = stripe.webhooks.constructEvent(
  rawBody,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);

// Only process valid events
if (event.type === 'charge.succeeded') {
  // Update order/payment
}
```

---

## 🚀 API Endpoints Reference

### Exchange Rate
```
GET /api/payments/exchange-rate

Response:
{
  "success": true,
  "data": {
    "rate": 56.5,
    "source": "cache",  // cache | api | default
    "timestamp": 1708700000
  }
}
```

### Create Stripe Session
```
POST /api/payments/create-checkout-session
Auth: Required

Body:
{
  "items": [...],
  "shippingAddress": {...}
}

Response:
{
  "sessionId": "cs_test_...",
  "totalAmountUSD": 100.00,
  "currency": "usd"
}
```

### Create GCash Payment
```
POST /api/payments/gcash/create
Auth: Required

Body:
{
  "items": [...],
  "shippingAddress": {...},
  "totalAmount": 100.00
}

Response:
{
  "paymentDetails": {
    "referenceId": "GCH-1708700000-userId",
    "amountUSD": 100.00,
    "amountPHP": 5650.00,
    "exchangeRate": 56.50
  },
  "exchangeRate": "56.50"
}
```

---

## 📊 Data Storage Example

### Order Record (Stripe Payment)
```javascript
{
  orderId: "ORD-1708700000",
  items: [...],
  totalAmount: 100.00,           // USD
  totalAmountPHP: 5650.00,       // Saved for reference
  currency: "usd",               // What we charged
  exchangeRate: 56.50,           // Rate at time of payment
  exchangeRateSource: "cache",   // cache/api/default
  paymentMethod: "stripe",
  paymentStatus: "completed"
}
```

### Order Record (GCash Payment)
```javascript
{
  orderId: "ORD-1708700001",
  items: [...],
  totalAmount: 100.00,           // Original USD
  totalAmountPHP: 5650.00,       // What we charged in PHP
  currency: "php",               // What we charged
  exchangeRate: 56.50,           // Rate at time of payment
  exchangeRateSource: "api",     // cache/api/default
  paymentMethod: "gcash",
  paymentStatus: "pending"
}
```

---

## 🛠️ Setup Instructions

### Step 1: Install Dependencies (if needed)
```bash
npm install axios  # For exchange rate API calls
```

### Step 2: Configure .env
```env
# Exchange Rate API (Optional - uses free API by default)
EXCHANGERATE_API_KEY=your_key_here
OPENEXCHANGE_APP_ID=your_app_id_here

# Existing keys remain unchanged
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...
```

### Step 3: Start Backend & Frontend
```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm run dev
```

### Step 4: Test Payments

**Stripe Test Card:**
```
Number:  4242 4242 4242 4242
Expiry:  12/25
CVC:     123
```

**GCash:**
- Reference ID shown in modal
- Manual payment simulation in dev

---

## 🐛 Troubleshooting

### Exchange Rate API Fails
```
✓ Check internet connection
✓ Verify API endpoint accessibility
✓ System uses default rate (56.5) automatically
✓ Check browser console for errors
```

### Payment Amount Mismatch
```
✓ Verify exchange rate source in order record
✓ Check if conversion formula is correct
✓ Ensure proper decimal handling with .toFixed(2)
```

### Webhook Not Processing
```
✓ Verify webhook secret in .env
✓ Check raw body is used for signature
✓ Ensure endpoint is publicly accessible
```

---

## 📌 Key Changes Summary

| Component | Change | Reason |
|-----------|--------|--------|
| `exchangeRate.js` | ✨ NEW | Real-time conversion |
| `payments.js` | ✨ NEW | Centralized config |
| `paymentController.js` | ✨ UPDATED | Live rate fetching |
| `Order.js` | ✨ UPDATED | Store exchange rate |
| `Payment.js` | ✨ UPDATED | Support both currencies |
| `Checkout.jsx` | ✨ UPDATED | Display live conversion |

---

## 💡 Best Practices

1. **Always validate amounts on backend** - Never trust frontend calculations
2. **Save exchange rate used** - Required for auditing & dispute resolution
3. **Use proper decimal handling** - `.toFixed(2)` to avoid floating point errors
4. **Cache exchange rates** - Reduces API calls & latency
5. **Fall back gracefully** - Default rate if API fails
6. **Log all transactions** - For compliance & debugging

---

## 🔗 Resources

- [ExchangeRate-API](https://exchangerate-api.com) - Free tier: 1500/month
- [Stripe Documentation](https://stripe.com/docs)
- [PayMongo Documentation](https://developers.paymongo.com)
- [Node.js Currency Guide](https://www.npmjs.com/package/dinero.js)

---

**Last Updated:** February 23, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅
