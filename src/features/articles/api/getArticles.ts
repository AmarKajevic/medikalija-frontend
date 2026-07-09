import { api } from "../../../shared/api/api"

export const getArrticles = async () => {
    const res = await api.get("/api/articles")
    return res.data?.articles ?? res.data ?? []
}