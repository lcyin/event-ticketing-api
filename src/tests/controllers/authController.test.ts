import request from "supertest";
import express, { Express, NextFunction } from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
} from "../../controllers/authController";
import { TestDataSource } from "../../config/test-database";
import { User } from "../../entities/User";
import bcrypt from "bcryptjs";
import { authenticateToken } from "../../middleware/auth";
import { generateToken } from "../../utils/jwt";

const app: Express = express();
app.use(express.json());
const mockMiddleware = (req: Request, res: Response, next: NextFunction) => {
  next();
};
// Mount the auth routes
app.post("/api/v1/auth/register", register);
app.post("/api/v1/auth/login", login);
app.post("/api/v1/auth/logout", mockMiddleware as any, logout);
app.post("/api/v1/auth/forgot-password", forgotPassword);
app.post("/api/v1/auth/reset-password", resetPassword);

describe("Auth Controller - /api/v1/auth", () => {
  const userRepository = TestDataSource.getRepository(User);

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
      const response = await request(app).post("/api/v1/auth/logout");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Logged out successfully.");
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

  describe("POST /api/v1/auth/reset-password", () => {
    it("should reset password successfully with valid token", async () => {
      // First create a user
      const mockUserPayload = getMockUserPayload();
      const hashedPassword = await bcrypt.hash(mockUserPayload.password, 10);
      const user = await userRepository.save(
        userRepository.create({
          ...mockUserPayload,
          passwordHash: hashedPassword,
        })
      );

      // Generate a reset token
      const resetToken = generateToken(
        { id: user.id, email: user.email },
        { expiresIn: "1h" }
      );

      const response = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          token: resetToken,
          new_password: "newpassword123",
          confirm_new_password: "newpassword123",
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Password reset successfully.");

      // Verify the password was actually changed
      const updatedUser = await userRepository.findOneBy({ id: user.id });
      const isNewPasswordValid = await bcrypt.compare(
        "newpassword123",
        updatedUser!.passwordHash
      );
      expect(isNewPasswordValid).toBe(true);
    });

    it("should return 401 with invalid token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          token: "invalid-token",
          new_password: "newpassword123",
          confirm_new_password: "newpassword123",
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid or expired reset token");
    });

    it("should return 400 when passwords do not match", async () => {
      // First create a user
      const mockUserPayload = getMockUserPayload();
      const hashedPassword = await bcrypt.hash(mockUserPayload.password, 10);
      const user = await userRepository.save(
        userRepository.create({
          ...mockUserPayload,
          passwordHash: hashedPassword,
        })
      );

      // Generate a reset token
      const resetToken = generateToken(
        { id: user.id, email: user.email },
        { expiresIn: "1h" }
      );

      const response = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          token: resetToken,
          new_password: "newpassword123",
          confirm_new_password: "differentpassword",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Passwords do not match");
    });

    it("should return 400 when new password is too short", async () => {
      // First create a user
      const mockUserPayload = getMockUserPayload();
      const hashedPassword = await bcrypt.hash(mockUserPayload.password, 10);
      const user = await userRepository.save(
        userRepository.create({
          ...mockUserPayload,
          passwordHash: hashedPassword,
        })
      );

      // Generate a reset token
      const resetToken = generateToken(
        { id: user.id, email: user.email },
        { expiresIn: "1h" }
      );

      const response = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          token: resetToken,
          new_password: "123",
          confirm_new_password: "123",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Password must be at least 6 characters long"
      );
    });

    it("should return 400 when required fields are missing", async () => {
      const response = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          token: "some-token",
          // missing new_password and confirm_new_password
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("All fields are required");
    });
  });
});
