// features/medicine/ui/PatientStockMedicines.tsx
import { useEffect, useCallback, useMemo } from "react";

import { useGetPatientStockMedicines } from "../hooks/useGetPatientStockMedicines";
import { useModal } from "../../../hooks/useModal";

// Tip za jedan lek iz stock-a (prilagodi stvarnom odgovoru API-ja)
interface PatientMedicineStock {
  _id: string;
  name: string;
  familyQuantity: number;
  familyPackageCount?: number;
  unitsPerPackage?: number;
}

interface PatientStockMedicinesProps {
  patientId: string;
  buttonText?: string;
  buttonClassName?: string;
}

export const PatientStockMedicines = ({
  patientId,
  buttonText = "Pregled porodičnih lekova",
  buttonClassName = "bg-zinc-900 text-white border-0 rounded-md px-4 py-2 hover:bg-zinc-700 transition-colors",
}: PatientStockMedicinesProps) => {
  const { isOpen, openModal, closeModal } = useModal(false);
  const { data: rawData, isLoading } = useGetPatientStockMedicines(patientId);

  // Normalizacija podataka – ako hook vraća { data: [...] } ili direktno niz
  const stockMedicines = useMemo((): PatientMedicineStock[] => {
    if (Array.isArray(rawData)) return rawData;
    if (rawData?.data && Array.isArray(rawData.data)) return rawData.data;
    return [];
  }, [rawData]);

  // Zatvaranje na Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, closeModal]);

  // Zatvaranje klikom na pozadinu (backdrop)
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) closeModal();
    },
    [closeModal]
  );

  return (
    <>
      <button onClick={openModal} className={buttonClassName}>
        {buttonText}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-fadeInUp">
            {/* Zaglavlje */}
            <div className="flex justify-between items-center border-b px-6 py-4 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800">
                Porodični lekovi pacijenta
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
                aria-label="Zatvori"
              >
                &times;
              </button>
            </div>

            {/* Telo */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : stockMedicines.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Pacijent nema porodičnih lekova.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {stockMedicines.map((med) => (
                    <li
                      key={med._id}
                      className="py-3 flex justify-between items-center"
                    >
                      <span className="font-medium text-gray-800">
                        {med.name}
                      </span>
                      <div className="text-right">
                        <span className="bg-green-100 text-green-800 text-sm font-semibold px-2.5 py-0.5 rounded-full">
                          {med.familyQuantity} kom.
                        </span>
                        {med.familyPackageCount !== undefined &&
                          med.unitsPerPackage && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({med.familyPackageCount} pak.)
                            </span>
                          )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-4 bg-gray-50 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};