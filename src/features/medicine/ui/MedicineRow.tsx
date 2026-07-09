import { useNavigate } from "react-router";

type Props = {

  data: any;
};

const MedicineRow = ({ data }: Props) => {
  const navigate = useNavigate();

  return (
    <div

      className="grid grid-cols-[2fr_1fr_1fr_1fr] p-5 items-center px-3 border-b cursor-pointer hover:bg-gray-50"
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

    </div>
  );
};

export default MedicineRow;