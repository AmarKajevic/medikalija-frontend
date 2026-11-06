import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";

const API_URL = "/api/diagnosis";

export const useDiagnoses = (patientId: string) => {
  return useQuery({
    queryKey: ["diagnosis", patientId],
    queryFn: async () => {
      const { data } = await api.get(`${API_URL}/${patientId}`);
      return data.diagnosis;
    },
  });
};

export const useAddDiagnosis = (patientId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newDiagnosis: { description: string }) => {
      const { data } = await api.post(`${API_URL}/addDiagnosis`, {
        patientId,
        ...newDiagnosis,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnosis", patientId] });
    },
  });
};

export interface WorkNote {
  _id: string;
  description: string;
  createdAt: string;
  createdBy: { _id: string; name: string; lastName?: string; role: string } | null;
}

/** Učinak rada u periodu [from, to) — npr. period specifikacije */
export const useWorkNotes = (patientId: string, from: string, to: string, enabled = true) =>
  useQuery({
    queryKey: ["diagnosis", patientId, from, to],
    queryFn: async () => {
      const p = new URLSearchParams({ from, to });
      const { data } = await api.get(`${API_URL}/${patientId}?${p}`);
      return (data.diagnosis ?? []) as WorkNote[];
    },
    enabled: enabled && !!patientId,
  });
