import request from "supertest";
import express from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
} from "../controllers/authController";
import { getDataSource } from "../config/getDataSource";
import { User } from "../entities/User";
import bcrypt from "bcryptjs";

const app = express();
app.use(express.json());

// Add routes
app.post("/api/v1/auth/register", register);
app.post("/api/v1/auth/login", login);
app.post("/api/v1/auth/logout", logout);
app.post("/api/v1/auth/forgot-password", forgotPassword);

describe("Auth Endpoints", () => {
  let testUser: User;

  beforeAll(async () => {
    // Create a test user
    const userRepo = getDataSource().getRepository(User);
    const passwordHash = await bcrypt.hash("testpassword", 10);
    testUser = userRepo.create({
      email: "test@example.com",
      passwordHash,
      firstName: "Test",
      lastName: "User",
    });
    await userRepo.save(testUser);
  });

  afterAll(async () => {
    // Clean up test user
    const userRepo = getDataSource().getRepository(User);
    await userRepo.delete({ id: testUser.id });
  });

  describe("POST /api/v1/auth/forgot-password", () => {
    it("should return 200 with success message for valid email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
          email: "test@example.com",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "If an account with that email exists, a password reset link has been sent."
      );
    });

    it("should return 200 with same message for non-existent email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
          email: "nonexistent@example.com",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "If an account with that email exists, a password reset link has been sent."
      );
    });

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
          email: "invalid-email",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Invalid email format");
    });

    it("should return 400 for missing email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Invalid email format");
    });
  });
});
