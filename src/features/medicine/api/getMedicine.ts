import { api } from "../../../shared/api/api"

export const getMedicine = async (medicineId: string) => {
    const res = await api.get(`/medicine/${medicineId}`)
    return res.data
}