
import { CombinationItem } from "./CombinationItem";
import DeleteCombinationGroup from "./DeleteCombinationGroup";
import { useState } from "react";


export const CombinationGroup = ({ group }: any) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="p-4 border rounded-2xl shadow-sm  bg-white">
      <div className="flex gap-3">
      <button onClick={() => setOpen(true)} className="text-xl text-white border-b bg-zinc-800 hover:bg-zinc-900 hover:text-red-700 p-2 rounded-lg ">{group.name}</button>
      <button onClick={() => setOpen(false)} className="text-xl text-white border-b bg-red-700 hover:bg-red-900 rounded-lg p-2 " >
zatvori
</button>
</div>
        <div className="flex justify-end mb-5">
          <DeleteCombinationGroup id={group._id}/>
        </div>
{open && (
   <div className="space-y-3">
        {group.combinations.map((combination: any) => (
          <CombinationItem
            key={combination._id}
            combination={combination}
          />
        ))}
      
      </div>

)}

     
    </div>
  );
};