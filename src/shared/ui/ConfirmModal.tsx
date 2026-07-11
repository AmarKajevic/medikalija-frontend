import React from "react";
import { useNavigate } from "react-router";


type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;

  title?: string;
  description?: React.ReactNode;

  confirmText?: string;
  cancelText?: string;

  variant?: "danger" | "primary" | "warning";
  redirectTo?: string;
};

const variantStyles = {
  danger: "bg-red-600 hover:bg-red-700",
  primary: "bg-blue-600 hover:bg-blue-700",
  warning: "bg-yellow-500 hover:bg-yellow-600",
};

const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  title = "Potvrda",
  description = "Da li ste sigurni?",
  confirmText = "Potvrdi",
  cancelText = "Otkaži",
  variant = "danger",
  redirectTo
}: Props) => {
  if (!open) return null;

   const navigate = useNavigate();
  

   const handleConfirm = async () => {
    onConfirm();
    if (redirectTo) navigate(redirectTo);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[420px] shadow-xl overflow-hidden">

        <div className="px-5 py-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>


        <div className="px-5 py-4 text-sm text-gray-600">
          {description}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-md hover:bg-gray-100"
          >
            {cancelText}
          </button>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm text-white rounded-md transition ${
              variantStyles[variant]
            } disabled:opacity-50`}
          >
            {loading ? "U toku..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;