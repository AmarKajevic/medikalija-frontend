import { useQuery } from "@tanstack/react-query"
import { getPatients } from "../api/getPatients"

export const usePatients = () => {
    return useQuery({
        queryKey: ["patients"],
        queryFn: getPatients
    })
}