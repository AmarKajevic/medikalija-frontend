import ComponentCard from "../../components/common/ComponentCard";
import { useMedicines } from "../../features/medicine/hooks/useMedicines";
import { AddMedicineFormNew } from "../../features/medicine/ui/AddMedicineFormNew";
import { AddMedicineFromFamilyFormNew } from "../../features/medicine/ui/AddMedicineFromFamilyFormNew";
import MedicineTable from "../../features/medicine/ui/MedicineTable";


const MedicineListWidget = () => {
  const { data , isLoading } = useMedicines();

  if (isLoading) return <p>Učitavanje...</p>;

  return (
    <ComponentCard title="LEKOVI — MEDIKALIJA (DOM)">
      <div className="flex gap-2">
              <AddMedicineFormNew/>
              <AddMedicineFromFamilyFormNew/>

      </div>

      
      <MedicineTable medicines={data} />
    </ComponentCard>
  );
};

export default MedicineListWidget;