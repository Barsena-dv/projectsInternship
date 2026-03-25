// Server entry point

require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/db');

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    const PORT = process.env.PORT || 5000;

    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
