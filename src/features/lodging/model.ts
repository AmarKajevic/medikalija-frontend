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
