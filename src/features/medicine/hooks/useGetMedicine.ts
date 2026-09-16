import { useQuery } from "@tanstack/react-query"
import { getMedicine } from "@features/medicine/api/getMedicine"

export const useGetMedicine = (medicineId: string) =>{
    return useQuery({
        queryKey:["medicine", medicineId],
        queryFn: () => getMedicine(medicineId)
    })
}