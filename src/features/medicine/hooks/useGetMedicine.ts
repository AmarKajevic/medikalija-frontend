import { useQuery } from "@tanstack/react-query"
import { getMedicine } from "../api/getMedicine"

export const useGetMedicine = (medicineId: string) =>{
    return useQuery({
        queryKey:["medicine", medicineId],
        queryFn: () => getMedicine(medicineId)
    })
}