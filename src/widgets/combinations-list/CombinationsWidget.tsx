import { useGetCombinations } from "../../features/combinations/hooks/useGetCombinations";
import AddCombinationForm from "../../features/combinations/ui/AddCombinationForm";
import { CombinationList } from "../../features/combinations/ui/CombinationsList";


export const CombinationsWidget = () => {
  const { data, isLoading, error } = useGetCombinations();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Greška pri učitavanju</div>;

  return (
    <div className="space-y-6">
      <AddCombinationForm />
      <CombinationList groups={data || []} />
    </div>
  );
};