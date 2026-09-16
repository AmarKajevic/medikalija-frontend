import { AddDomItemForm } from "@shared/ui/AddDomItemForm/AddDomItemForm";
import { useAddMedicine } from "@features/medicine/hooks/useAddMedicine";
import { useMedicines } from "@features/medicine/hooks/useMedicines";
import { buildMedicinePayload } from "@features/medicine/lib/buildMedicinePayload";

export const AddMedicineFormNew = () => (
  <AddDomItemForm
    config={{
      title: "Dodavanje leka (Dom)",
      useAddMutation: useAddMedicine,
      useGetItems: useMedicines,
      buildPayload: buildMedicinePayload,
      priceFieldName: "pricePerUnit",
      placeholderPrice: "Cena po jedinici (din)",
      placeholderUnit: "Tableta po pakovanju",
      itemNameSingular: "lek",
    }}
  />
);