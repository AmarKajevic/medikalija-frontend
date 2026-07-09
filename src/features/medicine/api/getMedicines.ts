import { api } from "../../../shared/api/api"

export const getMedicines = async () => {
    const res = await api.get("/api/medicine")
    return res.data?.medicines ?? res.data ?? [];
}