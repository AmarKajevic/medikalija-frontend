import { useState } from "react";
import { useDeleteMedicine } from "@features/medicine/hooks/useDeleteMedicine";
import ConfirmModal from "@shared/ui/ConfirmModal";

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
        className="rounded-md bg-error-50 px-3 py-1.5 text-sm font-medium text-error-600 hover:bg-error-100 dark:bg-error-500/15 dark:text-error-400 dark:hover:bg-error-500/25"
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