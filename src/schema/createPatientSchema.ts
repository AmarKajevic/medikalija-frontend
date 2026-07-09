import { z } from "zod";

export const createPatientSchema = z.object({
  name: z.string().min(1, "Ime je obavezno"),
  lastName: z.string().min(1, "Prezime je obavezno"),
  dateOfBirth: z.string(),
  address: z.string().min(1),
  admissionDate: z.string(),
  contactPerson: z.string().optional(),
});

export type CreatePatientDto = z.infer<typeof createPatientSchema>;