import { useQuery } from "@tanstack/react-query"
import { getPatients } from "@features/patients/api/getPatients"

export const usePatients = () => {
    return useQuery({
        queryKey: ["patients"],
        queryFn: getPatients
    })
}