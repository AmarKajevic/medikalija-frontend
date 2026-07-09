import { AddFamilyItemForm } from "../../../shared/ui/AddFamilyItemForm/AddFamilyItemForm";
import { useAddMedicine } from "../hooks/useAddMedicine";
import { useMedicines } from "../hooks/useMedicines";
import { usePatients } from "../../patients/hooks/usePatients";
import { buildFamilyMedicinePayload } from "../lib/buildFamilyMedicinePayload";

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