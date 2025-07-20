export interface IRegisterUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface IUpdateProfile {
  firstName?: string;
  lastName?: string;
}
