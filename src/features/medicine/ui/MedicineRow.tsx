import { useNavigate } from "react-router";

import { useDeleteMedicine } from "../hooks/useDeleteMedicine";

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

      className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] p-5 items-center px-3 border-b cursor-pointer hover:bg-gray-50"
      onClick={() => navigate(`/medicine/${data._id}`)}
    >
      <div
        className="cursor-pointer font-medium "
        
      >
        {data.name}
      </div>

      <div>{data.packageCount ?? 0}</div>
      <div>{data.quantity}</div>
      <div>{data.pricePerUnit ? `${data.pricePerUnit} RSD` : "-"}</div>
      <div onClick={(e) => e.stopPropagation()}>
        <button disabled={isPending} onClick={() => handleDelete()} className="text-white border-0 bg-red-900 rounded-md shadow-md px-3 py-1">
          Izbrisi Lek
        </button>
      </div>

    </div>
  );
};

export default MedicineRow;