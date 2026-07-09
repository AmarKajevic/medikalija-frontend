import { api } from "../../../shared/api/api"

export const getMedicines = async () => {
    const res = await api.get("/medicine")
    return res.data?.medicines ?? res.data ?? [];
}