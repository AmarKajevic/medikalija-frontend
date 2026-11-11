import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import { User } from "@shared/types/index";

export type Patient = {
  _id: string;
  name: string;
  lastName: string;
  /** Može biti prazan: korisnik unet samo sa osnovnim podacima */
  dateOfBirth: string | Date | null;
  admissionDate: string | Date;
  contactPerson: string;
  address: string;
  dischargeDate: string |Date;
  createdBy: User
};

export default function usePatient(patientId: string) {
  return useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const res = await api.get(`/api/patient/${patientId}`)
      return res.data.patient as Patient;

    },
    enabled: !!patientId, // pokreće se samo ako imaš ID
  })

}