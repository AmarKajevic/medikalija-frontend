type Props = {
  data: any;
  onDelete: (itemId: string) => void;
};

export const SpecificationTable = ({ data, onDelete }: Props) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-white/[0.03] dark:text-gray-400 print:hidden">
            <th className="p-3 font-medium">Opis</th>
            <th className="p-3 text-right font-medium">Količina</th>
            <th className="p-3 text-right font-medium">Cena (RSD)</th>
            <th className="p-3 text-center font-medium">Izbriši</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.items.length === 0 && (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-500 dark:text-gray-400">
                Nema stavki u ovom periodu.
              </td>
            </tr>
          )}
          {data.items.map((item: any) => (
            <tr key={item._id} className="text-gray-700 dark:text-gray-300">
              <td className="p-3">
                {item.analyses && item.analyses.length > 0 ? (
                  item.analyses.map((a: any) => <p key={a._id}>{a.name}</p>)
                ) : (
                  item.name
                )}
              </td>
              <td className="p-3 text-right">{Number(item.amount).toFixed(2)}</td>
              <td className="p-3 text-right">{item.price.toFixed(2)}</td>
              <td className="p-3 text-center print:hidden">
                <button
                  onClick={() => onDelete(item._id)}
                  className="rounded-md bg-error-50 px-3 py-1 text-xs font-medium text-error-600 hover:bg-error-100 dark:bg-error-500/15 dark:text-error-400 dark:hover:bg-error-500/25"
                >
                  Obriši
                </button>
              </td>
            </tr>
          ))}

          <tr className="bg-gray-50 font-semibold text-gray-800 dark:bg-white/[0.03] dark:text-white/90">
            <td className="p-3"></td>
            <td className="p-3 text-right">Ukupno:</td>
            <td className="p-3 text-right">{data.totalPrice?.toFixed(2)} RSD</td>
            <td className="p-3"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};