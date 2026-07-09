import { useQuery } from "@tanstack/react-query";
import { getPatientStockMedicines } from "../api/getPatientStockMedicines";
import { getMedicines } from "../api/getMedicines";

type Option = {
  value: string;
  label: string;
  home: number;
  family: number;
};

export const useMedicineOptions = (patientId: string) => {
  const { data: medicines = [] } = useQuery({
    queryKey: ["medicines"],
    queryFn: getMedicines,
  });

  const { data: stock = [] } = useQuery({
    queryKey: ["patientStock", patientId],
    queryFn: () => getPatientStockMedicines(patientId),
    enabled: !!patientId,
  });

  const options: Option[] = medicines.map((m: any) => {
    const found = stock.find(
      (s: any) => s._id === m._id
    );

    return {
      value: m._id,
      label: m.name,
      home: m.quantity,
      family: found?.familyQuantity ?? 0,
    };
  });

  return options;
};