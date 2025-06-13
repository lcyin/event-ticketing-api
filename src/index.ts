import "reflect-metadata";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { AppDataSource } from "./config/database";
import dotenv from "dotenv";
import eventRoutes from "./routes/eventRoutes";
import ticketTypeRoutes from "./routes/ticketTypeRoutes";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Event Ticketing API",
      version: "1.0.0",
      description: "API documentation for the Event Ticketing Platform",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Development server",
      },
    ],
  },
  apis: ["./src/routes/*.ts"], // Path to the API routes
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/ticket-types", ticketTypeRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    console.log("Database connection established");

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Error during Data Source initialization:", error);
  });

// Basic health check endpoint
app.get("/health", (req, res) => {
  console.log("🚀 ~ app.get ~ req:", req.accepted);
  res.json({ status: "ok" });
});
