export type Role = "nurse" | "main-nurse" | "admin" | "doctor" | "social-worker" | "physiotherapist";

export interface User {
  _id: string;
  email: string;
  name: string;
  lastName: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
