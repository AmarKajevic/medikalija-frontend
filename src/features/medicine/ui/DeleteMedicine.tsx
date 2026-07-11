import { useState } from "react";
import { useDeleteMedicine } from "../hooks/useDeleteMedicine";
import ConfirmModal from "../../../shared/ui/ConfirmModal";

const DeleteMedicineButton = ({ id }: { id: string }) => {
  const { mutate, isPending } = useDeleteMedicine();
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    mutate(id, {
      onSuccess: () => setOpen(false),
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-white border-0 bg-red-900 rounded-md shadow-md px-3 py-1"
      >
        Obriši lek
      </button>

     <ConfirmModal
      open={open}
      onClose={() => setOpen(false)}
      onConfirm={handleDelete}
      redirectTo="/"
      loading={isPending}
      title="Brisanje leka"
      description="Ova akcija je nepovratna. Da li želiš da obrišeš lek?"
      confirmText="Obriši"
      cancelText="Otkaži"
      variant="danger"
    />
    </>
  );
};

export default DeleteMedicineButton;