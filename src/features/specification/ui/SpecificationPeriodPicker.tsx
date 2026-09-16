import { useState } from "react";
import { useActivateSpecificationPeriod } from "@features/specification/hooks/useActivateSpecificationPeriod";
import { useActivateExistingSpecification } from "@features/specification/hooks/useActivateExistingSpecification";
import { useSpecificationHistory } from "@features/specification/hooks/useSpecificationHistory";
import { Specification } from "@features/specification/types/types";

const toDateInputValue = (d: Date) => d.toISOString().slice(0, 10);

interface SpecificationPeriodPickerProps {
  patientId: string;
  activeSpecification: Specification;
}

export function SpecificationPeriodPicker({
  patientId,
  activeSpecification,
}: SpecificationPeriodPickerProps) {
  const { mutate: activatePeriod, isPending: isActivatingPeriod } =
    useActivateSpecificationPeriod(patientId);
  const { mutate: activateExisting, isPending: isActivatingExisting } =
    useActivateExistingSpecification(patientId);
  const { data: history } = useSpecificationHistory(patientId);

  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [showManualPicker, setShowManualPicker] = useState(false);
  const [showHistoryPicker, setShowHistoryPicker] = useState(false);

  const isPending = isActivatingPeriod || isActivatingExisting;

  const handleActivateNextPeriod = () => {
    const currentEnd = new Date(activeSpecification.endDate);
    const nextStart = new Date(currentEnd);
    nextStart.setDate(nextStart.getDate() + 1);
    const nextEnd = new Date(nextStart);
    nextEnd.setDate(nextEnd.getDate() + 29);
    activatePeriod({
      startDate: toDateInputValue(nextStart),
      endDate: toDateInputValue(nextEnd),
    });
  };

  const handleActivateManual = () => {
    if (!manualStart || !manualEnd) return;
    activatePeriod({ startDate: manualStart, endDate: manualEnd });
    setShowManualPicker(false);
    setManualStart("");
    setManualEnd("");
  };

  const pastPeriods = (history?.history ?? []) as Specification[];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 mb-4 dark:border-gray-800 dark:bg-white/[0.03] print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Trenutno aktivan period:{" "}
          <strong className="text-gray-800 dark:text-white/90">
            {new Date(activeSpecification.startDate).toLocaleDateString("sr-RS")} —{" "}
            {new Date(activeSpecification.endDate).toLocaleDateString("sr-RS")}
          </strong>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleActivateNextPeriod}
            disabled={isPending}
            className="px-3 py-1.5 text-sm bg-brand-500 text-white rounded hover:bg-brand-600 disabled:opacity-50"
          >
            Sledeći period
          </button>
          <button
            onClick={() => setShowManualPicker((v) => !v)}
            className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
          >
            Ručno biranje perioda
          </button>
          {pastPeriods.length > 0 && (
            <button
              onClick={() => setShowHistoryPicker((v) => !v)}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
            >
              Vrati se na raniji period
            </button>
          )}
        </div>
      </div>

      {showManualPicker && (
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <div>
            <label className="block text-xs text-gray-500 mb-1 dark:text-gray-400">Od</label>
            <input
              type="date"
              value={manualStart}
              onChange={(e) => setManualStart(e.target.value)}
              className="border p-1.5 rounded text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 dark:text-gray-400">Do</label>
            <input
              type="date"
              value={manualEnd}
              onChange={(e) => setManualEnd(e.target.value)}
              className="border p-1.5 rounded text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <button
            onClick={handleActivateManual}
            disabled={isPending || !manualStart || !manualEnd}
            className="px-3 py-1.5 text-sm bg-success-500 text-white rounded hover:bg-success-600 disabled:opacity-50"
          >
            Aktiviraj period
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Koristi ovo ako period nije napravljen na vreme (poslednjih 30 dana) — nove stavke
            (lekovi, artikli, kombinacije) će od sada ići u ovaj period.
          </span>
        </div>
      )}

      {showHistoryPicker && (
        <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
          <ul className="space-y-1">
            {pastPeriods.map((s) => (
              <li key={s._id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  {new Date(s.startDate).toLocaleDateString("sr-RS")} —{" "}
                  {new Date(s.endDate).toLocaleDateString("sr-RS")} ({(s.totalPrice ?? 0).toFixed(2)} RSD)
                </span>
                <button
                  onClick={() => activateExisting(s._id)}
                  disabled={isPending}
                  className="text-brand-500 hover:underline disabled:opacity-50"
                >
                  Aktiviraj
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
