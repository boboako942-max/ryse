const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // MongoDB Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    const mainMessage = messages[0] || 'Validation error';
    return sendError(res, 400, mainMessage, messages.length > 1 ? messages : null);
  }

  // MongoDB CastError (invalid ID format)
  if (err.name === 'CastError') {
    return sendError(res, 400, 'Invalid ID format');
  }

  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists. Please use a different ${field}.`;
    return sendError(res, 400, message);
  }

  // JSON Parse Error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 400, 'Invalid JSON in request body');
  }

  sendError(res, err.statusCode || 500, err.message || 'Server Error');
};

module.exports = errorHandler;
