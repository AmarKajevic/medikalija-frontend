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
