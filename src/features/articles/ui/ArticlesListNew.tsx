import ArticleListWidget from "@widgets/article-list/ArticleListWidget";
import { AddArticleFormNew } from "@features/articles/ui/AddArticleFormNew";
import { AddArticleFromFamilyFormNew } from "@features/articles/ui/AddArticleFromFamilyFormNew";

const ArticlesListNew = () => {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
        Artikli
      </h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AddArticleFormNew />
        <AddArticleFromFamilyFormNew />
      </div>

      <ArticleListWidget />
    </div>
  );
};

export default ArticlesListNew;
