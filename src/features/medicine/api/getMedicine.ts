import { api } from "../../../shared/api/api"

export const getMedicine = async (medicineId: string) => {
    const res = await api.get(`/api/medicine/${medicineId}`)
    return res.data
}