import { useQuery } from "@tanstack/react-query"
import { getCombinations } from "../api/getCombinations"
import { Group } from "../types/types"

export const useGetCombinations = () => {
    return useQuery<Group[]>({
        queryKey: ["groups"],
        queryFn: () =>  getCombinations()
    })
}