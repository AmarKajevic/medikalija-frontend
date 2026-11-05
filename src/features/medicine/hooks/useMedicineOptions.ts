import { useQuery } from "@tanstack/react-query";
import { getPatientStockMedicines } from "@features/medicine/api/getPatientStockMedicines";
import { getMedicines } from "@features/medicine/api/getMedicines";
import { StockOption } from "@shared/ui/combobox/StockCombobox";

type MedicineDto = { _id: string; name: string; quantity: number; pricePerUnit?: number };
type FamilyStockDto = { _id: string; familyQuantity: number };

export const useMedicineOptions = (patientId: string) => {
  const medicines = useQuery({ queryKey: ["medicines"], queryFn: getMedicines });
  const stock = useQuery({
    queryKey: ["patientStock", patientId],
    queryFn: () => getPatientStockMedicines(patientId),
    enabled: !!patientId,
  });

  const options: StockOption[] = ((medicines.data ?? []) as MedicineDto[]).map((m) => ({
    value: m._id,
    label: m.name,
    home: m.quantity ?? 0,
    family: ((stock.data ?? []) as FamilyStockDto[]).find((s) => s._id === m._id)?.familyQuantity ?? 0,
    price: m.pricePerUnit ?? 0,
  }));

  return { options, isLoading: medicines.isLoading || stock.isLoading };
};
