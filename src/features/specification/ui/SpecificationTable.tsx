type Props = {
  data: any;
  onDelete: (itemId: string) => void;
};

export const SpecificationTable = ({ data, onDelete }: Props) => {

 
  console.log(data);
  return (
    <table className="w-full border-collapse border border-gray-300">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-2 text-left">Opis</th>
          <th className="border p-2 text-right">Količina</th>
          <th className="border p-2 text-right">Cena (RSD)</th>
          <th className="border p-2 text-center">izbrisi</th>
        </tr>
      </thead>

      <tbody>
        {data.items.map((item: any) => (
          <tr key={item._id}>
            <td className="border p-2">
              {item.analyses && item.analyses.length > 0 ? (
                item.analyses.map((a: any) => (
                  <p key={a._id}>{a.name}</p>
                ))
              ) : (
                item.name
              )}
            </td>
            <td className="border p-2 text-right">
              {Number(item.amount).toFixed(2)} 
            </td>
            <td className="border p-2 text-right">
              {item.price.toFixed(2)}
            </td>
            <td className="border p-2 text-center">
              <button
                onClick={() => onDelete(item._id)}
                className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded"
              >
                ❌ Obriši
              </button>
            </td>
          </tr>
        ))}

        <tr className="font-semibold bg-gray-50">
          <td></td>
          <td className="border p-2 text-right">Ukupno:</td>
          <td className="border p-2 text-right">
            {data.totalPrice?.toFixed(2)} RSD
          </td>
          <td></td>
        </tr>
      </tbody>
    </table>
  );
};