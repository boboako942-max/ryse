const stripe = require('../config/stripe');
const axios = require('axios');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { sendResponse, sendError } = require('../utils/response');
const { fetchExchangeRate, convertUSDtoPHP, convertPHPtoUSD } = require('../utils/exchangeRate');
const paymentConfig = require('../config/payments');
const PayMongoPaymentHandler = require('../utils/paymongoPayment');

/**
 * Create Stripe Checkout Session
 * Charges in USD
 */
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!items || items.length === 0 || !shippingAddress) {
      return sendError(res, 400, 'Missing required fields');
    }

    // Calculate total USD amount
    const totalAmountUSD = calculateTotal(items);

    // Validate amount
    if (totalAmountUSD < paymentConfig.AMOUNT_LIMITS.STRIPE_MIN_USD) {
      return sendError(res, 400, `Minimum amount is $${paymentConfig.AMOUNT_LIMITS.STRIPE_MIN_USD}`);
    }

    // Build line items for Stripe
    const lineItems = items.map((item) => {
      const productName = item.name || (item.productId && item.productId.name) || 'Product';
      const productPrice = item.price || (item.productId && item.productId.price) || 0;

      return {
        price_data: {
          currency: paymentConfig.STRIPE.CURRENCY,
          product_data: {
            name: productName,
            description: `Size: ${item.size || 'N/A'}, Color: ${item.color || 'N/A'}`,
          },
          unit_amount: Math.round(productPrice * 100), // Convert to cents
        },
        quantity: item.quantity || 1,
      };
    });

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentConfig.STRIPE.PAYMENT_METHOD_TYPES,
      line_items: lineItems,
      mode: 'payment',
      success_url: paymentConfig.getSuccessUrl(process.env.FRONTEND_URL, '{CHECKOUT_SESSION_ID}'),
      cancel_url: paymentConfig.getCancelUrl(process.env.FRONTEND_URL),
      customer_email: shippingAddress.email,
      metadata: {
        userId: req.user.id.toString(),
        shippingAddress: JSON.stringify(shippingAddress),
        itemCount: items.length.toString(),
        totalAmountUSD: totalAmountUSD.toString(),
      },
    });

    return sendResponse(res, 200, true, 'Checkout session created', {
      sessionId: session.id,
      clientSecret: session.client_secret,
      totalAmountUSD,
      currency: 'usd',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create GCash Payment (PayMongo)
 * Charges in PHP with real-time conversion
 */
exports.createGCashPayment = async (req, res, next) => {
  try {
    const { items, shippingAddress, totalAmount } = req.body;

    if (!items || items.length === 0 || !shippingAddress || !totalAmount) {
      return sendError(res, 400, 'Missing required fields');
    }

    // Fetch real-time exchange rate
    const exchangeRateData = await fetchExchangeRate();
    const exchangeRate = exchangeRateData.rate;

    // Convert USD to PHP
    const totalAmountPHP = convertUSDtoPHP(totalAmount, exchangeRate);

    // Validate amount
    if (totalAmountPHP < paymentConfig.AMOUNT_LIMITS.GCASH_MIN_PHP) {
      return sendError(res, 400, `Minimum amount is ₱${paymentConfig.AMOUNT_LIMITS.GCASH_MIN_PHP}`);
    }

    // Generate unique IDs
    const referenceId = `GCH-${Date.now()}-${req.user.id}`;
    const orderId = `ORD-${Date.now()}`;

    // Create order
    const order = await Order.create({
      orderId,
      userId: req.user.id,
      items,
      totalAmount, // USD amount
      totalAmountPHP,
      currency: 'php',
      exchangeRate,
      exchangeRateSource: exchangeRateData.source,
      shippingAddress,
      paymentMethod: 'gcash',
      paymentGateway: 'paymongo',
      paymentId: referenceId,
      paymentStatus: 'pending',
      orderStatus: 'pending',
    });

    // Create payment record
    const payment = await Payment.create({
      paymentId: referenceId,
      orderId: order._id,
      userId: req.user.id,
      amountUSD: totalAmount,
      amountPHP: totalAmountPHP,
      currency: 'php',
      exchangeRate,
      exchangeRateSource: exchangeRateData.source,
      paymentMethod: 'gcash',
      gateway: 'paymongo',
      referenceId,
      status: 'pending',
      metadata: {
        exchangeRateSource: exchangeRateData.source,
        timestamp: new Date(),
      },
    });

    // Prepare payment details
    const paymentDetails = {
      referenceId,
      orderId: orderId,
      amountUSD: totalAmount,
      amountPHP: totalAmountPHP,
      exchangeRate: exchangeRate.toFixed(2),
      currency: 'php',
      description: `StyleHub Order - ${orderId}`,
      customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
      customerEmail: shippingAddress.email,
      customerPhone: shippingAddress.phone,
      redirectUrl: paymentConfig.getCallbackUrl(process.env.FRONTEND_URL, referenceId),
      instructions: {
        step1: 'Open your GCash app',
        step2: 'Go to "Send Money"',
        step3: 'Send payment to merchant',
        step4: `Amount: ₱${totalAmountPHP.toFixed(2)}`,
        step5: `Reference: ${referenceId}`,
      },
    };

    return sendResponse(res, 200, true, 'GCash payment request created', {
      paymentDetails,
      exchangeRate: exchangeRate.toFixed(2),
      orderId: order._id,
      referenceId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create GCash Checkout Session with PayMongo
 * Uses PayMongo's Checkout Sessions API for streamlined GCash payments
 */
exports.createGCashCheckoutSession = async (req, res, next) => {
  try {
    const { items, shippingAddress, totalAmount } = req.body;

    if (!items || items.length === 0 || !shippingAddress || !totalAmount) {
      return sendError(res, 400, 'Missing required fields');
    }

    // Fetch real-time exchange rate
    const exchangeRateData = await fetchExchangeRate();
    const exchangeRate = exchangeRateData.rate;

    // Convert USD to PHP
    const totalAmountPHP = convertUSDtoPHP(totalAmount, exchangeRate);
    const totalAmountInCents = Math.round(totalAmountPHP * 100);

    // Validate amount (minimum ₱100 = PHP 1.00)
    if (totalAmountInCents < 100) {
      return sendError(res, 400, 'Minimum amount is ₱1.00');
    }

    // Generate unique IDs
    const referenceId = `GCHS-${Date.now()}-${req.user.id}`;
    const orderId = `ORD-${Date.now()}`;

    // Create order
    const order = await Order.create({
      orderId,
      userId: req.user.id,
      items,
      totalAmount, // USD amount
      totalAmountPHP,
      currency: 'php',
      exchangeRate,
      exchangeRateSource: exchangeRateData.source,
      shippingAddress,
      paymentMethod: 'gcash',
      paymentGateway: 'paymongo',
      paymentId: referenceId,
      paymentStatus: 'pending',
      orderStatus: 'pending',
    });

    // Create payment record
    const payment = await Payment.create({
      paymentId: referenceId,
      orderId: order._id,
      userId: req.user.id,
      amountUSD: totalAmount,
      amountPHP: totalAmountPHP,
      currency: 'php',
      exchangeRate,
      exchangeRateSource: exchangeRateData.source,
      paymentMethod: 'gcash',
      gateway: 'paymongo',
      referenceId,
      status: 'pending',
      metadata: {
        exchangeRateSource: exchangeRateData.source,
        timestamp: new Date(),
      },
    });

    // Prepare line items for checkout
    const lineItems = items.map((item) => ({
      name: item.productId?.name || item.name || 'Product',
      description: item.productId?.description || item.description || '',
      amount: Math.round((item.price || 0) * 100),
      currency: 'PHP',
      quantity: item.quantity || 1,
    }));

    // Create PayMongo Checkout Session
    const checkoutSessionPayload = {
      data: {
        attributes: {
          billing: {
            name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
            email: shippingAddress.email,
            phone: shippingAddress.phone,
            address: {
              line1: shippingAddress.address,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postal_code: shippingAddress.zipCode,
              country: 'PH',
            },
          },
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          line_items: lineItems,
          payment_method_types: ['gcash'],
          success_url: `${process.env.FRONTEND_URL}/checkout/success?sessionId={CHECKOUT_SESSION_ID}&referenceId=${referenceId}`,
          cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel?referenceId=${referenceId}`,
          metadata: {
            orderId: orderId,
            paymentId: referenceId,
            userId: req.user.id.toString(),
          },
        },
      },
    };

    const checkoutResponse = await axios.post(
      'https://api.paymongo.com/v1/checkout_sessions',
      checkoutSessionPayload,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const checkoutUrl = checkoutResponse.data.data.attributes.checkout_url;
    const sessionId = checkoutResponse.data.data.id;

    // Update payment with session ID
    await Payment.findByIdAndUpdate(payment._id, {
      sessionId,
      metadata: {
        ...payment.metadata,
        checkoutSessionId: sessionId,
      },
    });

    return sendResponse(res, 200, true, 'GCash checkout session created', {
      checkoutUrl,
      sessionId,
      orderId: order._id,
      referenceId,
      amountPHP: totalAmountPHP,
      amountUSD: totalAmount,
      exchangeRate: exchangeRate.toFixed(2),
    });
  } catch (error) {
    console.error('GCash Checkout Session Error:', error.response?.data || error.message);
    next(error);
  }
};

/**
 * Create PayMongo Payment Intent (Improved GCash/Multiple Payment Methods)
 * Uses PayMongo's Payment Intent API for better payment handling
 */
exports.createPayMongoPaymentIntent = async (req, res, next) => {
  try {
    const { items, shippingAddress, totalAmount, paymentMethod = 'gcash' } = req.body;

    if (!items || items.length === 0 || !shippingAddress || !totalAmount) {
      return sendError(res, 400, 'Missing required fields');
    }

    // Fetch real-time exchange rate
    const exchangeRateData = await fetchExchangeRate();
    const exchangeRate = exchangeRateData.rate;

    // Convert USD to PHP
    const totalAmountPHP = convertUSDtoPHP(totalAmount, exchangeRate);
    const totalAmountInCents = Math.round(totalAmountPHP * 100);

    // Validate amount (minimum ₱100 = PHP 1.00)
    if (totalAmountInCents < 100) {
      return sendError(res, 400, 'Minimum amount is ₱1.00');
    }

    // Generate unique IDs
    const referenceId = `PI-${Date.now()}-${req.user.id}`;
    const orderId = `ORD-${Date.now()}`;

    // Create order
    const order = await Order.create({
      orderId,
      userId: req.user.id,
      items,
      totalAmount, // USD amount
      totalAmountPHP,
      currency: 'php',
      exchangeRate,
      exchangeRateSource: exchangeRateData.source,
      shippingAddress,
      paymentMethod,
      paymentGateway: 'paymongo',
      paymentId: referenceId,
      paymentStatus: 'pending',
      orderStatus: 'pending',
    });

    // Create payment record
    const payment = await Payment.create({
      paymentId: referenceId,
      orderId: order._id,
      userId: req.user.id,
      amountUSD: totalAmount,
      amountPHP: totalAmountPHP,
      currency: 'php',
      exchangeRate,
      exchangeRateSource: exchangeRateData.source,
      paymentMethod,
      gateway: 'paymongo',
      referenceId,
      status: 'pending',
      metadata: {
        orderId: orderId,
        paymentIntentId: referenceId,
        exchangeRateSource: exchangeRateData.source,
        timestamp: new Date(),
      },
    });

    // Create PayMongo Payment Intent
    const paymentIntent = await PayMongoPaymentHandler.createPaymentIntent({
      amount: totalAmountInCents,
      currency: 'PHP',
      description: `StyleHub Order - ${orderId}`,
      paymentMethodTypes: [paymentMethod], // ['gcash', 'card', 'paymaya']
      statementDescriptor: 'StyleHub Payment',
      returnUrl: `${process.env.FRONTEND_URL}/checkout/success?referenceId=${referenceId}`,
      metadata: {
        orderId: orderId,
        paymentId: referenceId,
        userId: req.user.id.toString(),
        customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        customerEmail: shippingAddress.email,
      },
    });

    console.log('Payment Intent Response:', {
      id: paymentIntent.id,
      status: paymentIntent.attributes.status,
      nextAction: paymentIntent.attributes.next_action,
    });

    return sendResponse(res, 200, true, 'PayMongo Payment Intent created', {
      paymentIntentId: paymentIntent.id,
      clientKey: paymentIntent.attributes.client_key,
      amount: totalAmountInCents,
      amountPHP: totalAmountPHP,
      amountUSD: totalAmount,
      currency: 'PHP',
      status: paymentIntent.attributes.status,
      paymentMethod,
      orderId: order._id,
      referenceId,
      exchangeRate: exchangeRate.toFixed(2),
      nextAction: paymentIntent.attributes.next_action, // Include full nextAction object
      // Also include direct redirect URL if available
      redirectUrl: paymentIntent.attributes.next_action?.redirect_url || paymentIntent.attributes.next_action?.url,
    });
  } catch (error) {
    console.error('PayMongo Payment Intent Error:', error);
    next(error);
  }
};

/**
 * Verify PayMongo Payment Intent
 */
exports.verifyPayMongoPayment = async (req, res, next) => {
  try {
    const { paymentIntentId, referenceId } = req.body;

    if (!paymentIntentId) {
      return sendError(res, 400, 'Payment Intent ID is required');
    }

    // Get payment intent from PayMongo
    const paymentIntent = await PayMongoPaymentHandler.getPaymentIntent(paymentIntentId);

    if (!paymentIntent) {
      return sendError(res, 404, 'Payment Intent not found');
    }

    const status = paymentIntent.attributes.status;

    // Update payment status based on intent status
    await Payment.findOneAndUpdate(
      { referenceId },
      {
        status: status === 'succeeded' ? 'succeeded' : status === 'failed' ? 'failed' : 'pending',
        metadata: {
          paymentIntentId,
          status,
        },
      },
      { new: true }
    );

    // Update order status if payment succeeded
    if (status === 'succeeded') {
      await Order.findOneAndUpdate(
        { paymentId: referenceId },
        {
          paymentStatus: 'completed',
          orderStatus: 'confirmed',
        },
        { new: true }
      );
    }

    return sendResponse(res, 200, true, 'Payment verified', {
      status,
      paymentIntentId,
      referenceId,
      succeeded: status === 'succeeded',
    });
  } catch (error) {
    console.error('PayMongo Payment Verification Error:', error);
    next(error);
  }
};

/**
 * Verify Payment & Create Order
 */
exports.verifyPayment = async (req, res, next) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return sendError(res, 400, 'Session ID is required');
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== 'paid') {
      return sendError(res, 400, 'Payment not completed');
    }

    // Parse metadata
    let shippingAddress = {};
    let items = [];
    let totalAmountUSD = 0;

    try {
      shippingAddress = JSON.parse(session.metadata.shippingAddress || '{}');
      items = JSON.parse(session.metadata.items || '[]');
      totalAmountUSD = parseFloat(session.metadata.totalAmountUSD || '0');
    } catch (e) {
      console.error('Error parsing metadata:', e);
    }

    // Fetch exchange rate for record keeping
    const exchangeRateData = await fetchExchangeRate();
    const exchangeRate = exchangeRateData.rate;
    const totalAmountPHP = convertUSDtoPHP(totalAmountUSD, exchangeRate);

    // Create order
    const orderId = `ORD-${Date.now()}`;
    const order = await Order.create({
      orderId,
      userId: req.user.id,
      items,
      totalAmount: totalAmountUSD,
      totalAmountPHP,
      currency: 'usd',
      exchangeRate,
      exchangeRateSource: exchangeRateData.source,
      shippingAddress,
      paymentId: session.id,
      paymentMethod: 'stripe',
      paymentGateway: 'stripe',
      paymentStatus: 'completed',
      orderStatus: 'confirmed',
    });

    // Create payment record
    const payment = await Payment.create({
      paymentId: session.id,
      orderId: order._id,
      userId: req.user.id,
      amountUSD: totalAmountUSD,
      amountPHP: totalAmountPHP,
      currency: 'usd',
      exchangeRate,
      exchangeRateSource: exchangeRateData.source,
      paymentMethod: 'stripe',
      gateway: 'stripe',
      sessionId: session.id,
      status: 'succeeded',
      metadata: {
        stripeSessionId: session.id,
        chargeId: session.payment_intent,
      },
    });

    // Clear user's cart after successful payment
    await Cart.findOneAndDelete({ userId: req.user.id });

    return sendResponse(res, 200, true, 'Payment verified and order created', {
      order: {
        id: order._id,
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        totalAmountPHP: order.totalAmountPHP,
        exchangeRate: order.exchangeRate,
        status: order.orderStatus,
      },
      payment: {
        id: payment._id,
        status: payment.status,
        amountUSD: payment.amountUSD,
        amountPHP: payment.amountPHP,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify GCash Payment
 */
exports.verifyGCashPayment = async (req, res, next) => {
  try {
    const { referenceId } = req.body;

    if (!referenceId) {
      return sendError(res, 400, 'Reference ID is required');
    }

    const payment = await Payment.findOne({ paymentId: referenceId });

    if (!payment) {
      return sendError(res, 404, 'Payment not found');
    }

    if (payment.status !== 'succeeded') {
      return sendError(res, 400, 'Payment not completed');
    }

    const order = await Order.findById(payment.orderId);

    return sendResponse(res, 200, true, 'Payment verified', {
      order,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Payment History
 */
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .populate('orderId', 'orderId totalAmount totalAmountPHP currency')
      .sort({ createdAt: -1 })
      .limit(50);

    return sendResponse(res, 200, true, 'Payment history retrieved', {
      payments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Exchange Rate
 */
exports.getExchangeRate = async (req, res, next) => {
  try {
    const exchangeRateData = await fetchExchangeRate();

    return sendResponse(res, 200, true, 'Exchange rate retrieved', {
      rate: exchangeRateData.rate,
      source: exchangeRateData.source,
      timestamp: exchangeRateData.timestamp,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Webhook (Stripe/PayMongo)
 */
exports.handleWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle payment success
    if (event.type === 'charge.succeeded' || event.type === 'payment_intent.succeeded') {
      const charge = event.data.object;
      
      const payment = await Payment.findOne({ sessionId: charge.id });
      if (payment) {
        payment.status = 'succeeded';
        await payment.save();

        const order = await Order.findById(payment.orderId);
        if (order) {
          order.paymentStatus = 'completed';
          order.orderStatus = 'confirmed';
          await order.save();
        }
      }
    }

    // Handle payment failure
    if (event.type === 'charge.failed' || event.type === 'payment_intent.payment_failed') {
      const charge = event.data.object;

      const payment = await Payment.findOne({ sessionId: charge.id });
      if (payment) {
        payment.status = 'failed';
        await payment.save();

        const order = await Order.findById(payment.orderId);
        if (order) {
          order.paymentStatus = 'failed';
          await order.save();
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Refund Payment
 */
exports.refundPayment = async (req, res, next) => {
  try {
    const { paymentId, reason } = req.body;

    if (!paymentId || !reason) {
      return sendError(res, 400, 'Payment ID and reason are required');
    }

    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
      return sendError(res, 404, 'Payment not found');
    }

    if (payment.status !== 'succeeded') {
      return sendError(res, 400, 'Only succeeded payments can be refunded');
    }

    // If Stripe payment, process refund
    if (payment.gateway === 'stripe' && payment.metadata.chargeId) {
      const refund = await stripe.refunds.create({
        charge: payment.metadata.chargeId,
        reason: 'requested_by_customer',
      });

      payment.status = 'refunded';
      payment.refundAmount = payment.amountUSD;
      payment.refundReason = reason;
      await payment.save();

      const order = await Order.findById(payment.orderId);
      if (order) {
        order.paymentStatus = 'refunded';
        await order.save();
      }

      return sendResponse(res, 200, true, 'Refund processed', {
        refundId: refund.id,
        amount: payment.amountUSD,
      });
    }

    // For GCash, manual refund (placeholder)
    payment.status = 'refunded';
    payment.refundAmount = payment.amountPHP;
    payment.refundReason = reason;
    await payment.save();

    return sendResponse(res, 200, true, 'Refund initiated (manual verification required)', {
      paymentId,
      amount: payment.amountPHP,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle GCash Webhook
 */
exports.handleGCashWebhook = async (req, res) => {
  try {
    const { event, data } = req.body;

    if (event === 'payment.paid' || event === 'completed') {
      const { referenceId, paymentId, status, amount } = data;

      const payment = await Payment.findOneAndUpdate(
        { paymentId: referenceId },
        { status: 'succeeded', transactionId: paymentId, metadata: data },
        { new: true }
      );

      if (payment) {
        await Order.findByIdAndUpdate(
          payment.orderId,
          {
            paymentStatus: 'completed',
            orderStatus: 'confirmed',
          }
        );
      }

      res.json({ success: true, message: 'Webhook processed successfully' });
    } else if (event === 'payment.failed' || event === 'failed') {
      const { referenceId } = data;

      await Payment.findOneAndUpdate(
        { paymentId: referenceId },
        { status: 'failed', metadata: data },
        { new: true }
      );

      const payment = await Payment.findOne({ paymentId: referenceId });
      if (payment) {
        await Order.findByIdAndUpdate(
          payment.orderId,
          { paymentStatus: 'failed', orderStatus: 'pending' }
        );
      }

      res.json({ success: true, message: 'Failed payment processed' });
    } else {
      res.json({ success: true, message: 'Webhook received but not processed' });
    }
  } catch (error) {
    console.error('GCash webhook error:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Get GCash Payment Status
 */
exports.getGCashPaymentStatus = async (req, res, next) => {
  try {
    const { referenceId } = req.params;

    if (!referenceId) {
      return sendError(res, 400, 'Reference ID is required');
    }

    const payment = await Payment.findOne({ paymentId: referenceId });

    if (!payment) {
      return sendError(res, 404, 'Payment not found');
    }

    return sendResponse(res, 200, true, 'Payment status retrieved', {
      referenceId,
      status: payment.status,
      amountUSD: payment.amountUSD,
      amountPHP: payment.amountPHP,
      currency: payment.currency,
      createdAt: payment.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel GCash Payment
 */
exports.cancelGCashPayment = async (req, res, next) => {
  try {
    const { referenceId } = req.body;

    if (!referenceId) {
      return sendError(res, 400, 'Reference ID is required');
    }

    const payment = await Payment.findOne({ paymentId: referenceId });

    if (!payment) {
      return sendError(res, 404, 'Payment not found');
    }

    if (payment.status !== 'pending') {
      return sendError(res, 400, 'Can only cancel pending payments');
    }

    await Payment.findOneAndUpdate(
      { paymentId: referenceId },
      { status: 'cancelled' }
    );

    await Order.findByIdAndUpdate(
      payment.orderId,
      { paymentStatus: 'failed', orderStatus: 'cancelled' }
    );

    return sendResponse(res, 200, true, 'Payment cancelled successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate total from items
 */
const calculateTotal = (items) => {
  return items.reduce((sum, item) => {
    const price = item.price || (item.productId && item.productId.price) || 0;
    const quantity = item.quantity || 1;
    return sum + (price * quantity);
  }, 0);
};

module.exports = {
  createCheckoutSession: exports.createCheckoutSession,
  createGCashPayment: exports.createGCashPayment,
  createGCashCheckoutSession: exports.createGCashCheckoutSession,
  createPayMongoPaymentIntent: exports.createPayMongoPaymentIntent,
  verifyPayment: exports.verifyPayment,
  verifyGCashPayment: exports.verifyGCashPayment,
  verifyPayMongoPayment: exports.verifyPayMongoPayment,
  getPaymentHistory: exports.getPaymentHistory,
  getExchangeRate: exports.getExchangeRate,
  handleWebhook: exports.handleWebhook,
  handleGCashWebhook: exports.handleGCashWebhook,
  getGCashPaymentStatus: exports.getGCashPaymentStatus,
  cancelGCashPayment: exports.cancelGCashPayment,
  refundPayment: exports.refundPayment,
};
