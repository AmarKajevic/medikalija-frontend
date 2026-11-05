import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAnalysis } from "@features/analysis/api/updateAnalysis";

export const useUpdateAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; price?: number } }) => updateAnalysis(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      queryClient.invalidateQueries({ queryKey: ["analysis"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};