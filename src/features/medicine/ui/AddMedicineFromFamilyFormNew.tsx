import { AddFamilyItemForm } from "@shared/ui/AddFamilyItemForm/AddFamilyItemForm";
import { useAddMedicine } from "@features/medicine/hooks/useAddMedicine";
import { useMedicines } from "@features/medicine/hooks/useMedicines";
import { usePatients } from "@features/patients/hooks/usePatients";
import { buildFamilyMedicinePayload } from "@features/medicine/lib/buildFamilyMedicinePayload";

export const AddMedicineFromFamilyFormNew = () => (
  <AddFamilyItemForm
    config={{
      title: "Dodavanje leka (Porodica)",
      useAddMutation: useAddMedicine,
      useGetItems: useMedicines,
      buildPayload: buildFamilyMedicinePayload,
      placeholderUnit: "Tableta po pakovanju",
      itemNameSingular: "lek",
      usePatients,
    }}
  />
);