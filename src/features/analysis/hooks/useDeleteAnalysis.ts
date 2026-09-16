import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAnalysis } from "@features/analysis/api/deleteAnalysis";

export const useDeleteAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (analysisId: string) => deleteAnalysis(analysisId),

    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["analyses"] });
        queryClient.invalidateQueries({ queryKey: ["analysis"] });
    },
  });
};