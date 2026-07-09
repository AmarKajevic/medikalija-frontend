import { useMutation, useQueryClient } from "@tanstack/react-query"
import { addCombination, addCombinationToGroup } from "../api/addCombination"

export const useAddCombination = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const combo = await addCombination({
        name: data.name,
        analysisIds: data.analysisIds,
      });

      await addCombinationToGroup({
        name: data.groupName,
        combinations: [combo.combination._id],
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};