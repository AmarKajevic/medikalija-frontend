
import ComponentCard from '../../components/common/ComponentCard'
import { useGetArticles } from '../../features/articles/hooks/useGetArticles'
import ArticleTable from '../../features/articles/ui/ArticleTable'

const ArticleListWidget = () => {
    const {data, isLoading} = useGetArticles()

    if(isLoading) return <div>Ucitavanje...</div>
  return (
    <ComponentCard title="ARTIKLI — MEDIKALIJA (DOM)">
        <ArticleTable articles={data}/>

    </ComponentCard>
      
    
  )
}

export default ArticleListWidget
