
import { CombinationItem } from "@features/combinations/ui/CombinationItem";
import DeleteCombinationGroup from "@features/combinations/ui/DeleteCombinationGroup";
import { useState } from "react";


export const CombinationGroup = ({ group }: any) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          {group.name}
        </button>
        <DeleteCombinationGroup id={group._id}/>
      </div>

      {open && (
        <div className="mt-4 space-y-3">
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