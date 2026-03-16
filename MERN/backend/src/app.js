const express = require('express');
const cors = require('cors');

const app = express();

require("dotenv").config();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
const connectDB = require('./utils/db');
connectDB();

// Routes

const categoryRoutes = require('./modules/categories/category.routes');
app.use('/api/categories', categoryRoutes);

const servicePlanRoutes = require('./modules/servicePlans/servicePlan.routes');
app.use('/api/servicePlans', servicePlanRoutes);

const finderVerificationRoutes = require('./modules/finderVerification/verification.routes');
app.use('/api/verification', finderVerificationRoutes);

const userRoutes = require('./modules/users/user.routes');
app.use('/api/users', userRoutes);

const requestRoutes = require('./modules/requests/request.routes');
app.use('/api/requests', requestRoutes);

const assignmentRoutes = require('./modules/assignments/assignment.routes');
app.use('/api/assignments', assignmentRoutes);

const milestoneRoutes = require('./modules/milestones/milestone.routes');
app.use('/api/milestones', milestoneRoutes);

const evidenceRoutes = require('./modules/evidence/evidence.routes');
app.use('/api/evidence', evidenceRoutes);

const chatRoutes = require('./modules/chat/chat.routes');
app.use('/api/chats', chatRoutes);

const paymentRoutes = require('./modules/payments/payment.routes');
app.use('/api/payments', paymentRoutes);

const payoutRoutes = require('./modules/payouts/payout.routes');
app.use('/api/payouts', payoutRoutes);

const ratingRoutes = require('./modules/ratings/rating.routes');
app.use('/api/ratings', ratingRoutes);

const refundRoutes = require('./modules/refunds/refund.routes');
app.use('/api/refunds', refundRoutes);

const reportRoutes = require("./modules/reports/report.routes");
app.use('/api/reports', reportRoutes)



const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});