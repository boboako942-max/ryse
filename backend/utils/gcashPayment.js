// GCash Payment Utilities
const axios = require('axios');
const gcashConfig = require('../config/gcash');

class GCashPaymentHandler {
  /**
   * Create GCash payment via Paymongo
   * Documentation: https://developers.paymongo.com/reference/create-source
   */
  static async createPaymongoPayment(paymentData) {
    try {
      const { amount, currency, description, returnUrl } = paymentData;

      const response = await axios.post(
        `${gcashConfig.paymongo.apiUrl}/sources`,
        {
          data: {
            attributes: {
              amount: Math.round(amount * 100), // Convert to cents
              currency: currency || 'PHP',
              type: 'gcash',
              redirect: {
                success: returnUrl,
                failed: returnUrl,
              },
            },
          },
        },
        {
          auth: {
            username: gcashConfig.paymongo.secretKey,
            password: '',
          },
        }
      );

      return response.data.data;
    } catch (error) {
      throw new Error(`Paymongo payment creation failed: ${error.message}`);
    }
  }

  /**
   * Verify GCash payment with Paymongo
   */
  static async verifyPaymongoPayment(sourceId) {
    try {
      const response = await axios.get(
        `${gcashConfig.paymongo.apiUrl}/sources/${sourceId}`,
        {
          auth: {
            username: gcashConfig.paymongo.secretKey,
            password: '',
          },
        }
      );

      const source = response.data.data;
      return {
        status: source.attributes.status,
        amount: source.attributes.amount / 100, // Convert from cents
        currency: source.attributes.currency,
      };
    } catch (error) {
      throw new Error(`Paymongo payment verification failed: ${error.message}`);
    }
  }

  /**
   * Create GCash payment via Xendit
   * Documentation: https://developers.xendit.co/api-reference/#create-ewallets-charge
   */
  static async createXenditPayment(paymentData) {
    try {
      const { amount, currency, description, redirectUrl, referenceId } = paymentData;

      const response = await axios.post(
        `${gcashConfig.xendit.apiUrl}/ewallets/charges`,
        {
          reference_id: referenceId,
          currency: currency || 'PHP',
          amount: amount,
          checkout_method: 'WEB',
          channel_code: 'GCASH',
          channel_properties: {
            success_redirect_url: redirectUrl,
            failure_redirect_url: redirectUrl,
          },
          metadata: {
            order_id: referenceId,
            description: description,
          },
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${gcashConfig.xendit.apiKey}:`).toString('base64')}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Xendit payment creation failed: ${error.message}`);
    }
  }

  /**
   * Verify GCash payment with Xendit
   */
  static async verifyXenditPayment(chargeId) {
    try {
      const response = await axios.get(
        `${gcashConfig.xendit.apiUrl}/ewallets/charges/${chargeId}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${gcashConfig.xendit.apiKey}:`).toString('base64')}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Xendit payment verification failed: ${error.message}`);
    }
  }

  /**
   * Validate webhook signature from Paymongo
   */
  static validatePaymongoWebhook(payload, signature, secret) {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('base64');

    return hash === signature;
  }

  /**
   * Validate webhook signature from Xendit
   */
  static validateXenditWebhook(headers, body) {
    const crypto = require('crypto');
    const xInboundSignature = headers['x-inbound-signature'];
    const webhookSecret = gcashConfig.xendit.apiKey;

    if (!xInboundSignature) {
      return false;
    }

    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(body))
      .digest('base64');

    return xInboundSignature === computedSignature;
  }

  /**
   * Format payment status for consistent response
   */
  static formatPaymentStatus(status) {
    const statusMap = {
      // Paymongo statuses
      pending: 'pending',
      succeeded: 'succeeded',
      failed: 'failed',
      chargeable: 'pending',
      // Xendit statuses
      PENDING: 'pending',
      COMPLETED: 'succeeded',
      FAILED: 'failed',
      EXPIRED: 'failed',
      // Generic
      completed: 'succeeded',
      success: 'succeeded',
    };

    return statusMap[status] || status;
  }
}

module.exports = GCashPaymentHandler;
