/**
 * PayMongo Configuration
 * Handles Payment Intents, Payment Methods, and Webhooks
 */

module.exports = {
  apiUrl: 'https://api.paymongo.com/v1',
  publicKey: process.env.PAYMONGO_PUBLIC_KEY,
  secretKey: process.env.PAYMONGO_SECRET_KEY,

  // Payment Intent settings
  paymentIntent: {
    currency: 'PHP',
    statementDescriptor: 'StyleHub Payment',
    redirectUrl: process.env.FRONTEND_URL,
  },

  // Payment Methods
  paymentMethods: {
    gcash: 'gcash',
    card: 'card',
    paymaya: 'paymaya',
  },

  // Error handling
  errors: {
    INVALID_AMOUNT: 'Invalid payment amount',
    PAYMENT_FAILED: 'Payment processing failed',
    PAYMENT_CANCELLED: 'Payment was cancelled',
    INVALID_CURRENCY: 'Invalid currency specified',
  },

  // Minimum amounts
  minAmount: {
    php: 100, // ₱100 minimum
    usd: 2,   // $2 USD equivalent
  },

  // Webhook events to handle
  webhookEvents: {
    PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
    PAYMENT_INTENT_FAILED: 'payment_intent.failed',
    PAYMENT_INTENT_EXPIRED: 'payment_intent.expired',
    PAYMENT_INTENT_CANCELED: 'payment_intent.canceled',
  },
};
