import { api } from "../../../shared/api/api"


export const getCombinationGroup = async () => {
    const res = await api.get("/combinationGroup")
    return res.data;
}