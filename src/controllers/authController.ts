import { Request, Response } from "express";
import { getDataSource } from "../config/getDataSource";
import { User } from "../entities/User";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt";

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
    access_token: token,
    token_type: "Bearer",
    expires_in: 3600, // 1 hour in seconds
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: "user",
    },
  });
};
