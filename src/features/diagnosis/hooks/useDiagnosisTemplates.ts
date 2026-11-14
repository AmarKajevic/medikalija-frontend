import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";

export interface DiagnosisTemplate {
  _id: string;
  name: string;
  description: string;
  createdAt?: string;
}

const KEY = ["diagnosisTemplates"];

export const useDiagnosisTemplates = () =>
  useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<DiagnosisTemplate[]> => {
      const { data } = await api.get("/api/diagnosisTemplate");
      return data.diagnosisTemplates ?? [];
    },
  });

export const useAddDiagnosisTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; description: string }) => {
      const { data } = await api.post("/api/diagnosisTemplate/add", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useUpdateDiagnosisTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name: string; description: string }) => (await api.put(`/api/diagnosisTemplate/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useDeleteDiagnosisTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/diagnosisTemplate/${id}`)).data as { message: string },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};
