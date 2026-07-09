import  { useState } from "react";
import { useDeleteCombination } from "../hooks/useDeleteCombination";
import ConfirmModal from "../../../shared/ui/ConfirmModal";

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
        className="text-white border-0 bg-red-900 rounded-md shadow-md px-3 py-1"
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
