/**
 * Payment gateway configuration
 * Stripe, Razorpay, PayPal configuration
 */

const paymentConfig = {
  // Platform fee percentage
  PLATFORM_FEE_PERCENTAGE: 10,

  // Stripe configuration (if using)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,

  // Razorpay configuration (if using)
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,

  // Currency
  CURRENCY: 'INR',

  // Webhook endpoints
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
};

module.exports = paymentConfig;
