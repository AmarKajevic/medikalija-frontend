import { useState } from "react";
import { useDeleteAnalysis } from "@features/analysis/hooks/useDeleteAnalysis";
import ConfirmModal from "@shared/ui/ConfirmModal";


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
        className="rounded-md bg-error-50 px-3 py-1.5 text-sm font-medium text-error-600 transition hover:bg-error-100 dark:bg-error-500/15 dark:text-error-400 dark:hover:bg-error-500/25"
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