// GCash Payment Configuration
// This configuration is for demonstration. In production, integrate with:
// - GCash API (https://developer.gcash.com)
// - Paymongo (https://paymongo.com) - popular Philippines payment gateway that supports GCash
// - Xendit (https://xendit.co) - supports GCash payments

const gcashConfig = {
  // For Paymongo integration
  paymongo: {
    publicKey: process.env.PAYMONGO_PUBLIC_KEY || 'pk_test_your_key',
    secretKey: process.env.PAYMONGO_SECRET_KEY || 'sk_test_your_key',
    apiUrl: 'https://api.paymongo.com/v1',
  },
  
  // For Xendit integration
  xendit: {
    apiKey: process.env.XENDIT_API_KEY || 'xnd_test_your_key',
    apiUrl: 'https://api.xendit.co',
  },

  // Configuration for direct GCash integration (if available)
  directIntegration: {
    merchantId: process.env.GCASH_MERCHANT_ID,
    apiKey: process.env.GCASH_API_KEY,
    apiUrl: 'https://api.gcash.com',
  },

  // Supported currencies for GCash
  supportedCurrencies: ['PHP', 'USD'],
  
  // Default currency for GCash
  defaultCurrency: 'PHP',

  // Webhook configuration
  webhook: {
    secret: process.env.GCASH_WEBHOOK_SECRET,
    timeout: 30000,
  },
};

module.exports = gcashConfig;
