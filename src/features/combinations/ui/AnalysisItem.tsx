import DeleteAnalysisButton from "../../analysis/ui/DeleteAnalysis";

export const AnalysisItem = ({ analysis }: any) => {
  return (
    <>
    <div className="grid grid-cols-3 text-lg text-gray-700 font-semibold pl-4 border-l">
      <span >{analysis.name}</span>
      <span className="font-medium">{analysis.price} RSD</span>
          <div className="flex justify-end"><DeleteAnalysisButton  id={analysis._id}/></div>
       
    </div>


    </>
    
    
  );
};