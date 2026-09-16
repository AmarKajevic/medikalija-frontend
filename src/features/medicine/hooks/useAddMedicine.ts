import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addMedicine } from "@features/medicine/api/addMedicine";

export const useAddMedicine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addMedicine,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
    },
  });
};