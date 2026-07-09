import { api } from "../../../shared/api/api"

export const getPatientStockArticles = async (patientId: string) => {
    const res = await api.get(`/articles/patient/${patientId}`)
    return res.data?.articles ?? [];
    
    
}