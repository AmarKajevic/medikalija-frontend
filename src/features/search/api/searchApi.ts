import { api } from "../../../shared/api/api"

export const searchApi = async (query: string) => {
    const res = await api.get(`/api/search?q=${query}`)
    return res.data.results || [];
}