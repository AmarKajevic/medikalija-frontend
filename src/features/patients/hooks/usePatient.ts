import { useQuery } from "@tanstack/react-query"
import { getPatient } from "@features/patients/api/getPatient"

export const usePatient = (id: string) => {
    return useQuery({
        queryKey:["patient", id],
        queryFn: () => getPatient(id),
        enabled: !!id,
    })
}