const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

// Middleware imports
const { errorHandler } = require('./middleware/error.middleware');

// Routes imports
const authRoutes = require('./modules/auth/auth.routes');
const requestRoutes = require('./modules/requests/request.routes');
const assignmentRoutes = require('./modules/assignments/assignment.routes');
const trackingRoutes = require('./modules/tracking/tracking.routes');
const disputeRoutes = require('./modules/disputes/dispute.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const refundRoutes = require('./modules/refunds/refund.routes');
const payoutRoutes = require('./modules/payouts/payout.routes');
const ratingRoutes = require('./modules/ratings/rating.routes');
const evidenceRoutes = require('./modules/evidence/evidence.routes');
const paymentRoutes = require('./modules/payments/payment.routes');
const chatRoutes = require('./modules/chat/chat.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');
const servicePlanRoutes = require('./modules/servicePlans/servicePlan.routes');

// Import security middlewares
const { globalLimiter, transactionalLimiter } = require('./middleware/rateLimit.middleware');
const auditLogRoutes = require('./modules/auditLogs/auditLog.routes');

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://projects-internship.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176',
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow if no origin (e.g., server-to-server or non-browser)
    if (!origin) return callback(null, true);

    // Exact match in whitelist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Optional: Allow any Vercel preview/branch deployments
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    // Instead of Error, we return false for failed CORS checks (more browser-friendly)
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ================= MIDDLEWARE =================

// CORS should run before any middleware that may short-circuit responses
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Global rate limiter
app.use(globalLimiter);

// Security middleware
app.use(helmet());

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Performance middleware
app.use(compression());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ================= ROUTES =================

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/disputes', transactionalLimiter, disputeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/payments', transactionalLimiter, paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/plans', servicePlanRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// ================= 404 Handler =================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ================= Error Handling =================

app.use(errorHandler);

module.exports = app;
