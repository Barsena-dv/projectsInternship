const express = require("express");
const mainRouter = require("./routes/index");
const errorHandler = require("./middleware/error.middleware");

const app = express();

// Middleware
app.use(express.json());

const cors = require("cors");
app.use(cors());
// Routes
app.use("/api", mainRouter);

// Error Handling Middleware (must be last)
app.use(errorHandler);

module.exports = app;