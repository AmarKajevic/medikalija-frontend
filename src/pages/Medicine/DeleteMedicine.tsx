import { useAuth } from "../../context/AuthContext";
import axios from "axios";

interface DeleteMedicineProps {
  medicineId: string;
  onDeleted: () => void; // callback za parent
}

export default function DeleteMedicine({ medicineId, onDeleted }: DeleteMedicineProps) {
  const { token } = useAuth();

  const handleDelete = async () => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/medicine/${medicineId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        onDeleted(); // 👈 obavesti parent da osveži listu
      }
    } catch (error) {
      console.error(error);
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
