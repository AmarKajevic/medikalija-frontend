import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addCombinationToPatient } from "@features/combinations/api/addCombinationToPatient";
import { refreshAfterSpecChange } from "@features/specification/lib/queries";

export const useAddCombinationToPatient = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: addCombinationToPatient,
    onSuccess: (res, variables) => refreshAfterSpecChange(qc, variables.patientId, res.specification),
  });
};
