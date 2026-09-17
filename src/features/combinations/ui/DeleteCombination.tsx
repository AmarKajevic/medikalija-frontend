import  { useState } from "react";
import { useDeleteCombination } from "@features/combinations/hooks/useDeleteCombination";
import ConfirmModal from "@shared/ui/ConfirmModal";

const DeleteCombination = ({ id }: { id: string }) => {
  const { mutate, isPending } = useDeleteCombination();
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
        className="rounded-md bg-error-50 px-3 py-1.5 text-sm font-medium text-error-600 transition hover:bg-error-100 dark:bg-error-500/15 dark:text-error-400 dark:hover:bg-error-500/25"
      >
        Obriši kombinaciju
      </button>
      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        loading={isPending}
        title="Brisanje kombinacije"
        description="Ova akcija je nepovratna. Da li želiš da obrišeš kombinaciju?"
        confirmText="Obriši"
        cancelText="Otkaži"
        variant="danger"
      />
    </>
  );
};

export default DeleteCombination;
