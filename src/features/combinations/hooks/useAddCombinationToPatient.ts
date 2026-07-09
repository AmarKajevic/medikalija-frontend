import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addCombinationToPatient } from "../api/addCombinationToPatient";

export const useAddCombinationToPatient = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: addCombinationToPatient,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patientSpecification"] });
      qc.invalidateQueries({ queryKey: ["usedCombinations"] });
    },
  });
};