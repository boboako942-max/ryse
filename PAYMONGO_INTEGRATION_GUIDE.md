# PayMongo Payment Intent Integration Guide

## Overview
This guide explains how to use the new PayMongo Payment Intent API for processing GCash and other payment methods in StyleHub.

## Setup Prerequisites
1. PayMongo Account: https://paymongo.com
2. API Keys configured in `.env`:
   ```env
   PAYMONGO_PUBLIC_KEY=pk_test_xxxxx
   PAYMONGO_SECRET_KEY=sk_test_xxxxx
   ```

## API Endpoints

### 1. Create Payment Intent
**POST** `/api/payments/paymongo/create-payment-intent`

Creates a PayMongo Payment Intent that clients can use to complete payment.

**Request:**
```javascript
{
  "items": [
    {
      "productId": { "name": "T-Shirt", "price": 29.99 },
      "name": "T-Shirt",
      "price": 29.99,
      "quantity": 1,
      "size": "M",
      "color": "Blue"
    }
  ],
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+639171234567",
    "address": "123 Main St",
    "city": "Manila",
    "state": "NCR",
    "zipCode": "1000",
    "country": "Philippines"
  },
  "totalAmount": 29.99,
  "paymentMethod": "gcash"  // or 'card', 'paymaya'
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "PayMongo Payment Intent created",
  "data": {
    "paymentIntentId": "pi_1234567890",
    "clientKey": "ck_live_xxxx",
    "amount": 1699900,        // In cents: ₱16,999.00
    "amountPHP": 1699.9,
    "amountUSD": 29.99,
    "currency": "PHP",
    "status": "awaiting_payment_method",
    "paymentMethod": "gcash",
    "orderId": "60d5ec49f1b2c72b8c8e4a3b",
    "referenceId": "PI-1708687200000-60d5ec49f1b2c72b8c8e4a3b",
    "exchangeRate": "56.80"
  }
}
```

### 2. Verify Payment
**POST** `/api/payments/paymongo/verify-payment`

Verify that a payment has been completed successfully.

**Request:**
```javascript
{
  "paymentIntentId": "pi_1234567890",
  "referenceId": "PI-1708687200000-60d5ec49f1b2c72b8c8e4a3b"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Payment verified",
  "data": {
    "status": "succeeded",
    "paymentIntentId": "pi_1234567890",
    "referenceId": "PI-1708687200000-60d5ec49f1b2c72b8c8e4a3b",
    "succeeded": true
  }
}
```

## Frontend Implementation

### Using PayMongo's Payment SDK

Add to your `index.html`:
```html
<script src="https://cdn.paymongo.com/js/paymongo.js"></script>
```

### Complete Payment Flow

```javascript
import { paymentsAPI } from '../services/api';

class GCashPaymentFlow {
  async initiatePayment(items, shippingAddress, totalAmount) {
    try {
      // Step 1: Create payment intent on backend
      const response = await paymentsAPI.createPayMongoPaymentIntent({
        items,
        shippingAddress,
        totalAmount,
        paymentMethod: 'gcash'
      });

      const {
        paymentIntentId,
        clientKey,
        amountPHP,
        referenceId
      } = response.data.data;

      // Step 2: Initialize PayMongo
      const paymongo = new PayMongo();

      // Step 3: Initialize payment method (GCash)
      const paymentMethodElement = paymongo.elements.create('payment_method_selector', {
        paymentMethodTypes: ['gcash'],
        redirect: {
          success: `${window.location.origin}/checkout/success?referenceId=${referenceId}`,
          failed: `${window.location.origin}/checkout/failed?referenceId=${referenceId}`
        }
      });

      paymentMethodElement.mount('#payment-method-selector');

      // Step 4: Create payment method when user provides details
      const paymentMethod = await paymentMethodElement.createElement();

      // Step 5: Attach payment method to intent
      const { intent } = await paymongo.confirmPaymentIntent(
        paymentIntentId,
        {
          payment_method: paymentMethod.id,
          return_url: `${window.location.origin}/checkout/callback`
        },
        { key: clientKey } // Use client key for frontend
      );

      // Step 6: Handle the payment status
      if (intent.status === 'succeeded') {
        // Payment successful
        this.handlePaymentSuccess(referenceId, amountPHP);
      } else if (intent.status === 'awaiting_payment_method') {
        // User needs to complete the flow in their GCash app
        // Redirect URL will be called after completion
        console.log('Please check your GCash app to complete the payment');
      }

    } catch (error) {
      console.error('Payment error:', error);
      this.handlePaymentError(error);
    }
  }

  async handlePaymentSuccess(referenceId, amount) {
    // Verify payment on backend
    const response = await paymentsAPI.verifyPayMongoPayment({
      paymentIntentId: this.paymentIntentId,
      referenceId
    });

    if (response.data.data.succeeded) {
      // Update cart and show success
      console.log(`Payment of ₱${amount} successful!`);
      // Clear cart, redirect to order confirmation
    }
  }

  handlePaymentError(error) {
    console.error('Payment failed:', error.message);
    // Show error to user
  }
}
```

### HTML Template

```html
<form id="payment-form">
  <div id="payment-method-selector"></div>
  
  <div class="payment-details">
    <p>Amount: ₱<span id="amount">0.00</span></p>
    <button type="button" id="pay-btn">Proceed to GCash</button>
  </div>
</form>

<script>
document.getElementById('pay-btn').addEventListener('click', async () => {
  const flow = new GCashPaymentFlow();
  await flow.initiatePayment(
    items,
    shippingAddress,
    totalAmount
  );
});
</script>
```

## Webhook Handling

PayMongo sends webhook events for payment state changes:

```javascript
// Events:
// - payment_intent.succeeded
// - payment_intent.failed
// - payment_intent.expired
// - payment_intent.canceled

// Configure in PayMongo Dashboard:
// Webhooks URL: https://yourdomain.com/api/payments/paymongo/webhook
// Events: payment_intent.succeeded, payment_intent.failed
```

## Supported Payment Methods

| Method | Type | Currency | Status |
|--------|------|----------|--------|
| GCash | E-wallet | PHP | ✅ Active |
| PayMaya | Card | PHP | ✅ Active |
| Credit/Debit Card | Card | PHP | ✅ Active |
| Bank Transfer | Bank | PHP | 🔄 Coming Soon |

## Payment Status Flow

```
awaiting_payment_method
        ↓
    ↙       ↘
succeeded   failed
    ↓           ↓
completed   cancelled
```

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `Minimum amount is ₱1.00` | Amount too low | Ensure ₱100 minimum (₱1.00 = 100 cents) |
| `Payment method not supported` | Invalid payment method type | Use: 'gcash', 'card', 'paymaya' |
| `Webhook signature invalid` | Request tampered with | Verify X-Paymongo-Signature header |
| `Payment Intent not found` | Wrong payment intent ID | Check ID format: pi_xxxxxxx |

## Testing

Use these test credentials:

**GCash Test:**
- Amount: ₱100+
- Status: Will redirect to GCash app flow

**Test API Keys:**
```env
# Sandbox (Testing)
PAYMONGO_PUBLIC_KEY=pk_test_xxxxxx
PAYMONGO_SECRET_KEY=sk_test_xxxxxx

# Live (Production)
PAYMONGO_PUBLIC_KEY=pk_live_xxxxxx
PAYMONGO_SECRET_KEY=sk_live_xxxxxx
```

## Best Practices

1. **Always verify on backend** - Never trust frontend payment confirmation
2. **Use webhooks** - Process `payment_intent.succeeded` events to update orders
3. **Store payment intent ID** - Link it to orders for future reference
4. **Handle timeouts** - Payment intents expire after 1 hour
5. **Log everything** - Maintain audit trail for payment transactions
6. **Use client key for frontend** - Never expose secret key to browser

## Troubleshooting

### Payment shows "pending" indefinitely
- Check PayMongo webhook is receiving events
- Verify webhook signature is valid
- Check payment intent status manually via API

### GCash redirect not working
- Verify return URL is correct
- Check PayMongo app is installed on test device
- Ensure payment method type is 'gcash'

### Exchange rate not updating
- Check exchangerate-api.com is accessible
- Verify EXCHANGERATE_API_KEY is set
- Check fallback rate is being used (56.5 PHP)

## Support

For more details:
- PayMongo Docs: https://developers.paymongo.com
- Support: support@paymongo.com
