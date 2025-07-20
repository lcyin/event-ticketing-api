import { Request, Response } from "express";
import { getDataSource } from "../config/getDataSource";
import { User } from "../entities/User";
import bcrypt from "bcryptjs";
import { verifyToken } from "../utils/jwt";
import {
  registerUser,
  loginUser,
  forgotPassword as forgotPasswordService,
  resetPassword as resetPasswordService,
} from "../services/authService";

export const register = async (req: Request, res: Response) => {
  try {
    const user = await registerUser(getDataSource(), req.body);
    return res.status(201).json({
      id: user.id,
      email: user.email,
      message: "User registered successfully. Please verify your email.",
    });
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const loginResponse = await loginUser(getDataSource(), req.body);
    return res.status(200).json(loginResponse);
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  // Since we're using JWTs, we don't need to do anything on the server side
  // The client should remove the token from their storage
  // In a more complex system, you might want to implement token blacklisting
  return res.status(200).json({ message: "Logged out successfully." });
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    await forgotPasswordService(getDataSource(), req.body);
    return res.status(200).json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    await resetPasswordService(getDataSource(), req.body);
    return res.status(200).json({ message: "Password reset successfully." });
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
};
