import { useVirtualizer } from '@tanstack/react-virtual';
import  { useRef } from 'react'
import ArticleRow from "@features/articles/ui/ArticleRow";

type Props = {
    articles: any[]
}

const ArticleTable = ({articles} : Props) => {
    const parentRef =useRef<HTMLDivElement | null>(null);

    const rowVirtualizer = useVirtualizer({
        count: articles.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 90,
        overscan: 10
    })
  return (
    <div className='overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800'>


    <div className='grid grid-cols-[2fr_1fr_1fr_1fr] border-b border-gray-200 bg-gray-50 p-3 text-xs font-medium uppercase text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400'>
         <div>Naziv</div>
        <div>Pakovanja</div>
        <div>Količina</div>
        <div>Cena</div>
    </div>

    <div ref={parentRef} className='relative h-[500px] overflow-auto'>
        <div style={{
            height: rowVirtualizer.getTotalSize(),
            position: "relative",
          }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const article = articles[virtualRow.index]

                 return (
              <div
                key={article._id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
           
            <ArticleRow data={article}/>


        </div>
        )
         })}
    </div>
    </div>
    </div>
  )
}

export default ArticleTable
