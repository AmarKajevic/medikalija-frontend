import { useNavigate } from "react-router";

import { useDeleteMedicine } from "@features/medicine/hooks/useDeleteMedicine";

type Props = {

  data: any;
};

const MedicineRow = ({ data }: Props) => {
  const navigate = useNavigate();
  const {mutate, isPending} = useDeleteMedicine()

  const handleDelete = () => {
    mutate(data._id)
  }

  return (
    <div
      className="grid cursor-pointer grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center border-b border-gray-100 px-3 py-4 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
      onClick={() => navigate(`/medicine/${data._id}`)}
    >
      <div className="font-medium text-gray-800 dark:text-white/90">{data.name}</div>

      <div>{data.packageCount ?? 0}</div>
      <div>{data.quantity}</div>
      <div>{data.pricePerUnit ? `${data.pricePerUnit} RSD` : "-"}</div>
      <div onClick={(e) => e.stopPropagation()}>
        <button
          disabled={isPending}
          onClick={() => handleDelete()}
          className="rounded-md bg-error-50 px-3 py-1.5 text-xs font-medium text-error-600 hover:bg-error-100 disabled:opacity-50 dark:bg-error-500/15 dark:text-error-400 dark:hover:bg-error-500/25"
        >
          Obriši
        </button>
      </div>
    </div>
  );
};

export default MedicineRow;