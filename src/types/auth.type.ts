import { User } from "../entities/User";

export interface ILoginUser {
  email?: string;
  password?: string;
}

export interface ILoginResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
  };
}
