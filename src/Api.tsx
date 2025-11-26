import axios from "axios";
import { AuthResponse, User } from "./types";
import { useAuth } from "./context/AuthContext";


const API_URL = "http://localhost:5000";

// Kreiramo axios instancu
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor da automatski ubaci token iz useAuth
export function useApi() {
  const { token } = useAuth();

  api.interceptors.request.use((config) => {
    if (token) {
      config.headers!["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });

  return api;
}

// Login
export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  return api.post("/api/auth/login", { email, password }).then(res => res.data);
}

// Registracija
export async function registerUserRequest(
  name: string,
  email: string,
  password: string,
  role: User["role"]
): Promise<{ message: string }> {
  const apiInstance = useApi();
  return apiInstance.post("/api/auth/register", { name, email, password, role }).then(res => res.data);
}

// Generic API request (GET, POST, PUT, DELETE)
export async function apiRequest<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown
): Promise<T> {
  const apiInstance = useApi();
  const res = await apiInstance.request<T>({
    url: path,
    method,
    data: body,
  });
  return res.data;
}
