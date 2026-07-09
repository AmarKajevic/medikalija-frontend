import { api } from "../../../shared/api/api"
import { useArticlePayload } from "../types/types"

export const useArticle = async(payload: useArticlePayload) =>{
    const res = await api.post("/api/articles/use", payload)
    return res.data
}