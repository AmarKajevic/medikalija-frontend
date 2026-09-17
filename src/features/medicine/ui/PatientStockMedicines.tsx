// features/medicine/ui/PatientStockMedicines.tsx
import { useEffect, useCallback, useMemo } from "react";

import { useGetPatientStockMedicines } from "@features/medicine/hooks/useGetPatientStockMedicines";
import { useModal } from "@shared/lib/useModal";

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
          <div className="mx-4 w-full max-w-lg animate-fadeInUp overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            {/* Zaglavlje */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                Porodični lekovi pacijenta
              </h2>
              <button
                onClick={closeModal}
                className="text-2xl leading-none text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Zatvori"
              >
                &times;
              </button>
            </div>

            {/* Telo */}
            <div className="max-h-[70vh] overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-500" />
                </div>
              ) : stockMedicines.length === 0 ? (
                <p className="py-8 text-center text-gray-500 dark:text-gray-400">
                  Pacijent nema porodičnih lekova.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {stockMedicines.map((med) => (
                    <li
                      key={med._id}
                      className="flex items-center justify-between py-3"
                    >
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {med.name}
                      </span>
                      <div className="text-right">
                        <span className="rounded-full bg-success-50 px-2.5 py-0.5 text-sm font-semibold text-success-600 dark:bg-success-500/15 dark:text-success-500">
                          {med.familyQuantity} kom.
                        </span>
                        {med.familyPackageCount !== undefined &&
                          med.unitsPerPackage && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
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
            <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <button
                onClick={closeModal}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
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