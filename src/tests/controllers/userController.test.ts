import request from "supertest";
import express, { Express } from "express";
import {
  getCurrentUser,
  updateProfile,
} from "../../controllers/userController";
import { getDataSource } from "../../config/getDataSource";
import { User } from "../../entities/User";
import bcrypt from "bcryptjs";
import { authenticateToken } from "../../middleware/auth";
import { generateToken } from "../../utils/jwt";

const app: Express = express();
app.use(express.json());

// Mount the user routes
app.get("/api/v1/users/me", authenticateToken, getCurrentUser);
app.patch("/api/v1/users/me", authenticateToken, updateProfile);

describe("User Controller - /api/v1/users", () => {
  const userRepository = getDataSource().getRepository(User);

  const getMockUserPayload = () => ({
    email: "test@example.com" + new Date().getTime(),
    password: "password123",
    firstName: "Test",
    lastName: "User",
  });

  describe("GET /me", () => {
    it("should return user profile when valid token is provided", async () => {
      // Create a test user
      const mockUserPayload = getMockUserPayload();
      const hashedPassword = await bcrypt.hash(mockUserPayload.password, 10);
      const user = await userRepository.save(
        userRepository.create({
          ...mockUserPayload,
          passwordHash: hashedPassword,
        })
      );

      // Generate token for the user
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: "user",
      });

      // Test the endpoint
      const response = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        role: "user",
      });
    });

    it("should return 401 when no token is provided", async () => {
      const response = await request(app).get("/api/v1/users/me");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("No token provided");
    });

    it("should return 401 when invalid token is provided", async () => {
      const response = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid token");
    });

    it("should return 404 when user is not found", async () => {
      // Generate token with non-existent user ID
      const token = generateToken({
        id: "00000000-0000-0000-0000-000000000000", // Using a valid UUID format
        email: "nonexistent@example.com",
        role: "user",
      });

      const response = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });
  });

  describe("PATCH /me", () => {
    let testUser: User;
    let authToken: string;

    beforeEach(async () => {
      // Create a test user
      const mockUserPayload = getMockUserPayload();
      const hashedPassword = await bcrypt.hash(mockUserPayload.password, 10);
      testUser = await userRepository.save(
        userRepository.create({
          ...mockUserPayload,
          passwordHash: hashedPassword,
        })
      );

      // Generate token for the user
      authToken = generateToken({
        id: testUser.id,
        email: testUser.email,
        role: "user",
      });
    });

    afterEach(async () => {
      // Clean up test user
      await userRepository.delete({ id: testUser.id });
    });

    it("should update user profile with valid data", async () => {
      const response = await request(app)
        .patch("/api/v1/users/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          firstName: "Updated",
          lastName: "Name",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("firstName", "Updated");
      expect(response.body).toHaveProperty("lastName", "Name");
    });

    it("should return 401 without authentication token", async () => {
      const response = await request(app).patch("/api/v1/users/me").send({
        firstName: "Updated",
        lastName: "Name",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("No token provided");
    });

    it("should return 401 with invalid authentication token", async () => {
      const response = await request(app)
        .patch("/api/v1/users/me")
        .set("Authorization", "Bearer invalid-token")
        .send({
          firstName: "Updated",
          lastName: "Name",
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid token");
    });

    it("should update only provided fields", async () => {
      const response = await request(app)
        .patch("/api/v1/users/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          firstName: "Partial",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("firstName", "Partial");
      expect(response.body).toHaveProperty("lastName", testUser.lastName); // Should retain previous value
    });

    it("should return 404 when user is not found", async () => {
      // Delete the user to simulate not found
      await userRepository.delete({ id: testUser.id });

      const response = await request(app)
        .patch("/api/v1/users/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          firstName: "Updated",
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });
  });
});
