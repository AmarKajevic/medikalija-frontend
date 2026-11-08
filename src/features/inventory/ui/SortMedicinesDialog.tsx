import { useEffect, useMemo, useState } from "react";
import { LuSearch } from "react-icons/lu";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import { Input } from "@shared/ui/form/controls";
import Tabs from "@shared/ui/tabs/Tabs";
import { notify } from "@shared/lib/notify";
import { matchesSearch } from "@shared/lib/search";
import { MEDICINE_FORM_LABEL, type InventoryItem, type MedicineForm, useSetMedicineForm } from "@features/inventory/model";

const other = (f: MedicineForm): MedicineForm => (f === "oral" ? "parenteral" : "oral");

// Razvrstavanje postojećih lekova: označe se lekovi jedne vrste i prebace u drugu odjednom
// (svi stari lekovi su podrazumevano "tablete, kapsule", pa se ampule izdvajaju ovde).
export default function SortMedicinesDialog({ open, onClose, medicines }: { open: boolean; onClose: () => void; medicines: InventoryItem[] }) {
  const [from, setFrom] = useState<MedicineForm>("oral");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const save = useSetMedicineForm();

  useEffect(() => {
    if (!open) return;
    setFrom("oral");
    setQuery("");
    setSelected(new Set());
  }, [open]);

  const list = useMemo(
    () =>
      medicines
        .filter((m) => (m.form ?? "oral") === from)
        .filter((m) => !query.trim() || matchesSearch(m.name, query))
        .sort((a, b) => a.name.localeCompare(b.name, "sr")),
    [medicines, from, query]
  );
  const visibleIds = list.map((m) => m._id);
  const allVisible = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const target = other(from);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const move = () =>
    save.mutate(
      { ids: [...selected], form: target },
      {
        onSuccess: (res) => {
          notify.success(`${res.message} → ${MEDICINE_FORM_LABEL[target]}`);
          setSelected(new Set());
        },
        onError: (err) => notify.error(err),
      }
    );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Razvrstaj lekove"
      description="Označite lekove i prebacite ih u drugu vrstu. U specifikacijama se tablete i ampule vode kao posebne grupe."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Gotovo
          </Button>
          <Button size="sm" disabled={selected.size === 0} loading={save.isPending} onClick={move}>
            Prebaci izabrane ({selected.size}) u: {MEDICINE_FORM_LABEL[target]}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Tabs
          variant="pills"
          value={from}
          onChange={(f) => {
            setFrom(f);
            setSelected(new Set());
          }}
          items={[
            { value: "oral", label: MEDICINE_FORM_LABEL.oral, count: medicines.filter((m) => (m.form ?? "oral") === "oral").length },
            { value: "parenteral", label: MEDICINE_FORM_LABEL.parenteral, count: medicines.filter((m) => m.form === "parenteral").length },
          ]}
        />
        <Input leading={<LuSearch className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pretraži lekove..." aria-label="Pretraži lekove" />
        <label className="flex items-center gap-2 px-1 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={allVisible}
            onChange={() =>
              setSelected((s) => {
                const next = new Set(s);
                visibleIds.forEach((id) => (allVisible ? next.delete(id) : next.add(id)));
                return next;
              })
            }
            className="h-4 w-4 accent-brand-600"
          />
          {allVisible ? "Poništi izbor" : `Izaberi sve prikazane (${visibleIds.length})`}
        </label>
        <ul className="max-h-[45vh] divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          {list.length === 0 ? (
            <li className="p-4 text-center text-sm text-gray-500">Nema lekova u ovoj grupi{query ? ` za „${query}”` : ""}.</li>
          ) : (
            list.map((m) => (
              <li key={m._id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                  <input type="checkbox" checked={selected.has(m._id)} onChange={() => toggle(m._id)} className="h-4 w-4 accent-brand-600" />
                  <span className="flex-1 text-gray-800 dark:text-white/90">{m.name}</span>
                </label>
              </li>
            ))
          )}
        </ul>
      </div>
    </Dialog>
  );
}
