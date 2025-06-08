import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import bcrypt from "bcryptjs";

export const register = async (req: Request, res: Response) => {
  const { email, password, first_name, last_name } = req.body;

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

  const userRepo = AppDataSource.getRepository(User);
  const existing = await userRepo.findOne({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const user = userRepo.create({ email, password_hash, first_name, last_name });
  await userRepo.save(user);

  return res.status(201).json({
    id: user.id,
    email: user.email,
    message: "User registered successfully. Please verify your email.",
  });
};
