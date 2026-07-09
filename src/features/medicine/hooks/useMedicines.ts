import { useQuery } from "@tanstack/react-query";
import { getMedicines } from "../api/getMedicines";

export const useMedicines = () => {
  return useQuery({
    queryKey: ["medicines"],
    queryFn: getMedicines,
  });
}