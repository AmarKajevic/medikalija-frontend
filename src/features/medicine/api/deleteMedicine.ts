import { api } from "../../../shared/api/api"

export const deleteMedicine = async (id: string) => {
    await api.delete(`/api/medicine/${id}`)
}