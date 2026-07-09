import { useState } from "react";
import { useDeleteAnalysis } from "../hooks/useDeleteAnalysis";
import ConfirmModal from "../../../shared/ui/ConfirmModal";


const DeleteAnalysisButton = ({ id }: { id: string }) => {
  const { mutate, isPending } = useDeleteAnalysis();
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
        Obriši analizu
      </button>

     <ConfirmModal
      open={open}
      onClose={() => setOpen(false)}
      onConfirm={handleDelete}
      loading={isPending}
      title="Brisanje analize"
      description="Ova akcija je nepovratna. Da li želiš da obrišeš analizu?"
      confirmText="Obriši"
      cancelText="Otkaži"
      variant="danger"
    />
    </>
  );
};

export default DeleteAnalysisButton;