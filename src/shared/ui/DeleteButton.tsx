import { useState } from "react";
import ConfirmModal from "@shared/ui/ConfirmModal";

type Props = {
  onConfirm: () => void;
  isLoading?: boolean;

  title?: string;
  description?: React.ReactNode;

  confirmText?: string;
  cancelText?: string;
};

const DeleteButton = ({
  onConfirm,
  isLoading,
  title = "Brisanje",
  description = "Ova akcija je nepovratna. Da li želiš da nastaviš?",
  confirmText = "Obriši",
  cancelText = "Otkaži",
}: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={isLoading}
        className="rounded-md bg-error-50 px-3 py-1.5 text-xs font-medium text-error-600 hover:bg-error-100 disabled:opacity-50 dark:bg-error-500/15 dark:text-error-400 dark:hover:bg-error-500/25"
      >
        Obriši
      </button>

      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          onConfirm();
          setOpen(false);
        }}
        loading={isLoading}
        title={title}
        description={description}
        confirmText={confirmText}
        cancelText={cancelText}
        variant="danger"
      />
      </>

  );
};

export default DeleteButton;