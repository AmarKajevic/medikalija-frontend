
import { AddMedicineFormNew } from "../../features/medicine/ui/AddMedicineFormNew";
import { AddMedicineFromFamilyFormNew } from "../../features/medicine/ui/AddMedicineFromFamilyFormNew";


const AddMedicine = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AddMedicineFormNew/>
      <AddMedicineFromFamilyFormNew/>
    </div>
  );
};

export default AddMedicine;