import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../shared/api/api";

const addExtraCostRequest = async (specId: string, amount: number, label: string) => {
  const { data } = await api.post(`/specification/${specId}/add-costs`, {
    extraCostAmount: amount,
    extraCostLabel: label,
  });
  return data.specification;
};

export const useAddExtraCost = (specId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, label }: { amount: number; label: string }) =>
      addExtraCostRequest(specId, amount, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specification", specId] });
    },
  });
};