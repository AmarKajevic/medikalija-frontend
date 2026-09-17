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
  danger: "bg-error-500 hover:bg-error-600",
  primary: "bg-brand-500 hover:bg-brand-600",
  warning: "bg-warning-500 hover:bg-warning-600",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[420px] overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h2>
        </div>

        <div className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{description}</div>

        <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            {cancelText}
          </button>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`rounded-md px-4 py-2 text-sm text-white transition ${
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