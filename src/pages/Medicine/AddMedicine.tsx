import { AddMedicineFormNew } from "@features/medicine/ui/AddMedicineFormNew";
import { AddMedicineFromFamilyFormNew } from "@features/medicine/ui/AddMedicineFromFamilyFormNew";

const AddMedicine = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Dodavanje leka
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Dodaj novi lek u zalihe doma ili unesi lek koji je donela porodica pacijenta.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AddMedicineFormNew />
        <AddMedicineFromFamilyFormNew />
      </div>
    </div>
  );
};

export default AddMedicine;