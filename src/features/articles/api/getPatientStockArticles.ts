import { api } from "../../../shared/api/api"

export const getPatientStockArticles = async (patientId: string) => {
    const res = await api.get(`/api/articles/patient/${patientId}`)
    return res.data?.articles ?? [];
    
    
}