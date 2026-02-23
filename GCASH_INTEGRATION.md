# GCash Payment Integration Guide

This document explains how to set up and use GCash payment processing in the StyleHub application.

## Overview

GCash is a popular mobile money service in the Philippines. The StyleHub backend supports GCash payments through three integration options:

1. **Paymongo** (Recommended - Easiest to set up)
2. **Xendit** (Alternative option with good Philippines coverage)
3. **Direct GCash Integration** (If you have direct partnership with GCash)

## Setup Instructions

### Option 1: Paymongo Integration (Recommended)

#### Step 1: Create Paymongo Account
1. Go to https://paymongo.com
2. Sign up and create a business account
3. Verify your identity and business information

#### Step 2: Get API Keys
1. Navigate to your Dashboard > Developers > API Keys
2. Copy your **Public Key** and **Secret Key**

#### Step 3: Add to .env File
```env
# Paymongo Configuration
PAYMONGO_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYMONGO_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

#### Step 4: Set Webhook URL
In Paymongo Dashboard:
1. Go to Developers > Webhooks
2. Add webhook URL: `https://yourapp.com/api/payments/gcash/webhook`
3. Subscribe to these events:
   - `source.chargeable`
   - `charge.paid`
   - `charge.failed`

---

### Option 2: Xendit Integration

#### Step 1: Create Xendit Account
1. Go to https://xendit.co
2. Sign up and verify your account
3. Complete KYC verification

#### Step 2: Get API Key
1. Navigate to Settings > API Keys
2. Copy your **API Key**

#### Step 3: Add to .env File
```env
# Xendit Configuration
XENDIT_API_KEY=xnd_live_xxxxxxxxxxxxx
```

#### Step 4: Set Webhook URL
In Xendit Dashboard:
1. Go to Settings > Endpoints
2. Add webhook URL: `https://yourapp.com/api/payments/gcash/webhook`
3. Select eWallet charge events

---

### Option 3: Direct GCash Integration

This requires direct partnership with GCash. Contact GCash business support for:
- Merchant ID
- API Key
- Webhook Secret

Add to .env File:
```env
# Direct GCash Integration
GCASH_MERCHANT_ID=YOUR_MERCHANT_ID
GCASH_API_KEY=YOUR_API_KEY
GCASH_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
```

---

## API Endpoints

### Create GCash Payment
```http
POST /api/payments/gcash/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "name": "Product Name",
      "price": 1000,
      "quantity": 1,
      "size": "M",
      "color": "Blue"
    }
  ],
  "shippingAddress": {
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "email": "juan@example.com",
    "phone": "+639123456789",
    "address": "123 Main St",
    "city": "Manila",
    "state": "Metro Manila",
    "zipCode": "1234",
    "country": "Philippines"
  },
  "paymentGateway": "paymongo"
}
```

**Response:**
```json
{
  "success": true,
  "message": "GCash payment request created",
  "data": {
    "paymentDetails": {
      "referenceId": "GCH-1645634892123-userId",
      "amount": 1000,
      "currency": "PHP",
      "description": "StyleHub Order - ORD-1645634892123",
      "redirectUrl": "http://localhost:8000/payment-callback?reference_id=..."
    },
    "orderId": "order_id_here",
    "referenceId": "GCH-1645634892123-userId"
  }
}
```

### Verify GCash Payment
```http
POST /api/payments/gcash/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "referenceId": "GCH-1645634892123-userId"
}
```

### Get Payment Status
```http
GET /api/payments/gcash/status/{referenceId}
Authorization: Bearer {token}
```

### Cancel GCash Payment
```http
POST /api/payments/gcash/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "referenceId": "GCH-1645634892123-userId"
}
```

### GCash Webhook
```http
POST /api/payments/gcash/webhook
Content-Type: application/json

{
  "event": "payment.paid",
  "data": {
    "referenceId": "GCH-1645634892123-userId",
    "paymentId": "charge_id_or_source_id",
    "status": "completed",
    "amount": 1000
  }
}
```

---

## Frontend Integration

### Example: Create GCash Payment
```javascript
// In your frontend (React)
async function initiateGCashPayment(items, shippingAddress) {
  const response = await fetch('/api/payments/gcash/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      items,
      shippingAddress,
      paymentGateway: 'paymongo'
    })
  });

  const result = await response.json();
  
  if (result.success) {
    const { paymentDetails } = result.data;
    
    // Redirect to payment gateway based on your integration
    // For Paymongo: redirect to source.checkout_url
    // For Xendit: redirect to charge.checkout_url
    
    window.location.href = paymentDetails.redirectUrl;
  }
}
```

### Example: Verify Payment After Redirect
```javascript
// After user completes payment and is redirected back
async function verifyPayment(referenceId) {
  const response = await fetch('/api/payments/gcash/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ referenceId })
  });

  const result = await response.json();
  
  if (result.success) {
    // Payment verified, redirect to success page
    window.location.href = '/success';
  } else {
    // Payment failed, show error message
    alert(result.message);
  }
}
```

---

## Testing

### Test with Paymongo
1. Use test API keys (starts with `pk_test_` and `sk_test_`)
2. Paymongo provides test GCash credentials in their dashboard
3. Process test payments to verify integration

### Test with Xendit
1. Use test API key from Xendit
2. Xendit provides test mobile number for GCash testing
3. Test payments will show in your test dashboard

### Test Webhook
Use a tool like cURL or Postman to test webhook:
```bash
curl -X POST http://localhost:9000/api/payments/gcash/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payment.paid",
    "data": {
      "referenceId": "GCH-test-123",
      "paymentId": "test-payment-id",
      "status": "completed",
      "amount": 1000
    }
  }'
```

---

## Troubleshooting

### Payment Not Showing in Database
- Check MongoDB connection
- Verify .env variables are loaded
- Check server logs for errors

### Webhook Not Processing
- Verify webhook URL is correct and accessible
- Check webhook secret configuration
- Ensure payment gateway can reach your server

### Payment Status Not Updating
- Check webhook is being called
- Verify database connection
- Check for any validation errors in logs

### Currency Issues
- GCash primarily uses PHP currency
- For USD transactions, conversion may be needed
- Update shipping address country detection logic if not automatically detecting Philippines

---

## Best Practices

1. **Always verify payment on backend** - Don't trust frontend-only verification
2. **Handle webhook failures gracefully** - Implement retry logic
3. **Log all transactions** - Keep detailed records for auditing
4. **Test thoroughly** - Use test mode before going live
5. **Secure API keys** - Never commit keys to version control
6. **Implement timeout handling** - GCash payments may take time to process
7. **Handle cancelled payments** - Implement proper error handling

---

## Security Considerations

1. All API keys should be in .env file (never in code)
2. Webhook signatures should be validated
3. Use HTTPS in production
4. Implement rate limiting on payment endpoints
5. Validate all user input
6. Encrypt sensitive payment data
7. Follow PCI DSS compliance requirements

---

## Support

For issues:
- **Paymongo Support**: https://paymongo.com/support
- **Xendit Support**: https://xendit.co/support
- **GCash Business**: https://www.gcash.com/business

---

## Additional Resources

- [Paymongo API Documentation](https://developers.paymongo.com)
- [Xendit API Documentation](https://developers.xendit.co)
- [GCash Business Solutions](https://www.gcash.com/business)
- [StyleHub Documentation](../README.md)
