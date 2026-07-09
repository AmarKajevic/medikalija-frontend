
import { useDeletePatient } from '../hooks/useDeletePatient'

type Props = {
    id:string;
}

const DeletePatient = ({id} :Props) => {
    const{mutate, isPending} = useDeletePatient()

    const handleDelete = () => {
        mutate(id)
    }

    
  return (
     <button
      onClick={handleDelete}
      disabled={isPending}
      className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded disabled:opacity-50"
    >
      {isPending ? "Brisanje..." : "❌ Obriši"}
    </button>
  )
}

export default DeletePatient
