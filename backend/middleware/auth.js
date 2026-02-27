const { verifyToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return sendError(res, 401, 'No token provided');
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return sendError(res, 401, 'Invalid or expired token');
    }

    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, 401, error.message);
  }
};

const adminMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return sendError(res, 403, 'Admin access required');
    }
  });
};

module.exports = { authMiddleware, adminMiddleware };
