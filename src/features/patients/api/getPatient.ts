import { api } from "../../../shared/api/api"


export const getPatient = async (id: string) => {
    const res = await api.get(`/api/patient/${id}`)
    return res.data.patient ?? res.data ?? null;
}