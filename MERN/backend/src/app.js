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
const userRoutes = require('./modules/users/user.routes');
app.use('/api/users', userRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});