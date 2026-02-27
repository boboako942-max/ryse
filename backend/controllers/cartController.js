const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { sendResponse, sendError } = require('../utils/response');

// Get Cart
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');

    if (!cart) {
      return sendResponse(res, 200, true, 'Cart is empty', { cart: { items: [], totalPrice: 0, totalItems: 0 } });
    }

    return sendResponse(res, 200, true, 'Cart fetched successfully', { cart });
  } catch (error) {
    next(error);
  }
};

// Add to Cart
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity, size, color } = req.body;

    if (!productId || !quantity) {
      return sendError(res, 400, 'Please provide product ID and quantity');
    }

    const product = await Product.findById(productId);
    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      cart = new Cart({
        userId: req.user.id,
        items: [],
        totalPrice: 0,
        totalItems: 0,
      });
    }

    // Check if product already in cart
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId && item.size === size && item.color === color
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        quantity,
        size,
        color,
        price: product.price,
      });
    }

    // Recalculate totals
    cart.totalPrice = 0;
    cart.totalItems = 0;
    cart.items.forEach((item) => {
      cart.totalPrice += item.price * item.quantity;
      cart.totalItems += item.quantity;
    });

    await cart.save();
    await cart.populate('items.productId');

    return sendResponse(res, 200, true, 'Item added to cart', { cart });
  } catch (error) {
    next(error);
  }
};

// Update Cart Item
exports.updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity, size, color } = req.body;

    if (!productId || quantity < 1) {
      return sendError(res, 400, 'Invalid quantity');
    }

    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return sendError(res, 404, 'Cart not found');
    }

    const item = cart.items.find(
      (item) => item.productId.toString() === productId && item.size === size && item.color === color
    );

    if (!item) {
      return sendError(res, 404, 'Item not found in cart');
    }

    item.quantity = quantity;

    // Recalculate totals
    cart.totalPrice = 0;
    cart.totalItems = 0;
    cart.items.forEach((item) => {
      cart.totalPrice += item.price * item.quantity;
      cart.totalItems += item.quantity;
    });

    await cart.save();
    await cart.populate('items.productId');

    return sendResponse(res, 200, true, 'Cart item updated', { cart });
  } catch (error) {
    next(error);
  }
};

// Remove from Cart
exports.removeFromCart = async (req, res, next) => {
  try {
    const { size, color } = req.body;
    const { productId } = req.params;

    if (!productId) {
      return sendError(res, 400, 'Product ID is required');
    }

    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return sendError(res, 404, 'Cart not found');
    }

    cart.items = cart.items.filter(
      (item) => !(item.productId.toString() === productId && item.size === size && item.color === color)
    );

    // Recalculate totals
    cart.totalPrice = 0;
    cart.totalItems = 0;
    cart.items.forEach((item) => {
      cart.totalPrice += item.price * item.quantity;
      cart.totalItems += item.quantity;
    });

    await cart.save();
    await cart.populate('items.productId');

    return sendResponse(res, 200, true, 'Item removed from cart', { cart });
  } catch (error) {
    next(error);
  }
};

// Clear Cart
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { items: [], totalPrice: 0, totalItems: 0 },
      { new: true }
    );

    return sendResponse(res, 200, true, 'Cart cleared successfully', { cart });
  } catch (error) {
    next(error);
  }
};
