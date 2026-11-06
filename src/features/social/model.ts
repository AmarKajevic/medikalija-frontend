import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";

export type SocialCategory = "resident" | "family" | "institution" | "documents" | "finance" | "activity" | "other";

export const SOCIAL_CATEGORIES: Array<{ value: SocialCategory; label: string; color: "info" | "primary" | "warning" | "success" | "light" | "dark" }> = [
  { value: "resident", label: "Razgovor sa korisnikom", color: "primary" },
  { value: "family", label: "Porodica", color: "info" },
  { value: "institution", label: "CSR i ustanove", color: "warning" },
  { value: "documents", label: "Dokumenta i prava", color: "dark" },
  { value: "finance", label: "Finansije", color: "success" },
  { value: "activity", label: "Aktivnosti i druženje", color: "info" },
  { value: "other", label: "Ostalo", color: "light" },
];
export const categoryMeta = (c: SocialCategory) => SOCIAL_CATEGORIES.find((x) => x.value === c) ?? SOCIAL_CATEGORIES[SOCIAL_CATEGORIES.length - 1]!;

export interface SocialNote {
  _id: string;
  patient: { _id: string; name: string; lastName: string };
  author: { _id: string; name: string; lastName: string; role: string };
  category: SocialCategory;
  date: string;
  title: string;
  text: string;
  contact: string;
  followUp: { date: string | null; done: boolean; doneAt: string | null };
  createdAt: string;
}

export interface NoteInput {
  patientId: string;
  category: SocialCategory;
  date: string;
  title: string;
  text: string;
  contact: string;
  followUp: { date: string | null };
}

export interface NoteQuery {
  patientId?: string;
  category?: SocialCategory;
  followUp?: "open";
  limit?: number;
}

const keys = { all: ["socialNotes"] as const, list: (q: NoteQuery) => ["socialNotes", q] as const };

export function useSocialNotes(q: NoteQuery, enabled = true) {
  return useQuery({
    queryKey: keys.list(q),
    queryFn: async () => {
      const p = new URLSearchParams();
      if (q.patientId) p.set("patientId", q.patientId);
      if (q.category) p.set("category", q.category);
      if (q.followUp) p.set("followUp", q.followUp);
      if (q.limit) p.set("limit", String(q.limit));
      return (await api.get(`/api/social-notes?${p}`)).data.notes as SocialNote[];
    },
    enabled,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: keys.all });
}

export function useSaveNote() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: NoteInput }) =>
      (id ? await api.put(`/api/social-notes/${id}`, input) : await api.post("/api/social-notes", input)).data.note as SocialNote,
    onSuccess: invalidate,
  });
}

export function useFollowUpDone() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => (await api.post(`/api/social-notes/${id}/follow-up`, { done })).data.note as SocialNote,
    onSuccess: invalidate,
  });
}

export function useDeleteNote() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: async (id: string) => api.delete(`/api/social-notes/${id}`), onSuccess: invalidate });
}

/** Podsetnik: "kasni", "danas" ili za koliko dana */
export function followUpState(date: string | null): { label: string; tone: "error" | "warning" | "light" } | null {
  if (!date) return null;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return { label: `kasni ${-days} ${-days === 1 ? "dan" : "dana"}`, tone: "error" };
  if (days === 0) return { label: "danas", tone: "warning" };
  return { label: days === 1 ? "sutra" : `za ${days} dana`, tone: "light" };
}
