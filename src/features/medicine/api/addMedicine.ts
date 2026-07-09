import { api } from "../../../shared/api/api"

export const addMedicine  = async (data: any) => {
    const res = await api.post("/medicine/add", data)
    return res.data
}