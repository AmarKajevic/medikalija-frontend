import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";

// Podaci o ustanovi (naziv, logo, kontakt) — menja ih administrator u Podešavanjima.
// Prikazuju se u meniju, na prijavi i u zaglavlju PDF specifikacije.
export interface Facility {
  name: string;
  subtitle: string;
  address: string;
  city: string;
  taxId: string;
  registrationNumber: string;
  phone: string;
  email: string;
  website: string;
  bankAccount: string;
  /** data URL (PNG/JPG/WebP) ili prazno */
  logo: string;
}

export const DEFAULT_FACILITY: Facility = {
  name: "Medikalija",
  subtitle: "Dom za stara lica",
  address: "",
  city: "",
  taxId: "",
  registrationNumber: "",
  phone: "",
  email: "",
  website: "",
  bankAccount: "",
  logo: "",
};

const facilityKey = ["facility"] as const;

export function useFacility() {
  const query = useQuery({
    queryKey: facilityKey,
    queryFn: async () => (await api.get("/api/settings/facility")).data.facility as Facility,
    staleTime: 10 * 60_000,
  });
  return { ...query, facility: query.data ?? DEFAULT_FACILITY };
}

export function useUpdateFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (changes: Partial<Facility>) =>
      (await api.put("/api/settings/facility", changes)).data.facility as Facility,
    onSuccess: (facility) => qc.setQueryData(facilityKey, facility),
  });
}

/** Naslov kartice u browseru prati naziv ustanove */
export function useFacilityDocumentTitle() {
  const { facility, isSuccess } = useFacility();
  useEffect(() => {
    if (isSuccess) document.title = facility.name;
  }, [facility.name, isSuccess]);
}

/** Jedan red adrese i kontakta za zaglavlja ("Ulica 1, Novi Sad · PIB 123 · 021 …") */
export function facilityContactLine(f: Facility): string {
  const place = [f.address, f.city].filter(Boolean).join(", ");
  return [
    place,
    f.taxId && `PIB ${f.taxId}`,
    f.registrationNumber && `MB ${f.registrationNumber}`,
    f.phone && `Tel. ${f.phone}`,
    f.email,
    f.website,
  ]
    .filter(Boolean)
    .join(" · ");
}
