const Category = require('../models/Category');
const { sendResponse, sendError } = require('../utils/response');

// Get All Categories
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true });

    return sendResponse(res, 200, true, 'Categories fetched successfully', { categories });
  } catch (error) {
    next(error);
  }
};

// Get Category by ID
exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    return sendResponse(res, 200, true, 'Category fetched successfully', { category });
  } catch (error) {
    next(error);
  }
};

// Create Category (Admin)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return sendError(res, 400, 'Please provide category name');
    }

    const category = await Category.create({
      name,
      description,
    });

    return sendResponse(res, 201, true, 'Category created successfully', { category });
  } catch (error) {
    next(error);
  }
};

// Update Category (Admin)
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, isActive },
      { new: true, runValidators: true }
    );

    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    return sendResponse(res, 200, true, 'Category updated successfully', { category });
  } catch (error) {
    next(error);
  }
};

// Delete Category (Admin)
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    return sendResponse(res, 200, true, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};
