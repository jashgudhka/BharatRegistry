require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

// Import routes
const authRoutes = require("./routes/auth");
const propertyRoutes = require("./routes/property");
const transferRoutes = require("./routes/transfer");
const userRoutes = require("./routes/user");
const documentRoutes = require("./routes/document");
const adminRoutes = require("./routes/admin");
const bankRoutes = require("./routes/bank");

const app = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Bharat Registry API",
      version: "2.0.0",
      description:
        "API documentation for Bharat Registry - Blockchain-Powered Land Registry System for India",
      contact: {
        name: "Jash Gudhka",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/users", userRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bank", bankRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Bharat Registry API",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Bharat Registry API",
    documentation: "/api-docs",
    version: "2.0.0",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Database connection and server start
const PORT = process.env.PORT || 5000;
const { setupGlobalEventListeners } = require("./services/eventListener");

const startServer = async () => {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/bharat-registry";
    await mongoose.connect(mongoUri);
    console.log("📦 Connected to MongoDB");
    
    // Start blockchain event listeners
    try {
      setupGlobalEventListeners();
    } catch (err) {
      console.error("⚠️ Failed to setup blockchain event listeners:", err.message);
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Bharat Registry API Server`);
      console.log(`   Local:    http://localhost:${PORT}`);
      console.log(`   API Docs: http://localhost:${PORT}/api-docs`);
      console.log(`   Health:   http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
