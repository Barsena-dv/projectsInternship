// Server entry point

require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { seedDefaultPlans } = require('./src/utils/planSeeder');
const { startAssignmentLifecycleMonitor } = require('./src/modules/assignments/assignmentLifecycle.service');

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    // Seed default plans
    await seedDefaultPlans();

    const PORT = process.env.PORT || 5000;

    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });

    startAssignmentLifecycleMonitor();

    // Handle process-level errors
    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION! 💥 Shutting down...');
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('uncaughtException', (err) => {
      console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
      console.error(err.name, err.message);
      process.exit(1);
    });

    // Handle graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`${signal} signal received: closing HTTP server`);
      
      const { stopAssignmentLifecycleMonitor } = require('./src/modules/assignments/assignmentLifecycle.service');
      const mongoose = require('mongoose');

      stopAssignmentLifecycleMonitor();

      server.close(async () => {
        console.log('HTTP server closed');
        try {
          await mongoose.disconnect();
          console.log('MongoDB connection closed');
          process.exit(0);
        } catch (err) {
          console.error('Error during MongoDB disconnection:', err.message);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
