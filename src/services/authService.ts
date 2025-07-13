import { getDataSource } from "../config/getDataSource";
import { User } from "../entities/User";
import bcrypt from "bcryptjs";
import { IRegisterUser } from "../types/user.type";

export const registerUser = async (userData: IRegisterUser) => {
  const { email, password, firstName, lastName } = userData;

  if (
    !email ||
    typeof email !== "string" ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
  ) {
    const error = new Error("Invalid email format");
    (error as any).statusCode = 400;
    throw error;
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    const error = new Error("Password too short");
    (error as any).statusCode = 400;
    throw error;
  }

  const userRepo = getDataSource().getRepository(User);
  const existing = await userRepo.findOne({ where: { email } });
  if (existing) {
    const error = new Error("Email already registered");
    (error as any).statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = userRepo.create({
    email,
    passwordHash,
    firstName,
    lastName,
    role: "user", // Default role
  });

  const savedUser = await userRepo.save(user);
  return savedUser;
};
