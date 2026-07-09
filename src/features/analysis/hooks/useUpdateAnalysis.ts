import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAnalysis } from "../api/updateAnalysis";

export const useUpdateAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: any) => updateAnalysis(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      queryClient.invalidateQueries({ queryKey: ["analysis"] });
    },
  });
};