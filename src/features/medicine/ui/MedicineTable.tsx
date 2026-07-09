import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import MedicineRow from "./MedicineRow";

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

  return (
    <div className="border rounded-md">
      

      <div className="grid grid-cols-[2fr_1fr_1fr_1fr] p-3 font-semibold border-b bg-gray-100">
        <div>Naziv</div>
        <div>Pakovanja</div>
        <div>Količina</div>
        <div>Cena</div>

      </div>


      <div
        ref={parentRef}
        className="h-[500px] overflow-auto relative"
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