const rateLimit = require('express-rate-limit');

const nodeEnv = String(process.env.NODE_ENV || 'development').toLowerCase();
const isDevelopment = nodeEnv !== 'production';

const getEnvNumber = (name, fallback) => {
  const raw = process.env[name];
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

/**
 * Global Rate Limiter
 * 100 requests per 15 minutes
 */
const globalLimiter = rateLimit({
  windowMs: getEnvNumber('RATE_LIMIT_GLOBAL_WINDOW_MS', 15 * 60 * 1000),
  max: isDevelopment
    ? getEnvNumber('RATE_LIMIT_GLOBAL_MAX_DEV', 1000)
    : getEnvNumber('RATE_LIMIT_GLOBAL_MAX', 100),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // In local development, polling-heavy read requests should not be throttled.
  skip: (req) => isDevelopment && req.method === 'GET',
});

/**
 * Auth Rate Limiter (Login/Register)
 * 5 attempts per 10 minutes
 */
const authLimiter = rateLimit({
  windowMs: getEnvNumber('RATE_LIMIT_AUTH_WINDOW_MS', 10 * 60 * 1000),
  max: isDevelopment
    ? getEnvNumber('RATE_LIMIT_AUTH_MAX_DEV', 60)
    : getEnvNumber('RATE_LIMIT_AUTH_MAX', 10),
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 10 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Financial/Dispute Rate Limiter
 * 10 requests per 10 minutes
 */
const transactionalLimiter = rateLimit({
  windowMs: getEnvNumber('RATE_LIMIT_TRANSACTION_WINDOW_MS', 10 * 60 * 1000),
  max: isDevelopment
    ? getEnvNumber('RATE_LIMIT_TRANSACTION_MAX_DEV', 60)
    : getEnvNumber('RATE_LIMIT_TRANSACTION_MAX', 15),
  message: {
    success: false,
    message: 'Too many financial/escalation attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalLimiter,
  authLimiter,
  transactionalLimiter,
};
