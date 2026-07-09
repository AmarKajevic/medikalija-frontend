import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveBilling } from "../api/specificationApi";

export const useSaveBilling = (specId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveBilling.bind(null, specId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specification", specId] });
    },
  });
};