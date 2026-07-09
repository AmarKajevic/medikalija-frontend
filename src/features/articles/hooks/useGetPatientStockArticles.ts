import {  useQuery } from "@tanstack/react-query"
import { getPatientStockArticles } from "../api/getPatientStockArticles"

export const useGetPatientStockArticles = (patientId: string) => {
    return useQuery({
        queryKey:["patientStockArticles", patientId],
        queryFn: () => getPatientStockArticles(patientId)
    })
}