import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";

export type UserStatus = "invited" | "active" | "suspended";

export interface ManagedUser {
  _id: string;
  name: string;
  lastName: string;
  email?: string | null;
  username?: string | null;
  role: string;
  loginAllowed?: boolean;
  status: UserStatus;
  hasPassword: boolean;
  hasGoogle: boolean;
  pendingLink: { purpose: "invite" | "reset"; expiresAt: string } | null;
  lastLoginAt: string | null;
  lastLoginMethod: "password" | "google" | null;
  invitedBy?: { name: string; lastName: string } | null;
  invitedAt?: string | null;
  createdAt?: string;
}

export interface IssuedLink {
  url: string;
  expiresAt: string;
  emailSent: boolean;
}

// Uloge sa pristupom aplikaciji i ostalo osoblje (vodi se u evidenciji, bez prijave)
export const ROLES: Array<{ value: string; label: string; login: boolean }> = [
  { value: "main-nurse", label: "Glavna sestra", login: true },
  { value: "nurse", label: "Medicinska sestra", login: true },
  { value: "doctor", label: "Doktor", login: true },
  { value: "social-worker", label: "Socijalni radnik", login: true },
  { value: "physiotherapist", label: "Fizioterapeut", login: true },
  { value: "admin", label: "Direktor / administrator", login: true },
  { value: "Caregiver", label: "Negovatelj", login: false },
  // Stari zapis osoblja bez prijave; za pristup aplikaciji pozovite "Fizioterapeut"
  { value: "Physiotherapist", label: "Fizioterapeut (bez prijave)", login: false },
  { value: "Occupational Therapist", label: "Radni terapeut", login: false },
  // Stari zapis osoblja bez prijave; za pristup aplikaciji pozovite "Socijalni radnik"
  { value: "Social Worker", label: "Socijalni radnik (bez prijave)", login: false },
  { value: "Kitchen", label: "Kuhinja", login: false },
  { value: "Cleaner", label: "Higijena", login: false },
  { value: "Janitor", label: "Domar", login: false },
  { value: "Administration", label: "Administracija", login: false },
];
export const roleName = (r: string) => ROLES.find((x) => x.value === r)?.label ?? r;
export const canLogin = (r: string) => ROLES.find((x) => x.value === r)?.login ?? false;

const KEY = ["users"] as const;

export function useUsers() {
  return useQuery({ queryKey: KEY, queryFn: async () => ((await api.get("/api/auth/users")).data.users ?? []) as ManagedUser[] });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

export function useInviteUser() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (body: { name: string; lastName: string; role: string; email?: string; username?: string }) =>
      (await api.post("/api/auth/invitations", body)).data as { user: ManagedUser; invite: IssuedLink },
    onSuccess: invalidate,
  });
}

export function useAddStaff() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (body: { name: string; lastName: string; role: string; email?: string }) => (await api.post("/api/auth/staff", body)).data,
    onSuccess: invalidate,
  });
}

export function useUserLink() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, kind }: { id: string; kind: "invite" | "reset" }) => {
      const { data } = await api.post(`/api/auth/users/${id}/${kind === "invite" ? "invite" : "reset-link"}`);
      return (data.invite ?? data.link) as IssuedLink;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; role?: string; status?: "active" | "suspended"; name?: string; lastName?: string; email?: string; username?: string }) =>
      (await api.patch(`/api/auth/users/${id}`, body)).data.user as ManagedUser,
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: async (id: string) => (await api.delete(`/api/auth/users/${id}`)).data as { message: string }, onSuccess: invalidate });
}

/** "pre 5 min", "juče", "12.10.2026." */
export function lastSeen(iso: string | null): string {
  if (!iso) return "nikad";
  const d = new Date(iso);
  const minutes = Math.round((Date.now() - d.getTime()) / 60_000);
  if (minutes < 1) return "upravo";
  if (minutes < 60) return `pre ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `pre ${hours} h`;
  const days = Math.round(hours / 24);
  if (days === 1) return "juče";
  if (days < 7) return `pre ${days} dana`;
  return d.toLocaleDateString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric" });
}
