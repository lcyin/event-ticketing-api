import "reflect-metadata";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { AppDataSource } from "./config/database";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import adminRoutes from "./routes/adminRoutes"; // Import admin routes
import publicEventRoutes from "./routes/publicEventRoutes"; // Import public event routes
import cartRoutes from "./routes/cartRoutes"; // Import cart routes
import orderRoutes from "./routes/orderRoutes"; // Import order routes

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
  apis: ["./src/routes/*.ts"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Define Event schema for Swagger (can be in a separate file or here)
/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         long_description:
 *           type: string
 *           nullable: true
 *         date:
 *           type: string
 *           format: date
 *         start_time:
 *           type: string
 *           nullable: true
 *         end_time:
 *           type: string
 *           nullable: true
 *         venue:
 *           type: string
 *         location:
 *           type: string
 *         address:
 *           type: string
 *           nullable: true
 *         organizer:
 *           type: string
 *           nullable: true
 *         image_url:
 *           type: string
 *           format: url
 *         price_range:
 *           type: string
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     TicketType:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         eventId:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         price:
 *           type: integer
 *         description:
 *           type: string
 *           nullable: true
 *         quantity:
 *           type: integer
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admin", adminRoutes); // Mount admin routes
app.use("/api/v1", publicEventRoutes); // Mount public event routes
app.use("/api/v1/cart", cartRoutes); // Mount cart routes
app.use("/api", orderRoutes); // Mount order routes

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
