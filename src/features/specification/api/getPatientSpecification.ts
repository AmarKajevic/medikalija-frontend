import { api } from "../../../shared/api/api"

export const getPatientSpecification = async (patientId: string) => {
  const res = await api.get(`/api/specification/${patientId}`);



  return res.data?.specification; // 🔥 KLJUČNO
};