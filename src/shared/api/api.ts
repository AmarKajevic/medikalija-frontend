import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { User } from "@shared/types/index";

// API je na istom sajtu kao aplikacija: /api/* prosleđuje Vercel (vercel.json), a lokalno Vite proxy.
// Tako je kolačić sesije kolačić prve strane (radi i u Safariju), a lokalni razvoj nikad ne gađa
// produkciju slučajno. VITE_API_URL samo ako API mora biti na drugoj adresi.
const API_URL = import.meta.env.VITE_API_URL ?? "";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Access token je namerno samo u memoriji (ne u localStorage) da bi se smanjio
// rizik od krađe tokena kroz XSS. Refresh token (httpOnly kolačić) omogućava
// da se access token ponovo dobije nakon reload-a stranice.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

let onAuthFailure: (() => void) | null = null;

// Poziva se kada tihi refresh ne uspe (npr. sesija istekla ili odjavljena sa drugog uređaja),
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

export interface SessionResult {
  accessToken: string;
  user: User;
}

let refreshPromise: Promise<SessionResult | null> | null = null;

// Refresh token se rotira pri svakom osvežavanju, a kolačić je zajednički za sve tabove.
// Web Locks: tabovi osvežavaju jedan po jedan, pa sledeći šalje već novi kolačić (bez lažne
// "ponovne upotrebe" koju server tumači kao krađu). U istom tabu se zahtevi dele (jedno osvežavanje).
async function doRefresh(): Promise<SessionResult | null> {
  try {
    const { data } = await api.post("/api/auth/refresh");
    if (!data?.accessToken) return null;
    setAccessToken(data.accessToken);
    return { accessToken: data.accessToken, user: data.user };
  } catch {
    setAccessToken(null);
    return null;
  }
}

export function refreshSession(): Promise<SessionResult | null> {
  if (!refreshPromise) {
    const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
    refreshPromise = (locks ? locks.request("medikalija-auth-refresh", doRefresh) : doRefresh()).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

const AUTH_ROUTES = ["/api/auth/refresh", "/api/auth/login", "/api/auth/logout", "/api/auth/google"];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthRoute = AUTH_ROUTES.some((r) => originalRequest?.url?.includes(r));

    // 401: token istekao (15 min) ili sesija završena — jednom se pokuša osvežavanje
    if (originalRequest && error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      const session = await refreshSession();
      if (session) {
        originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
        return api(originalRequest);
      }
      onAuthFailure?.();
    }

    return Promise.reject(error);
  }
);
