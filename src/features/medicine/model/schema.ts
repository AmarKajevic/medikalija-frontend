import { z } from "zod";


export const useMedicineSchema = z.object({
  medicineId: z.string().min(1),

  amount: z.coerce.number().min(0.01),

  days: z.coerce.number().optional().nullable(),
  timesPerDay: z.coerce.number().optional().nullable(),
  portion: z.coerce.number().optional().nullable(),
});
export type UseMedicineFormValues = z.infer<typeof useMedicineSchema>;


export const addMedicineSchema = z.object({
  medicineId: z.string().optional(),
  name: z.string().optional(),
  pricePerUnit: z.number().optional(),
  unitsPerPackage: z.number().min(1),
  totalQuantity: z.number().min(1),
  patientId: z.string().optional(),
  fromFamily: z.boolean(),
});

export type AddMedicineFormValues = z.infer<typeof addMedicineSchema>;