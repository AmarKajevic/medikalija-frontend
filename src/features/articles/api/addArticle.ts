import { api } from "../../../shared/api/api"

export const addArticle = async (data: any) => {
    const res = await api.post("/api/articles/add", data)
    return res.data
}