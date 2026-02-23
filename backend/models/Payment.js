const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      unique: true,
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Amount tracking (both currencies)
    amountUSD: {
      type: Number,
      required: true,
    },
    amountPHP: {
      type: Number,
      default: null,
    },
    // Currency information
    currency: {
      type: String,
      enum: ['usd', 'php'],
      required: true,
    },
    // Exchange rate used
    exchangeRate: {
      type: Number,
      default: null,
    },
    exchangeRateSource: {
      type: String,
      enum: ['cache', 'api', 'default'],
      default: null,
    },
    // Payment method & gateway
    paymentMethod: {
      type: String,
      enum: ['stripe', 'paypal', 'cod', 'gcash'],
      required: true,
    },
    gateway: {
      type: String,
      enum: ['stripe', 'paymongo', 'xendit', null],
      default: null,
    },
    // Payment status
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    // Transaction details
    transactionId: String,
    referenceId: String, // For GCash/PayMongo
    sessionId: String,   // For Stripe
    
    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Refund information
    refundAmount: {
      type: Number,
      default: null,
    },
    refundDate: Date,
    refundReason: String,
  },
  { timestamps: true }
);

// Index for quick lookups
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
