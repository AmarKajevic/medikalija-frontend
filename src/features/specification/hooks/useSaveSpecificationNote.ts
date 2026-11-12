import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveSpecificationNote } from "@features/specification/api/specificationApi";
import { refreshAfterSpecChange } from "@features/specification/lib/queries";

export const useSaveSpecificationNote = (specId: string, patientId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note: string) => saveSpecificationNote(specId, note),
    onSuccess: (res) => refreshAfterSpecChange(queryClient, patientId, res.specification),
  });
};
