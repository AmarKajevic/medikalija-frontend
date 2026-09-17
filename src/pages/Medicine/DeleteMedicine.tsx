import { api } from "@shared/api/api";

interface DeleteMedicineProps {
  medicineId: string;
  mode?: "home" | "family";
  onDeleted: () => void;
}

export default function DeleteMedicine({
  medicineId,
  mode = "home",
  onDeleted,
}: DeleteMedicineProps) {
  const handleDelete = async () => {
    try {
      const endpoint =
        mode === "family"
          ? `/api/medicine/patient-stock/${medicineId}`
          : `/api/medicine/${medicineId}`;

      const response = await api.delete(endpoint);

      if (response.data.success) {
        onDeleted();
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <button
      className="rounded-md bg-error-50 px-3 py-1.5 text-xs font-medium text-error-600 hover:bg-error-100 dark:bg-error-500/15 dark:text-error-400 dark:hover:bg-error-500/25"
      onClick={handleDelete}
    >
      Obriši
    </button>
  );
}
