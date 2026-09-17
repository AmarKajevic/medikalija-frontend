import { useGetMedicine } from "@features/medicine/hooks/useGetMedicine"
import {useParams } from 'react-router-dom'
import UpdateMedicine from "@pages/Medicine/UpdateMedicine"
import InfoRow from "@shared/ui/InfoRow"
import DeleteMedicineButton from "@features/medicine/ui/DeleteMedicine"


const MedicineDetailesPage = () => {
    const {id} = useParams()

    const {data, isLoading, error} = useGetMedicine(id!)
    const medicine = data?.medicine;
    console.log("Medicine details", medicine)

    if (isLoading) return <p className="p-6 text-sm text-gray-500 dark:text-gray-400">Učitavanje...</p>;
    if (error) return <p className="p-6 text-sm text-error-500">{error.message}</p>;
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              {medicine?.name}
            </h1>
            <DeleteMedicineButton id={id!} />
          </div>
          <div>
            <InfoRow label="Količina" value={medicine?.quantity} />
            <InfoRow label="Cena po jedinici" value={medicine?.pricePerUnit} />
            <InfoRow label="Pakovanja" value={medicine?.packageCount} />
          </div>
        </div>

        <UpdateMedicine medicineId={id!} />
      </div>
    </div>
  )
}

export default MedicineDetailesPage
