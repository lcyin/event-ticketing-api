import { User } from "../entities/User";
import bcrypt from "bcryptjs";
import { IRegisterUser } from "../types/user.type";
import { ILoginUser, ILoginResponse, IForgotPassword, IResetPassword } from "../types/auth.type";
import { generateToken, verifyToken } from "../utils/jwt";
import { DataSource } from "typeorm";

export const registerUser = async (ds: DataSource, userData: IRegisterUser) => {
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

  const userRepo = ds.getRepository(User);
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

export const loginUser = async (
  ds: DataSource,
  userData: ILoginUser
): Promise<ILoginResponse> => {
  const { email, password } = userData;

  if (!email || !password) {
    const error = new Error("Email and password are required");
    (error as any).statusCode = 400;
    throw error;
  }

  const userRepo = ds.getRepository(User);
  const user = await userRepo.findOne({ where: { email } });

  if (!user) {
    const error = new Error("Invalid credentials");
    (error as any).statusCode = 401;
    throw error;
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    const error = new Error("Invalid credentials");
    (error as any).statusCode = 401;
    throw error;
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    accessToken: token,
    tokenType: "Bearer",
    expiresIn: 3600, // 1 hour in seconds
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  };
};

export const forgotPassword = async (
  ds: DataSource,
  userData: IForgotPassword
): Promise<void> => {
  const { email } = userData;

  if (
    !email ||
    typeof email !== "string" ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
  ) {
    const error = new Error("Invalid email format");
    (error as any).statusCode = 400;
    throw error;
  }

  const userRepo = ds.getRepository(User);
  const user = await userRepo.findOne({ where: { email } });

  if (user) {
    const resetToken = generateToken(
      { id: user.id, email: user.email },
      { expiresIn: "1h" }
    );

    // In a real application, you would send an email here
    console.log(
      `Password reset link for ${email}: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    );
  }
};

export const resetPassword = async (
  ds: DataSource,
  userData: IResetPassword
): Promise<void> => {
  const { token, new_password, confirm_new_password } = userData;

  if (!token || !new_password || !confirm_new_password) {
    const error = new Error("All fields are required");
    (error as any).statusCode = 400;
    throw error;
  }

  if (new_password !== confirm_new_password) {
    const error = new Error("Passwords do not match");
    (error as any).statusCode = 400;
    throw error;
  }

  if (typeof new_password !== "string" || new_password.length < 6) {
    const error = new Error("Password must be at least 6 characters long");
    (error as any).statusCode = 400;
    throw error;
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded.id || !decoded.email) {
      const error = new Error("Invalid reset token");
      (error as any).statusCode = 401;
      throw error;
    }

    const userRepo = ds.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: decoded.id, email: decoded.email },
    });

    if (!user) {
      const error = new Error("Invalid reset token");
      (error as any).statusCode = 401;
      throw error;
    }

    const passwordHash = await bcrypt.hash(new_password, 10);
    user.passwordHash = passwordHash;
    await userRepo.save(user);
  } catch (error) {
    const newError = new Error("Invalid or expired reset token");
    (newError as any).statusCode = 401;
    throw newError;
  }
};
