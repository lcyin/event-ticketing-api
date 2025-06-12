import request from "supertest";
import express, { Express } from "express";
import { register } from "../../controllers/authController";
import { TestDataSource } from "../../config/test-database";
import { User } from "../../entities/User";
import bcrypt from "bcryptjs";

const app: Express = express();
app.use(express.json());

// Mount the auth controller route.
// Assumes authRoutes.ts defines POST /register for the register controller
// and index.ts mounts authRoutes under /api/v1/auth.
app.post("/api/v1/auth/register", register);

describe("Auth Controller - /api/v1/auth", () => {
  //   beforeAll(async () => {
  //     if (!TestDataSource.isInitialized) {
  //       await TestDataSource.initialize();
  //     }
  //   });

  //   afterAll(async () => {
  //     if (TestDataSource.isInitialized) {
  //       await TestDataSource.destroy();
  //     }
  //   });

  const userRepository = TestDataSource.getRepository(User);

  beforeEach(async () => {
    // await userRepository.clear();
  });

  describe("POST /register", () => {
    const getMockUserPayload = () => ({
      email: "test@example.com" + new Date().getTime(), // Ensure unique email for each test
      password: "password123",
      firstName: "Test",
      lastName: "User",
    });

    it("should register a new user successfully", async () => {
      const mockUserPayload = getMockUserPayload();
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(mockUserPayload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.email).toBe(mockUserPayload.email);
      expect(response.body.message).toBe(
        "User registered successfully. Please verify your email."
      );

      const dbUser = await userRepository.findOneBy({
        email: mockUserPayload.email,
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.email).toBe(mockUserPayload.email);
      expect(dbUser?.passwordHash).toBeDefined();
    });

    it("should return 400 for invalid email format", async () => {
      const mockUserPayload = getMockUserPayload();
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({ ...mockUserPayload, email: "invalid-email" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid email format");
    });

    it("should return 400 for password too short (less than 6 characters)", async () => {
      const mockUserPayload = getMockUserPayload();
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({ ...mockUserPayload, password: "123" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Password too short");
    });

    it("should return 409 if email is already registered", async () => {
      const mockUserPayload = getMockUserPayload();
      // Pre-register a user
      const hashedPassword = await bcrypt.hash("securepassword", 10);
      await userRepository.save(
        userRepository.create({
          ...mockUserPayload,
          passwordHash: hashedPassword,
        })
      );

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(mockUserPayload);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Email already registered");
    });

    it("should return 400 if email is missing", async () => {
      const mockUserPayload = getMockUserPayload();
      const { email, ...payloadWithoutEmail } = mockUserPayload;
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(payloadWithoutEmail);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid email format");
    });

    it("should return 400 if password is missing", async () => {
      const mockUserPayload = getMockUserPayload();
      const { password, ...payloadWithoutPassword } = mockUserPayload;
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(payloadWithoutPassword);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Password too short");
    });
  });
});
