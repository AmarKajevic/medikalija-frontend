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
  /** Raniji boravci (otpušten pa ponovo primljen) */
  previousStays?: PatientStay[];
};

export type PatientStay = { admissionDate: string; dischargeDate: string; readmittedAt?: string | null };

/**
 * Prvi dan tekućeg boravka za dokumentaciju ("YYYY-MM-DD"): dan posle poslednjeg otpusta.
 * Bez ranijih boravaka null — važi sva dokumentacija (i prijemna procena pre prijema).
 */
export function currentStayFrom(patient: { previousStays?: PatientStay[] | null } | null | undefined): string | null {
  const stays = patient?.previousStays ?? [];
  if (!stays.length) return null;
  const last = stays.map((s) => s.dischargeDate.slice(0, 10)).sort().pop()!;
  const d = new Date(`${last}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

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