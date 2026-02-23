const Product = require('../models/Product');
const Category = require('../models/Category');
const { sendResponse, sendError } = require('../utils/response');

// Get All Products
exports.getAllProducts = async (req, res, next) => {
  try {
    const { category, search, sortBy, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) {
        query.category = cat._id;
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    let sortQuery = {};
    if (sortBy === 'price-asc') sortQuery = { price: 1 };
    if (sortBy === 'price-desc') sortQuery = { price: -1 };
    if (sortBy === 'newest') sortQuery = { createdAt: -1 };
    if (sortBy === 'rating') sortQuery = { rating: -1 };

    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .populate('category')
      .sort(sortQuery)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    return sendResponse(res, 200, true, 'Products fetched successfully', {
      products,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
};

// Get Product by ID
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category').populate('reviews.userId', 'firstName lastName profileImage');

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    return sendResponse(res, 200, true, 'Product fetched successfully', { product });
  } catch (error) {
    next(error);
  }
};

// Create Product (Admin)
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, originalPrice, category, sizes, colors, totalStock } = req.body;

    if (!name || !description || !price || !category) {
      return sendError(res, 400, 'Please provide all required fields');
    }

    const product = await Product.create({
      name,
      description,
      price,
      originalPrice,
      category,
      sizes: sizes || [],
      colors: colors || [],
      totalStock: totalStock || 0,
      addedBy: req.user.id,
    });

    return sendResponse(res, 201, true, 'Product created successfully', { product });
  } catch (error) {
    next(error);
  }
};

// Update Product (Admin)
exports.updateProduct = async (req, res, next) => {
  try {
    const { name, description, price, originalPrice, category, sizes, colors, totalStock, isActive } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price,
        originalPrice,
        category,
        sizes,
        colors,
        totalStock,
        isActive,
      },
      { new: true, runValidators: true }
    ).populate('category');

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    return sendResponse(res, 200, true, 'Product updated successfully', { product });
  } catch (error) {
    next(error);
  }
};

// Delete Product (Admin)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    return sendResponse(res, 200, true, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Add Product Review
exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return sendError(res, 400, 'Please provide rating between 1 and 5');
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          reviews: {
            userId: req.user.id,
            rating,
            comment,
          },
        },
      },
      { new: true }
    );

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    return sendResponse(res, 201, true, 'Review added successfully', { product });
  } catch (error) {
    next(error);
  }
};
