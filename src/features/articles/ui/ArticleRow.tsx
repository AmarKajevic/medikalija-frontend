import { useNavigate } from "react-router"

type Props = {
    data: any
}

const ArticleRow = ({data}: Props) => {
    const navigate = useNavigate();
  return (
   <div
      className="grid cursor-pointer grid-cols-[2fr_1fr_1fr_1fr] items-center border-b border-gray-100 px-3 py-4 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
      onClick={() => navigate(`/articles/${data._id}`)}
    >
      <div className="font-medium text-gray-800 dark:text-white/90">
        {data.name}
      </div>

      <div>{data.packageCount ?? 0}</div>
      <div>{data.quantity}</div>
      <div>{data.price ? `${data.price} RSD` : "-"}</div>

    </div>
  )
}

export default ArticleRow
