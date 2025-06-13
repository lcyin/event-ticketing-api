import request from "supertest";
import express from "express";
import { getCurrentUser, updateProfile } from "../controllers/userController";
import { getDataSource } from "../config/getDataSource";
import { User } from "../entities/User";
import { authenticateToken } from "../middleware/auth";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

// Add routes
app.get("/api/v1/users/me", authenticateToken, getCurrentUser);
app.patch("/api/v1/users/me", authenticateToken, updateProfile);

describe("User Profile Update", () => {
  let authToken: string;
  let testUser: User;

  beforeAll(async () => {
    // Create a test user
    const userRepo = getDataSource().getRepository(User);
    testUser = userRepo.create({
      email: "test@example.com",
      passwordHash: "hashedpassword",
      firstName: "Test",
      lastName: "User",
    });
    await userRepo.save(testUser);

    // Generate JWT token
    authToken = jwt.sign(
      { id: testUser.id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    // Clean up test user
    const userRepo = getDataSource().getRepository(User);
    await userRepo.delete({ id: testUser.id });
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
    expect(response.body).toHaveProperty("lastName", "Name"); // Should retain previous value
  });
});
