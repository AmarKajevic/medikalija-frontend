import { api } from "../../../shared/api/api"

type UpdateDischargeDate = {
    patientId: string;
    date: string;
}

export const updateDischargeDate = async ({patientId, date} : UpdateDischargeDate) => {
    const res = await api.patch(`/api/patient/${patientId}/discharge`, {
    dischargeDate: date,
  });

  return res.data
}
