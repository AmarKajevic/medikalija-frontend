import useArticles from "../../hooks/Patient/useArticle"

interface DeleteArticleProps {
  articleId: string;
}

export default function DeleteArticle({articleId}: DeleteArticleProps) {
    const {deleteArticle} = useArticles()

    const handleDelete = () => {
    if (window.confirm("Da li ste sigurni da želite da obrišete ovaj artikal?")) {
      deleteArticle.mutate(articleId);
    }
  };

  return (
      <button
      onClick={handleDelete}
      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
    >
      Obriši
    </button>
  )
}