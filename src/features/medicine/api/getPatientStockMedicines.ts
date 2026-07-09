import { api } from "../../../shared/api/api"

export const getPatientStockMedicines = async (patientId: string) => {
    const res = await api.get(`/api/medicine/patient/${patientId}/stock`)

    return res.data?.medicines ?? res.data ?? [];

    
}