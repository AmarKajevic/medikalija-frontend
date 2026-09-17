import { useGetCombinations } from "@features/combinations/hooks/useGetCombinations";
import AddCombinationForm from "@features/combinations/ui/AddCombinationForm";
import { CombinationList } from "@features/combinations/ui/CombinationsList";


export const CombinationsWidget = () => {
  const { data, isLoading, error } = useGetCombinations();

  if (isLoading) return <p className="p-6 text-sm text-gray-500 dark:text-gray-400">Učitavanje...</p>;
  if (error) return <p className="p-6 text-sm text-error-500">Greška pri učitavanju</p>;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">Kombinacije analiza</h1>
      <AddCombinationForm />
      <CombinationList groups={data || []} />
    </div>
  );
};