import { api } from "../../../shared/api/api"

export const deletePatient = async (id: string) => {
    const res = await api.delete(`/api/patient/${id}`)
    return res.data;
}