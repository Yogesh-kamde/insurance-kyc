const rateLimit = require('express-rate-limit');

const limitHandler = (req, res) => {
  res.status(429).json({
    error: 'Too many attempts, please try again later.'
  });
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // 5 attempts per IP per window
  standardHeaders: true,     // adds RateLimit-* response headers
  legacyHeaders: false,
  handler: limitHandler
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler
});

module.exports = { loginLimiter, registerLimiter };