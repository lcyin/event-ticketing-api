import { Request, Response } from "express";
import * as userService from "../services/userService";
import { getDataSource } from "../config/getDataSource";

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id; // Non-null assertion: auth middleware ensures user
    const user = await userService.getCurrentUser(getDataSource(), userId);
    return res.status(200).json(user);
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id; // Non-null assertion: auth middleware ensures user
    const updatedUser = await userService.updateProfile(
      getDataSource(),
      userId,
      req.body
    );
    return res.status(200).json(updatedUser);
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
};
