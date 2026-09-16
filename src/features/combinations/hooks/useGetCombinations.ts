import { useQuery } from "@tanstack/react-query"
import { getCombinations } from "@features/combinations/api/getCombinations"
import { Group } from "@features/combinations/types/types"

export const useGetCombinations = () => {
    return useQuery<Group[]>({
        queryKey: ["groups"],
        queryFn: () =>  getCombinations()
    })
}