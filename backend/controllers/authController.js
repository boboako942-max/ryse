const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { sendResponse, sendError } = require('../utils/response');

// Register User
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    // Validate all required fields
    if (!firstName || !firstName.trim()) {
      return sendError(res, 400, 'First name is required and cannot be empty');
    }
    if (!lastName || !lastName.trim()) {
      return sendError(res, 400, 'Last name is required and cannot be empty');
    }
    if (!email || !email.trim()) {
      return sendError(res, 400, 'Email is required');
    }
    if (!password) {
      return sendError(res, 400, 'Password is required');
    }

    // Validate password length
    if (password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters long');
    }

    if (password !== confirmPassword) {
      return sendError(res, 400, 'Passwords do not match');
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 400, 'Please provide a valid email address');
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return sendError(res, 400, 'Email already registered');
    }

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase(),
      password,
    });

    const token = generateToken(user._id, user.role);

    return sendResponse(res, 201, true, 'User registered successfully', {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Login User
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Please provide email and password');
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return sendError(res, 401, 'Invalid email or password');
    }

    const token = generateToken(user._id, user.role);

    return sendResponse(res, 200, true, 'Login successful', {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Google Login
exports.googleLogin = async (req, res, next) => {
  try {
    const { googleId, email, firstName, lastName, profileImage } = req.body;

    if (!googleId || !email) {
      return sendError(res, 400, 'Missing required fields: googleId and email are required');
    }

    // Validate and sanitize input - ensure firstName and lastName are never empty
    const sanitizedFirstName = (firstName && firstName.trim()) || email.split('@')[0].trim();
    const sanitizedLastName = (lastName && lastName.trim()) || 'User';

    if (!sanitizedFirstName) {
      return sendError(res, 400, 'First name cannot be empty');
    }
    if (!sanitizedLastName) {
      return sendError(res, 400, 'Last name cannot be empty');
    }

    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

    if (!user) {
      user = await User.create({
        googleId,
        email: email.toLowerCase(),
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        profileImage: profileImage || null,
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.profileImage = profileImage || user.profileImage;
      await user.save();
    }

    const token = generateToken(user._id, user.role);

    return sendResponse(res, 200, true, 'Google login successful', {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Facebook Login
exports.facebookLogin = async (req, res, next) => {
  try {
    const { facebookId, email, firstName, lastName, picture } = req.body;

    if (!facebookId || !email) {
      return sendError(res, 400, 'Missing required fields: facebookId and email are required');
    }

    // Validate and sanitize input - ensure firstName and lastName are never empty
    const sanitizedFirstName = (firstName && firstName.trim()) || email.split('@')[0].trim();
    const sanitizedLastName = (lastName && lastName.trim()) || 'User';

    if (!sanitizedFirstName) {
      return sendError(res, 400, 'First name cannot be empty');
    }
    if (!sanitizedLastName) {
      return sendError(res, 400, 'Last name cannot be empty');
    }

    let user = await User.findOne({ $or: [{ facebookId }, { email: email.toLowerCase() }] });

    if (!user) {
      user = await User.create({
        facebookId,
        email: email.toLowerCase(),
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        profileImage: picture || null,
      });
    } else if (!user.facebookId) {
      user.facebookId = facebookId;
      if (picture) user.profileImage = picture;
      await user.save();
    }

    const token = generateToken(user._id, user.role);

    return sendResponse(res, 200, true, 'Facebook login successful', {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Get Current User
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendResponse(res, 200, true, 'User fetched successfully', {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        country: user.country,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update User Profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, address, city, state, zipCode, country } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName,
        lastName,
        phone,
        address,
        city,
        state,
        zipCode,
        country,
      },
      { new: true, runValidators: true }
    );

    return sendResponse(res, 200, true, 'Profile updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

// Logout (Frontend handles token removal)
exports.logout = async (req, res) => {
  return sendResponse(res, 200, true, 'Logged out successfully');
};
