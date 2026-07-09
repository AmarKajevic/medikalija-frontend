export type Role = "nurse" | "main-nurse" | "admin";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}
