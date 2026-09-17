import { AnalysisItem } from "@features/combinations/ui/AnalysisItem";
import DeleteCombination from "@features/combinations/ui/DeleteCombination";


export const CombinationItem = ({ combination }: any) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="font-medium text-gray-800 dark:text-white/90">{combination.name}</div>

      <div className="mt-2 space-y-1">
        {combination.analyses.map((analysis: any) => (
          <AnalysisItem key={analysis._id} analysis={analysis} />
        ))}
        <DeleteCombination id={combination._id}/>
      </div>
    </div>
  );
};