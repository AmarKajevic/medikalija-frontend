
import { useParams } from 'react-router'
import { useGetAnalysis } from '../hooks/useGetAnalysis'
import UpdateAnalysisForm from './UpdateAnalysis'

const AnalysisDetailPage = () => {
    const {analysisId} = useParams()

    const{data, isLoading, error} = useGetAnalysis(analysisId!)
    if(isLoading) return <div>Loading...</div>
    if(error) return <div>{error.message}</div>

    const analysis = data?.analysis;
  return (
    <div>
        <div>
            <UpdateAnalysisForm analysis={analysis} />
        </div>
      {analysis.name}
      {analysis.price}
    </div>
  )
}

export default AnalysisDetailPage
