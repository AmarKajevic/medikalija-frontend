import { useMedicines } from "@features/medicine/hooks/useMedicines";
import { AddMedicineFormNew } from "@features/medicine/ui/AddMedicineFormNew";
import { AddMedicineFromFamilyFormNew } from "@features/medicine/ui/AddMedicineFromFamilyFormNew";
import MedicineTable from "@features/medicine/ui/MedicineTable";

const MedicineListWidget = () => {
  const { data, isLoading } = useMedicines();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Lekovi
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Pregled zaliha lekova doma, sa mogućnošću dodavanja i brisanja.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <AddMedicineFormNew />
        <AddMedicineFromFamilyFormNew />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
          Sve zalihe
        </h2>
        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Učitavanje...</p>
        ) : (
          <MedicineTable medicines={data} />
        )}
      </div>
    </div>
  );
};

export default MedicineListWidget;