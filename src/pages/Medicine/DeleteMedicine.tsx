import { useAuth } from "../../context/AuthContext";
import axios from "axios";

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
  const { token } = useAuth();

  const handleDelete = async () => {
    try {
      const endpoint =
        mode === "family"
          ? `http://localhost:5000/api/medicine/patient-stock/${medicineId}`
          : `http://localhost:5000/api/medicine/${medicineId}`;

      const response = await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        onDeleted();
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <button
      className="rounded bg-red-500 text-white px-3 py-1 hover:bg-red-600"
      onClick={handleDelete}
    >
      Obriši
    </button>
  );
}
