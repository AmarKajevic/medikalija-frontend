import { api } from "../../../shared/api/api"

export const getArticle = async (id: string) => {
    const res = await api.get(`/articles/${id}`)
    return res.data;
}