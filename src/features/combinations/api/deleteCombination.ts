import { api } from "../../../shared/api/api"

export const deleteCombination = async (id: string) => {
    await api.delete(`/analysis/combination/combinations/${id}`)
}