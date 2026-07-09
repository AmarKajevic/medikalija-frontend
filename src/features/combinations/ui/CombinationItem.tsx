import { AnalysisItem } from "./AnalysisItem";
import DeleteCombination from "./DeleteCombination";


export const CombinationItem = ({ combination }: any) => {
  return (
    <div className="p-3 border rounded-xl bg-gray-50">
      <div className="font-medium">{combination.name}</div>

      <div className="mt-2 space-y-1">
        {combination.analyses.map((analysis: any) => (
          <AnalysisItem key={analysis._id} analysis={analysis} />
        ))}
        <DeleteCombination id={combination._id}/>
      </div>
    </div>
  );
};