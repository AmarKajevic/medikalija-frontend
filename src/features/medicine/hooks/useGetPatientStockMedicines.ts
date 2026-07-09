import { useQuery } from "@tanstack/react-query"
import { getPatientStockMedicines } from "../api/getPatientStockMedicines"

export const useGetPatientStockMedicines = (patientId: string) => {
    return useQuery({
        queryKey: ["patientStock", patientId],
        queryFn: () => getPatientStockMedicines(patientId)
    })
}