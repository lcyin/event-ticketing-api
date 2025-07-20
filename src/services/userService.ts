import { DataSource } from "typeorm";
import { getDataSource } from "../config/getDataSource";
import { User } from "../entities/User";
import { IUpdateProfile } from "../types/user.type";

export const getCurrentUser = async (ds: DataSource, userId: string) => {
  if (!userId) {
    const error = new Error("User not authenticated");
    (error as any).statusCode = 401;
    throw error;
  }

  const userRepo = ds.getRepository(User);
  const user = await userRepo.findOne({ where: { id: userId } });

  if (!user) {
    const error = new Error("User not found");
    (error as any).statusCode = 404;
    throw error;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    role: user.role,
  };
};

export const updateProfile = async (
  ds: DataSource,
  userId: string,
  profileData: IUpdateProfile
) => {
  if (!userId) {
    const error = new Error("User not authenticated");
    (error as any).statusCode = 401;
    throw error;
  }

  const { firstName, lastName } = profileData;
  const userRepo = ds.getRepository(User);
  const user = await userRepo.findOne({ where: { id: userId } });

  if (!user) {
    const error = new Error("User not found");
    (error as any).statusCode = 404;
    throw error;
  }

  // Only update fields that are provided
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;

  await userRepo.save(user);

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    role: user.role,
  };
};
