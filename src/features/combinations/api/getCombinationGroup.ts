import { api } from "../../../shared/api/api"


export const getCombinationGroup = async () => {
    const res = await api.get("/api/combinationGroup")
    return res.data;
}