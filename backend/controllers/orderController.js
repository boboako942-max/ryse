const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { sendResponse, sendError } = require('../utils/response');
const { sendOrderConfirmation, sendAdminNotification } = require('../utils/email');

// Get Orders for User
exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });

    return sendResponse(res, 200, true, 'Orders fetched successfully', { orders });
  } catch (error) {
    next(error);
  }
};

// Get Order by ID
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    return sendResponse(res, 200, true, 'Order fetched successfully', { order });
  } catch (error) {
    next(error);
  }
};

// Create Order
exports.createOrder = async (req, res, next) => {
  try {
    const { items, totalAmount, shippingAddress, paymentId, paymentMethod } = req.body;

    if (!items || items.length === 0 || !totalAmount || !shippingAddress) {
      return sendError(res, 400, 'Missing required fields');
    }

    const orderId = `ORD-${Date.now()}`;

    const order = await Order.create({
      orderId,
      userId: req.user.id,
      items,
      totalAmount,
      shippingAddress,
      paymentId,
      paymentMethod,
      paymentStatus: 'completed',
      orderStatus: 'confirmed',
    });

    // Clear user cart
    await Cart.findOneAndUpdate({ userId: req.user.id }, { items: [], totalPrice: 0, totalItems: 0 });

    // Send confirmation emails
    const userEmail = shippingAddress.email;
    await sendOrderConfirmation(userEmail, {
      orderId: order.orderId,
      totalAmount: order.totalAmount,
      items: order.items,
    });

    await sendAdminNotification({
      orderId: order.orderId,
      customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
      customerEmail: userEmail,
      totalAmount: order.totalAmount,
      items: order.items,
    });

    return sendResponse(res, 201, true, 'Order created successfully', { order });
  } catch (error) {
    next(error);
  }
};

// Update Order Status (Admin)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, trackingNumber, notes } = req.body;

    if (!orderStatus) {
      return sendError(res, 400, 'Please provide order status');
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus, trackingNumber, notes },
      { new: true }
    );

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    return sendResponse(res, 200, true, 'Order status updated', { order });
  } catch (error) {
    next(error);
  }
};

// Get All Orders (Admin)
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) {
      query.orderStatus = status;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    return sendResponse(res, 200, true, 'Orders fetched successfully', {
      orders,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
};

// Cancel Order
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    if (order.orderStatus !== 'pending' && order.orderStatus !== 'confirmed') {
      return sendError(res, 400, 'Order cannot be cancelled');
    }

    order.orderStatus = 'cancelled';
    await order.save();

    return sendResponse(res, 200, true, 'Order cancelled successfully', { order });
  } catch (error) {
    next(error);
  }
};
