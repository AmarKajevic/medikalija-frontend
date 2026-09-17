import { useParams } from 'react-router'
import { useGetAnalysis } from "@features/analysis/hooks/useGetAnalysis"
import UpdateAnalysisForm from "@features/analysis/ui/UpdateAnalysis"

const AnalysisDetailPage = () => {
    const {analysisId} = useParams()

    const{data, isLoading, error} = useGetAnalysis(analysisId!)
    if(isLoading) return <p className="p-6 text-sm text-gray-500 dark:text-gray-400">Učitavanje...</p>
    if(error) return <p className="p-6 text-sm text-error-500">{(error as Error).message}</p>

    const analysis = data?.analysis;
  return (
    <div className="p-6">
      <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
          {analysis.name}
        </h1>
        <UpdateAnalysisForm analysis={analysis} />
      </div>
    </div>
  )
}

export default AnalysisDetailPage
