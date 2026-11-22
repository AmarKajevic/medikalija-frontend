import { api } from "@shared/api/api";

/** Ponovni prijem otpuštenog korisnika ("YYYY-MM-DD") */
export const readmitPatient = async ({ patientId, date }: { patientId: string; date: string }) =>
  (await api.patch(`/api/patient/${patientId}/readmit`, { admissionDate: date })).data;
