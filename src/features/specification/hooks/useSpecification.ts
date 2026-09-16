import { useQuery } from "@tanstack/react-query";
import { fetchSpecification } from "@features/specification/api/specificationApi";

export const useSpecification = (id: string) => {
  return useQuery({
    queryKey: ["specification", id],
    queryFn: () => fetchSpecification(id),
    enabled: !!id,
  });
};