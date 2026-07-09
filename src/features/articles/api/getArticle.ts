import { api } from "../../../shared/api/api"

export const getArticle = async (id: string) => {
    const res = await api.get(`/api/articles/${id}`)
    return res.data;
}