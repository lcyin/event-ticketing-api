import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN || "3600", 10);

export interface JWTPayload {
  id: string;
  email: string;
  role?: string;
}

export const generateToken = (
  payload: JWTPayload,
  options?: SignOptions
): string => {
  const defaultOptions: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, { ...defaultOptions, ...options });
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid token");
  }
};
