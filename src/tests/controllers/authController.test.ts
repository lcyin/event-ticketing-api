import request from "supertest";
import express, { Express } from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
} from "../../controllers/authController";
import { TestDataSource } from "../../config/test-database";
import { User } from "../../entities/User";
import bcrypt from "bcryptjs";
import { authenticateToken } from "../../middleware/auth";

const app: Express = express();
app.use(express.json());

// Mount the auth routes
app.post("/api/v1/auth/register", register);
app.post("/api/v1/auth/login", login);
app.post("/api/v1/auth/logout", authenticateToken, logout);
app.post("/api/v1/auth/forgot-password", forgotPassword);

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

  // beforeEach(async () => {
  //   await userRepository.clear();
  // });

  const getMockUserPayload = () => ({
    email: "test@example.com" + new Date().getTime(),
    password: "password123",
    firstName: "Test",
    lastName: "User",
  });

  describe("POST /register", () => {
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

  describe("POST /login", () => {
    it("should login successfully with valid credentials", async () => {
      // First register a user
      const mockUserPayload = getMockUserPayload();
      const hashedPassword = await bcrypt.hash(mockUserPayload.password, 10);
      const user = await userRepository.save(
        userRepository.create({
          ...mockUserPayload,
          passwordHash: hashedPassword,
        })
      );

      // Try to login
      const response = await request(app).post("/api/v1/auth/login").send({
        email: mockUserPayload.email,
        password: mockUserPayload.password,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body.tokenType).toBe("Bearer");
      expect(response.body.expiresIn).toBe(3600);
      expect(response.body.user).toEqual({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: "user",
      });
    });

    it("should return 401 with invalid password", async () => {
      // First register a user
      const mockUserPayload = getMockUserPayload();
      const hashedPassword = await bcrypt.hash(mockUserPayload.password, 10);
      await userRepository.save(
        userRepository.create({
          ...mockUserPayload,
          passwordHash: hashedPassword,
        })
      );

      // Try to login with wrong password
      const response = await request(app).post("/api/v1/auth/login").send({
        email: mockUserPayload.email,
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid credentials");
    });

    it("should return 401 with non-existent email", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid credentials");
    });

    it("should return 400 if email is missing", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email and password are required");
    });

    it("should return 400 if password is missing", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "test@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email and password are required");
    });
  });

  describe("POST /logout", () => {
    it("should return 200 with success message when valid token is provided", async () => {
      // First register and login to get a valid token
      const mockUserPayload = getMockUserPayload();
      const hashedPassword = await bcrypt.hash(mockUserPayload.password, 10);
      const user = await userRepository.save(
        userRepository.create({
          ...mockUserPayload,
          passwordHash: hashedPassword,
        })
      );

      const loginResponse = await request(app).post("/api/v1/auth/login").send({
        email: mockUserPayload.email,
        password: mockUserPayload.password,
      });

      const token = loginResponse.body.accessToken;

      // Now test logout with the valid token
      const response = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Logged out successfully.");
    });

    it("should return 401 when no token is provided", async () => {
      const response = await request(app).post("/api/v1/auth/logout");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("No token provided");
    });

    it("should return 401 when invalid token is provided", async () => {
      const response = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid token");
    });
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
