import { useQuery } from "@tanstack/react-query";
import { getPatientSpecification } from "../api/getPatientSpecification";

export const usePatientSpecification = (patientId: string) => {
    
  return useQuery({
    queryKey: ["patientSpecification", patientId],
    queryFn: () => getPatientSpecification(patientId),
    enabled: !!patientId,
  });
};