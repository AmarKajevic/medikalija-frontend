
import ComponentCard from "@shared/ui/common/ComponentCard"
import { useGetArticles } from "@features/articles/hooks/useGetArticles"
import ArticleTable from "@features/articles/ui/ArticleTable"

const ArticleListWidget = () => {
    const {data, isLoading} = useGetArticles()

    if(isLoading) return <p className="py-4 text-sm text-gray-500 dark:text-gray-400">Učitavanje...</p>
  return (
    <ComponentCard title="ARTIKLI — MEDIKALIJA (DOM)">
        <ArticleTable articles={data}/>

    </ComponentCard>
      
    
  )
}

export default ArticleListWidget
