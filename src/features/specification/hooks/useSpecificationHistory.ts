import { useQuery } from "@tanstack/react-query";
import { fetchSpecificationHistory } from "../api/specificationApi";

export const useSpecificationHistory = (patientId: string) => {
  return useQuery({
    queryKey: ["specificationHistory", patientId],
    queryFn: () => fetchSpecificationHistory(patientId),
    enabled: !!patientId,
  });
};