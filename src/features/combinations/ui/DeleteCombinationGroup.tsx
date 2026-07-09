import  { useState } from 'react'
import { useDeleteCombinationGroup } from '../hooks/useDeleteCombinationGroup'
import ConfirmModal from '../../../shared/ui/ConfirmModal'

const DeleteCombinationGroup = ({id} : {id: string}) => {

    const {mutate, isPending} = useDeleteCombinationGroup()
    const [open, setOpen] = useState(false)


    const handleDelete = () => {
        mutate(id, {
            onSuccess:() => setOpen(false)
        })
    }
  return (
    <>
    <button
        onClick={() => setOpen(true)}
        className="text-white border-0 bg-red-900 rounded-md shadow-md px-3 py-1"
      >
        Obriši grupu
      </button>
      <ConfirmModal
      open={open}
      onClose={() => setOpen(false)}
      onConfirm={handleDelete}
      loading={isPending}
      title="Brisanje grupe"
      description="Ova akcija je nepovratna. Da li želiš da obrišeš grupu?"
      confirmText="Obriši"
      cancelText="Otkaži"
      variant="danger"
    />
      
    </>
  )
}

export default DeleteCombinationGroup
