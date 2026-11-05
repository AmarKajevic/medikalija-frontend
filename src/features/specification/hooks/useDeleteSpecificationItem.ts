import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSpecificationItem } from "@features/specification/api/deleteSpecificationItem";
import { refreshAfterSpecChange } from "@features/specification/lib/queries";

export const useDeleteSpecificationItem = (patientId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSpecificationItem,
    onSuccess: (res) => refreshAfterSpecChange(queryClient, patientId, res.specification),
  });
};
