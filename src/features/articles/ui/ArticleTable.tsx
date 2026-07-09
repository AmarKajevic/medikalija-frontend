import { useVirtualizer } from '@tanstack/react-virtual';
import  { useRef } from 'react'
import ArticleRow from './ArticleRow';

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
    <div className='border rounded-md'>

    
    <div className='grid grid-cols-[2fr_1fr_1fr_1fr] p-3 font-semibold border-b bg-gray-200'>
         <div>Naziv</div>
        <div>Pakovanja</div>
        <div>Količina</div>
        <div>Cena</div>
    </div>

    <div ref={parentRef} className='h-[500px] overflow-auto relative'>
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
