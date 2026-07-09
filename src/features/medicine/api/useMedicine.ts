import { api } from "../../../shared/api/api";
import { UseMedicinePayload } from "../types/types";



export const useMedicineApi = async (payload: UseMedicinePayload) => {
  const { data } = await api.post("/api/medicine/use", payload);
  return data;
};