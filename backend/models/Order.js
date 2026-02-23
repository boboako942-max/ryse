const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        name: String,
        price: Number,
        quantity: Number,
        size: String,
        color: String,
      },
    ],
    // Amount tracking
    totalAmount: {
      type: Number,
      required: true,
    },
    totalAmountPHP: {
      type: Number,
      default: null,
    },
    // Currency information
    currency: {
      type: String,
      enum: ['usd', 'php'],
      default: 'php',
    },
    exchangeRate: {
      type: Number,
      default: null, // Will store the actual exchange rate used
    },
    exchangeRateSource: {
      type: String,
      enum: ['cache', 'api', 'default'],
      default: null,
    },
    // Shipping information
    shippingAddress: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    // Payment information
    paymentId: String,
    paymentMethod: {
      type: String,
      enum: ['stripe', 'paypal', 'cod', 'gcash'],
      default: 'stripe',
    },
    paymentGateway: {
      type: String,
      enum: ['stripe', 'paymongo', 'xendit', null],
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    // Additional details
    notes: String,
    trackingNumber: String,
    refundAmount: {
      type: Number,
      default: null,
    },
    refundReason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
