import { useGetMedicine } from '../../features/medicine/hooks/useGetMedicine'
import { useParams } from 'react-router-dom'
import UpdateMedicine from './UpdateMedicine'
import InfoRow from '../../shared/ui/InfoRow'


const MedicineDetailesPage = () => {
    const {id} = useParams()
    const {data, isLoading, error} = useGetMedicine(id!)
    const medicine = data?.medicine;
    console.log("Medicine details", medicine)

    if(isLoading) return <div>Loading...</div>
    if(error) return <div>{error.message}</div>
  return (
    <div className='flex justify-between shadow-md rounded-md'>
        <div className='w-full '>
          <h1 className='text-2xl font-bold underline mt-2 p-2'>{medicine?.name}</h1>
           <InfoRow label='Količina' value={medicine?.quantity} />
           <InfoRow label='Cena po jedinici' value={medicine?.pricePerUnit} />
           <InfoRow label='Pakovanja' value={medicine?.packageCount} />
        </div>


      <div className='w-full'>
          <UpdateMedicine medicineId={id!}/>
      </div>
    </div>
  )
}

export default MedicineDetailesPage
