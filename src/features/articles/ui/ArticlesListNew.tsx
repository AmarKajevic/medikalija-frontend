
import { useGetArticles } from '../hooks/useGetArticles'
import { useNavigate } from 'react-router-dom';

import ArticleListWidget from '../../../widgets/article-list/ArticleListWidget';
import { AddArticleFormNew } from './AddArticleFormNew';
import { AddArticleFromFamilyFormNew } from './AddArticleFromFamilyFormNew';



const ArticlesListNew = () => {
    const {data, isLoading, error} = useGetArticles()
    const navigate = useNavigate();


    if(isLoading) return <div>Loading...</div>  
    if(error) return <div>{error.message}</div>

    const articles = data?.articles || []
    console.log("Articles", data)
  return (
    <>
    <div className='flex gap-4 p-2'>
      <AddArticleFormNew/>
      <AddArticleFromFamilyFormNew/>

     

    <div>
       
      
      
      {
        articles.map((a :any) => (
          <div key={a._id} className='border-2 border-gray-300 rounded-lg p-4 mb-4'>
            <h3 className='text-xl font-bold mb-2' onClick={() => navigate(`/articles/${a._id}`)}>
              {a.name}
            </h3>
          </div>
        ))
      }
      
    </div>
    </div>
    <ArticleListWidget/>
    </>
  )
}

export default ArticlesListNew
