import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import MedicineRow from "@features/medicine/ui/MedicineRow";

type Props = {
  medicines: any[];
};

const MedicineTable = ({ medicines }: Props) => {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: medicines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 90,
    overscan: 10,
  });

  if (medicines.length === 0) {
    return (
      <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Nema lekova u zalihama.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] border-b border-gray-200 bg-gray-50 p-3 text-xs font-medium uppercase text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
        <div>Naziv</div>
        <div>Pakovanja</div>
        <div>Količina</div>
        <div>Cena</div>
        <div>Akcija</div>
      </div>

      <div
        ref={parentRef}
        className="relative h-[500px] overflow-auto"
      >
        <div
          style={{
            height: rowVirtualizer.getTotalSize(),
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const medicine = medicines[virtualRow.index];

            return (
              <div
                key={medicine._id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <MedicineRow data={medicine} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MedicineTable;