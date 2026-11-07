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

export const PASSWORD_MIN = 10;
