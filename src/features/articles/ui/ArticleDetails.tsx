

import { useParams } from 'react-router'
import { useGetArticle } from '../hooks/useGetArticle'

const ArticleDetails = () => {
    const {id} = useParams()
    const {data, isLoading, error} = useGetArticle(id!)

    console.log("Data", data)

    if(isLoading) return <div>Loading...</div>
    if(error) return <div>{error.message}</div>

    

    const article = data?.article;

  return (
    <div>
      <h1>{article?.name}</h1>
      
    </div>
  )
}

export default ArticleDetails
