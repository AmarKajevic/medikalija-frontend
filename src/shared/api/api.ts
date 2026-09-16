import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Access token je namerno samo u memoriji (ne u localStorage) da bi se smanjio
// rizik od krađe tokena kroz XSS. Refresh token (httpOnly cookie) omogućava
// da se access token ponovo dobije nakon reload-a stranice.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

let onAuthFailure: (() => void) | null = null;

// Poziva se kada tihi refresh ne uspe (npr. refresh token istekao/nevalidan),
// da bi AuthContext mogao da resetuje stanje ulogovanog korisnika.
export function setOnAuthFailure(callback: (() => void) | null) {
  onAuthFailure = callback;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = api
      .post("/api/auth/refresh")
      .then((res) => {
        const newToken = res.data?.accessToken ?? null;
        setAccessToken(newToken);
        return newToken;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute =
      originalRequest?.url?.includes("/api/auth/refresh") ||
      originalRequest?.url?.includes("/api/auth/login");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      onAuthFailure?.();
    }

    return Promise.reject(error);
  }
);
