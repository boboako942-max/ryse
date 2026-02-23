/**
 * Payment Configuration
 * Centralized settings for payment processing
 */

module.exports = {
  // Currency settings
  CURRENCIES: {
    USD: 'usd',
    PHP: 'php',
  },

  // Payment methods
  PAYMENT_METHODS: {
    STRIPE: 'stripe',
    GCASH: 'gcash',
    PAYPAL: 'paypal',
    COD: 'cod',
  },

  // Payment gateways
  GATEWAYS: {
    STRIPE: 'stripe',
    PAYMONGO: 'paymongo',
    XENDIT: 'xendit',
  },

  // Order statuses
  ORDER_STATUSES: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
  },

  // Payment statuses
  PAYMENT_STATUSES: {
    PENDING: 'pending',
    SUCCEEDED: 'succeeded',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    CANCELLED: 'cancelled',
  },

  // Currency mappings for different payment methods
  METHOD_CURRENCIES: {
    stripe: 'usd',        // Stripe charges in USD
    gcash: 'php',         // GCash charges in PHP
    paypal: 'usd',        // PayPal typically in USD
    cod: 'php',           // COD in PHP (Philippines)
  },

  // Minimum and maximum amounts (in base currency)
  AMOUNT_LIMITS: {
    STRIPE_MIN_USD: 0.5,
    STRIPE_MAX_USD: 999999.99,
    GCASH_MIN_PHP: 1,
    GCASH_MAX_PHP: 999999.99,
  },

  // Stripe configuration
  STRIPE: {
    CURRENCY: 'usd',
    PAYMENT_METHOD_TYPES: ['card'],
    WEBHOOK_EVENTS: ['payment_intent.succeeded', 'payment_intent.payment_failed'],
  },

  // GCash/PayMongo configuration
  PAYMONGO: {
    CURRENCY: 'php',
    WEBHOOK_EVENTS: ['charge.paid', 'charge.expired', 'charge.failed'],
  },

  // Default values
  DEFAULTS: {
    COUNTRY: 'Philippines',
    CURRENCY: 'PHP',
    EXCHANGE_RATE_SOURCE: 'exchangerate-api', // or 'openexchangerates'
  },

  // Exchange rate settings
  EXCHANGE_RATE: {
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    API_TIMEOUT: 5000, // 5 seconds
    DEFAULT_RATE: 56.5, // Fallback rate when API fails
  },

  // Success/Cancel URLs
  getSuccessUrl: (frontend_url, session_id) => `${frontend_url}/payment-success?session_id=${session_id}`,
  getCancelUrl: (frontend_url) => `${frontend_url}/checkout`,
  getCallbackUrl: (frontend_url, reference_id) => `${frontend_url}/payment-callback?reference_id=${reference_id}`,
};
