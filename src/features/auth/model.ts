import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/api/api";

export interface AuthConfig {
  googleClientId: string | null;
  emailEnabled: boolean;
}

/** Šta je uključeno na serveru (Google prijava, slanje mejlova) */
export function useAuthConfig() {
  return useQuery({
    queryKey: ["authConfig"],
    queryFn: async () => (await api.get("/api/auth/config")).data as AuthConfig,
    staleTime: 60 * 60_000,
    retry: 1,
  });
}

/** Poruka greške sa servera, ili zamenska */
export const serverMessage = (err: unknown, fallback: string) => {
  const res = (err as { response?: { data?: { message?: string; error?: string } } }).response;
  return res?.data?.message || res?.data?.error || fallback;
};

export const PASSWORD_MIN = 6;

/** "Chrome · Windows" iz User-Agent zaglavlja (dovoljno da se uređaj prepozna) */
export function describeDevice(ua: string): { label: string; mobile: boolean } {
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return { label: ua ? [browser, os].filter(Boolean).join(" · ") : "Nepoznat uređaj", mobile: /Android|iPhone|iPad|Mobile/.test(ua) };
}
