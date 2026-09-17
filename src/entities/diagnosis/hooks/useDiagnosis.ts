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
