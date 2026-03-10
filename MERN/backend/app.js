const express = require('express');
const cors = require('cors');

const app = express();

require("dotenv").config();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
const connectDB = require('./src/utils/db.connections');
connectDB();

// Routes
const userRoutes = require('./src/routes/user.routes');
app.use('/api/users', userRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});