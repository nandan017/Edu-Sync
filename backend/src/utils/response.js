class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const sendSuccess = (res, data = {}, statusCode = 200) => {
  res.status(statusCode).json({ success: true, ...data });
};

const sendError = (res, message = 'Internal server error', statusCode = 500) => {
  res.status(statusCode).json({ success: false, message });
};

module.exports = { AppError, sendSuccess, sendError };
