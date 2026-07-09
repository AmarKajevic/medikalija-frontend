import { api } from "../../../shared/api/api"

export const addArticle = async (data: any) => {
    const res = await api.post("/articles/add", data)
    return res.data
}