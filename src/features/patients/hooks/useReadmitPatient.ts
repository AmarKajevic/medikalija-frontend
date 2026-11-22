import { useMutation, useQueryClient } from "@tanstack/react-query";
import { readmitPatient } from "@features/patients/api/readmitPatient";

export const useReadmitPatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: readmitPatient,
    // Menja se prijem, periodi specifikacija i dokumentacija — osvežava se sve o korisniku
    onSuccess: () => queryClient.invalidateQueries(),
  });
};
