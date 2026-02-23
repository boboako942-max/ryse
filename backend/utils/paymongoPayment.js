/**
 * PayMongo Payment Handler using Payment Intent API
 * Supports: GCash, PayMaya, Credit/Debit Cards
 * Reference: https://developers.paymongo.com/reference/payment-intents-api
 */

const axios = require('axios');
const paymongoConfig = require('../config/paymongo');

class PayMongoPaymentHandler {
  /**
   * Initialize Axios instance with authentication
   */
  static getAxiosInstance() {
    const auth = Buffer.from(`${paymongoConfig.secretKey}:`).toString('base64');
    return axios.create({
      baseURL: paymongoConfig.apiUrl,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create Payment Intent
   * This is the main entry point for creating a payment
   * 
   * @param {Object} paymentData - Payment details
   * @param {number} paymentData.amount - Amount in PHP (in cents)
   * @param {string} paymentData.currency - Currency code (default: PHP)
   * @param {string} paymentData.description - Payment description
   * @param {array} paymentData.paymentMethodTypes - ['gcash', 'card', 'paymaya']
   * @param {string} paymentData.statementDescriptor - What appears on statement
   * @param {string} paymentData.returnUrl - URL after payment
   * @param {Object} paymentData.metadata - Custom metadata
   * @returns {Promise<Object>} Payment Intent details
   */
  static async createPaymentIntent(paymentData) {
    try {
      const {
        amount,
        currency = 'PHP',
        description,
        paymentMethodTypes = ['gcash'],
        statementDescriptor = 'StyleHub',
        returnUrl,
        metadata = {},
      } = paymentData;

      // Validate amount (minimum 100 PHP = ₱1.00)
      if (amount < 100) {
        throw new Error(`Minimum amount is ₱${100 / 100}.00 (PHP)`);
      }

      const axios = this.getAxiosInstance();

      const payload = {
        data: {
          attributes: {
            amount, // In cents
            currency,
            description,
            payment_method_allowed: paymentMethodTypes, // PayMongo requires this field name
            statement_descriptor: statementDescriptor,
            return_url: returnUrl,
            metadata,
          },
        },
      };

      console.log('PayMongo Payment Intent Payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post('/payment_intents', payload);

      console.log('Payment Intent created:', response.data.data.id);
      return response.data.data;
    } catch (error) {
      console.error('PayMongo Payment Intent Error:', error.response?.data || error.message);
      throw new Error(`Payment Intent creation failed: ${error.response?.data?.errors?.[0]?.detail || error.message}`);
    }
  }

  /**
   * Retrieve Payment Intent
   * Get current status of a payment intent
   * 
   * @param {string} paymentIntentId - The payment intent ID
   * @returns {Promise<Object>} Payment Intent details with current status
   */
  static async getPaymentIntent(paymentIntentId) {
    try {
      const axios = this.getAxiosInstance();

      const response = await axios.get(`/payment_intents/${paymentIntentId}`);

      return response.data.data;
    } catch (error) {
      console.error('PayMongo Get Payment Intent Error:', error.response?.data || error.message);
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  /**
   * Attach Payment Method to Payment Intent
   * This finalizes the payment attempt
   * 
   * @param {string} paymentIntentId - Payment intent ID
   * @param {string} paymentMethodId - Payment method ID (from client)
   * @returns {Promise<Object>} Updated payment intent
   */
  static async attachPaymentMethod(paymentIntentId, paymentMethodId) {
    try {
      const axios = this.getAxiosInstance();

      const response = await axios.post(`/payment_intents/${paymentIntentId}/attach`, {
        data: {
          attributes: {
            payment_method: paymentMethodId,
          },
        },
      });

      console.log('Payment Method attached:', paymentIntentId);
      return response.data.data;
    } catch (error) {
      console.error('PayMongo Attach Payment Method Error:', error.response?.data || error.message);
      throw new Error(`Failed to attach payment method: ${error.response?.data?.errors?.[0]?.detail || error.message}`);
    }
  }

  /**
   * Create Payment Method (Client-side alternative)
   * Typically done on the client for security
   * Kept here for reference/testing
   * 
   * @param {Object} paymentMethodData
   * @returns {Promise<Object>} Payment method details
   */
  static async createPaymentMethod(paymentMethodData) {
    try {
      const {
        type = 'gcash',
        billing = {},
      } = paymentMethodData;

      const axios = this.getAxiosInstance();

      const response = await axios.post('/payment_methods', {
        data: {
          attributes: {
            type,
            billing,
          },
        },
      });

      console.log('Payment Method created:', response.data.data.id);
      return response.data.data;
    } catch (error) {
      console.error('PayMongo Create Payment Method Error:', error.response?.data || error.message);
      throw new Error(`Failed to create payment method: ${error.message}`);
    }
  }

  /**
   * Cancel Payment Intent
   * Used when user cancels or payment times out
   * 
   * @param {string} paymentIntentId - Payment intent ID to cancel
   * @returns {Promise<Object>} Cancelled payment intent
   */
  static async cancelPaymentIntent(paymentIntentId) {
    try {
      const axios = this.getAxiosInstance();

      const response = await axios.post(`/payment_intents/${paymentIntentId}/cancel`, {
        data: {
          attributes: {},
        },
      });

      console.log('Payment Intent cancelled:', paymentIntentId);
      return response.data.data;
    } catch (error) {
      console.error('PayMongo Cancel Payment Intent Error:', error.response?.data || error.message);
      throw new Error(`Failed to cancel payment intent: ${error.message}`);
    }
  }

  /**
   * Refund a Payment
   * Process refund for a completed payment
   * 
   * @param {string} paymentId - The payment ID to refund
   * @param {number} amount - Refund amount in cents (null = full refund)
   * @param {string} reason - Reason for refund
   * @returns {Promise<Object>} Refund details
   */
  static async refundPayment(paymentId, amount = null, reason = 'Customer request') {
    try {
      const axios = this.getAxiosInstance();

      const refundData = {
        data: {
          attributes: {
            notes: reason,
          },
        },
      };

      if (amount) {
        refundData.data.attributes.amount = amount;
      }

      const response = await axios.post(`/payments/${paymentId}/refunds`, refundData);

      console.log('Refund processed:', response.data.data.id);
      return response.data.data;
    } catch (error) {
      console.error('PayMongo Refund Error:', error.response?.data || error.message);
      throw new Error(`Refund failed: ${error.message}`);
    }
  }

  /**
   * Parse and verify webhook signature
   * Security: Verify PayMongo webhook authenticity
   * 
   * @param {string} payload - Raw request body
   * @param {string} signature - X-Paymongo-Signature header
   * @returns {boolean} Signature is valid
   */
  static verifyWebhookSignature(payload, signature) {
    const crypto = require('crypto');
    const secret = paymongoConfig.secretKey;
    
    const hash = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return hash === signature;
  }

  /**
   * Process webhook event
   * Handle various webhook events from PayMongo
   * 
   * @param {Object} event - Webhook event object
   * @returns {Promise<void>}
   */
  static async handleWebhookEvent(event) {
    const eventType = event.type;
    const attributes = event.data.attributes;

    console.log(`Processing webhook event: ${eventType}`);

    switch (eventType) {
      case 'payment_intent.succeeded':
        return this._handlePaymentSucceeded(event);
      case 'payment_intent.failed':
        return this._handlePaymentFailed(event);
      case 'payment_intent.expired':
        return this._handlePaymentExpired(event);
      case 'payment_intent.canceled':
        return this._handlePaymentCanceled(event);
      default:
        console.log(`Unknown webhook event: ${eventType}`);
    }
  }

  // Private webhook handlers
  static async _handlePaymentSucceeded(event) {
    const Payment = require('../models/Payment');
    const Order = require('../models/Order');

    const paymentIntentId = event.data.id;
    const metadata = event.data.attributes.metadata || {};

    try {
      // Update payment
      await Payment.findOneAndUpdate(
        { paymentId: metadata.paymentId },
        { status: 'succeeded' },
        { new: true }
      );

      // Update order
      await Order.findOneAndUpdate(
        { _id: metadata.orderId },
        { paymentStatus: 'completed', orderStatus: 'confirmed' },
        { new: true }
      );

      console.log('Payment succeeded:', paymentIntentId);
    } catch (error) {
      console.error('Error handling payment succeeded webhook:', error);
    }
  }

  static async _handlePaymentFailed(event) {
    const Payment = require('../models/Payment');
    const Order = require('../models/Order');

    const metadata = event.data.attributes.metadata || {};

    try {
      await Payment.findOneAndUpdate(
        { paymentId: metadata.paymentId },
        { status: 'failed' },
        { new: true }
      );

      await Order.findOneAndUpdate(
        { _id: metadata.orderId },
        { paymentStatus: 'failed' },
        { new: true }
      );

      console.log('Payment failed:', event.data.id);
    } catch (error) {
      console.error('Error handling payment failed webhook:', error);
    }
  }

  static async _handlePaymentExpired(event) {
    const Payment = require('../models/Payment');
    const metadata = event.data.attributes.metadata || {};

    try {
      await Payment.findOneAndUpdate(
        { paymentId: metadata.paymentId },
        { status: 'cancelled' },
        { new: true }
      );

      console.log('Payment expired:', event.data.id);
    } catch (error) {
      console.error('Error handling payment expired webhook:', error);
    }
  }

  static async _handlePaymentCanceled(event) {
    const Payment = require('../models/Payment');
    const metadata = event.data.attributes.metadata || {};

    try {
      await Payment.findOneAndUpdate(
        { paymentId: metadata.paymentId },
        { status: 'cancelled' },
        { new: true }
      );

      console.log('Payment cancelled:', event.data.id);
    } catch (error) {
      console.error('Error handling payment cancelled webhook:', error);
    }
  }
}

module.exports = PayMongoPaymentHandler;
