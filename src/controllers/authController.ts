import { Request, Response } from "express";
import { getDataSource } from "../config/getDataSource";
import { User } from "../entities/User";
import bcrypt from "bcryptjs";
import { generateToken, verifyToken } from "../utils/jwt";

export const register = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body;

  // Basic validation
  if (
    !email ||
    typeof email !== "string" ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
  ) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ message: "Password too short" });
  }

  const userRepo = getDataSource().getRepository(User);
  const existing = await userRepo.findOne({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = userRepo.create({ email, passwordHash, firstName, lastName });
  await userRepo.save(user);

  return res.status(201).json({
    id: user.id,
    email: user.email,
    message: "User registered successfully. Please verify your email.",
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const userRepo = getDataSource().getRepository(User);
  const user = await userRepo.findOne({ where: { email } });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: "user", // You can add role-based authentication later
  });

  return res.status(200).json({
    accessToken: token,
    tokenType: "Bearer",
    expiresIn: 3600, // 1 hour in seconds
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: "user",
    },
  });
};

export const logout = async (req: Request, res: Response) => {
  // Since we're using JWTs, we don't need to do anything on the server side
  // The client should remove the token from their storage
  // In a more complex system, you might want to implement token blacklisting
  return res.status(200).json({ message: "Logged out successfully." });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  // Basic validation
  if (
    !email ||
    typeof email !== "string" ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
  ) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const userRepo = getDataSource().getRepository(User);
  const user = await userRepo.findOne({ where: { email } });

  // Always return success even if user doesn't exist to prevent email enumeration
  if (user) {
    // Generate a password reset token
    const resetToken = generateToken(
      { id: user.id, email: user.email },
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    // TODO: Send email with reset link
    // For now, we'll just log it
    console.log(
      `Password reset link for ${email}: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    );
  }

  return res.status(200).json({
    message:
      "If an account with that email exists, a password reset link has been sent.",
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, new_password, confirm_new_password } = req.body;

  // Basic validation
  if (!token || !new_password || !confirm_new_password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (new_password !== confirm_new_password) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  if (typeof new_password !== "string" || new_password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long" });
  }

  try {
    // Verify the reset token
    const decoded = verifyToken(token);
    if (!decoded.id || !decoded.email) {
      return res.status(401).json({ message: "Invalid reset token" });
    }

    // Find the user
    const userRepo = getDataSource().getRepository(User);
    const user = await userRepo.findOne({
      where: { id: decoded.id, email: decoded.email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid reset token" });
    }

    // Update the password
    const passwordHash = await bcrypt.hash(new_password, 10);
    user.passwordHash = passwordHash;
    await userRepo.save(user);

    return res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired reset token" });
  }
};
