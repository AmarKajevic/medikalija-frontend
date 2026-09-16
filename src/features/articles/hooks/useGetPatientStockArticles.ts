import {  useQuery } from "@tanstack/react-query"
import { getPatientStockArticles } from "@features/articles/api/getPatientStockArticles"

export const useGetPatientStockArticles = (patientId: string) => {
    return useQuery({
        queryKey:["patientStockArticles", patientId],
        queryFn: () => getPatientStockArticles(patientId)
    })
}