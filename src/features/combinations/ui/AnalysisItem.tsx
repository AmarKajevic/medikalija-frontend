import DeleteAnalysisButton from "@features/analysis/ui/DeleteAnalysis";

export const AnalysisItem = ({ analysis }: any) => {
  return (
    <div className="grid grid-cols-3 items-center border-l border-gray-200 pl-4 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">
      <span>{analysis.name}</span>
      <span className="font-medium text-gray-800 dark:text-white/90">{analysis.price} RSD</span>
      <div className="flex justify-end"><DeleteAnalysisButton id={analysis._id}/></div>
    </div>
  );
};