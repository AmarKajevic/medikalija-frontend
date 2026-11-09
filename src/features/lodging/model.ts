import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";

// Cenovnik smeštaja: admin unosi cene ("10 dana = 200 €"), uprava ih bira u obračunu.
export interface LodgingPrice {
  _id: string;
  name: string;
  days: number | null;
  priceEUR: number;
  active: boolean;
}

export type LodgingPriceInput = Pick<LodgingPrice, "name" | "days" | "priceEUR" | "active">;

const KEY = ["lodgingPrices"] as const;

export function useLodgingPrices({ all = false, enabled = true } = {}) {
  return useQuery({
    queryKey: [...KEY, all],
    queryFn: async () => (await api.get(`/api/lodging-prices${all ? "?all=1" : ""}`)).data.prices as LodgingPrice[],
    enabled,
  });
}

export function useSaveLodgingPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<LodgingPriceInput> & { id?: string }) =>
      (id ? (await api.put(`/api/lodging-prices/${id}`, data)).data.price : (await api.post("/api/lodging-prices", data)).data.price) as LodgingPrice,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteLodgingPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/lodging-prices/${id}`)).data as { message: string },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

// Napomene za vanstandardni period smeštaja: admin pravi listu, uprava bira napomenu u obračunu
// (štampa se u istom redu kao smeštaj).
export interface LodgingNote {
  _id: string;
  text: string;
}

const NOTES_KEY = ["lodgingNotes"] as const;

export function useLodgingNotes({ enabled = true } = {}) {
  return useQuery({
    queryKey: NOTES_KEY,
    queryFn: async () => (await api.get("/api/lodging-notes")).data.notes as LodgingNote[],
    enabled,
  });
}

export function useSaveLodgingNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, text }: { id?: string; text: string }) =>
      (id ? (await api.put(`/api/lodging-notes/${id}`, { text })).data.note : (await api.post("/api/lodging-notes", { text })).data.note) as LodgingNote,
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTES_KEY }),
  });
}

export function useDeleteLodgingNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/lodging-notes/${id}`)).data as { message: string },
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTES_KEY }),
  });
}
