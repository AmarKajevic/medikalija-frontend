import { useId, useState } from "react";
import { LuBriefcaseMedical, LuPlus, LuSearch } from "react-icons/lu";
import { Input } from "@shared/ui/form/controls";
import Field from "@shared/ui/form/Field";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { notify } from "@shared/lib/notify";
import { formatRSD } from "@shared/lib/format";
import { matchesSearch } from "@shared/lib/search";
import { useChargeProfessionalService, useProfessionalServices } from "@features/professional-services/model";

// Stručne usluge iz cenovnika (pravi ga admin): pretraga, broj puta, dodavanje u specifikaciju.
export default function AddProfessionalServiceForm({ patientId, specificationId }: { patientId: string; specificationId?: string }) {
  const ids = { search: useId(), times: useId() };
  const { data: services = [], isLoading } = useProfessionalServices();
  const charge = useChargeProfessionalService(patientId);
  const [query, setQuery] = useState("");
  const [times, setTimes] = useState("1");
  const amount = Number(times.replace(",", "."));
  const validAmount = amount > 0 && amount <= 1000;
  const list = services.filter((s) => !query.trim() || matchesSearch(s.name, query.trim()));

  const add = (serviceId: string, name: string) => {
    if (!validAmount) return notify.error("Broj puta mora biti veći od nule.");
    charge.mutate(
      { serviceId, amount, specificationId },
      {
        onSuccess: () => notify.success(`${name}: dodato u specifikaciju.`),
        onError: (err) => notify.error(err),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }
  if (services.length === 0) {
    return <EmptyState compact icon={<LuBriefcaseMedical />} title="Nema stručnih usluga" description="Cenovnik stručnih usluga pravi admin u meniju Stručne usluge." />;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_96px] gap-2">
        <Field label="Usluga" htmlFor={ids.search}>
          <Input id={ids.search} leading={<LuSearch className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pretraži usluge..." />
        </Field>
        <Field label="Puta" htmlFor={ids.times} error={validAmount ? undefined : "> 0"}>
          <Input id={ids.times} inputMode="decimal" value={times} onChange={(e) => setTimes(e.target.value)} />
        </Field>
      </div>
      {list.length === 0 ? (
        <EmptyState compact title="Nema rezultata" />
      ) : (
        <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {list.map((s) => {
            const adding = charge.isPending && charge.variables?.serviceId === s._id;
            return (
              <li key={s._id} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">{s.name}</p>
                  <p className="mt-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">{formatRSD(s.priceRSD)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => add(s._id, s.name)}
                  disabled={charge.isPending}
                  aria-label={`Dodaj ${s.name}`}
                  className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-brand-50 px-2.5 text-xs font-medium text-brand-600 transition hover:bg-brand-100 disabled:opacity-50 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25"
                >
                  <LuPlus className="h-3.5 w-3.5" />
                  {adding ? "..." : "Dodaj"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
