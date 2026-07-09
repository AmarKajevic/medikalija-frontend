
import { usePatient } from '../../features/patients/hooks/usePatient'
import { useParams } from 'react-router'

const PatientDetailPage = () => {
    const {id} = useParams()
    const{data, isLoading, error} = usePatient(id!)

   

    if(isLoading) return <div>Loading...</div>
    if(error) return <div>{error.message}</div>
  return (
    <div>
        {data?.name}
      
    </div>
  )
}

export default PatientDetailPage
