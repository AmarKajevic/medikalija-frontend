import { useParams } from 'react-router'
import { useGetArticle } from "@features/articles/hooks/useGetArticle"
import InfoRow from "@shared/ui/InfoRow"

const ArticleDetails = () => {
    const {id} = useParams()
    const {data, isLoading, error} = useGetArticle(id!)

    if(isLoading) return <p className="p-6 text-sm text-gray-500 dark:text-gray-400">Učitavanje...</p>
    if(error) return <p className="p-6 text-sm text-error-500">{(error as Error).message}</p>

    const article = data?.article;

  return (
    <div className="p-6">
      <div className="max-w-xl rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
          {article?.name}
        </h1>
        <div>
          <InfoRow label="Cena po jedinici" value={article?.price} />
          <InfoRow label="Količina (dom)" value={article?.quantity} />
          <InfoRow label="Količina (porodica)" value={article?.familyQuantity} />
          <InfoRow label="Komada po pakovanju" value={article?.unitsPerPackage} />
          <InfoRow label="Pakovanja (dom)" value={article?.packageCount} />
          <InfoRow label="Pakovanja (porodica)" value={article?.familyPackageCount} />
        </div>
      </div>
    </div>
  )
}

export default ArticleDetails
