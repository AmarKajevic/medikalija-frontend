import { api } from "../../../shared/api/api"


export const getPatients = async () => {
    const res = await api.get("/api/patient")
    return res.data;
}