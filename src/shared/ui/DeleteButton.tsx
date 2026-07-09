import { useState } from "react";
import ConfirmModal from "./ConfirmModal";

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
        className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded disabled:opacity-50"
      >
        ❌ Obriši
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