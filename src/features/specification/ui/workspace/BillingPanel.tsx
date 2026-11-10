import { useId, useState } from "react";
import { Link } from "react-router";
import { Input, Select } from "@shared/ui/form/controls";
import Field from "@shared/ui/form/Field";
import DateInput from "@shared/ui/form/DateInput";
import Button from "@shared/ui/button/Button";
import { formatEUR, formatRSD } from "@shared/lib/format";
import type { BillingState } from "@features/specification/hooks/useBillingState";
import { useLodgingNotes, useLodgingPrices, type LodgingPrice } from "@features/lodging/model";
import { useAuth } from "@app/providers/AuthContext";
import { paths } from "@app/paths";

interface Props {
  billing: BillingState;
  nextPeriodLabel: string;
  /** Zatvorena specifikacija: obračun se samo prikazuje */
  readOnly?: boolean;
  /** Posle uspešnog čuvanja (npr. zatvara dijalog) */
  onSaved?: () => void;
}

const MANUAL = "__manual";

/** Izbor cene iz cenovnika smeštaja (uz "Drugi iznos" za ručni unos) */
interface PriceChoice {
  prices: LodgingPrice[];
  option: string;
  onChoose: (option: string, amount: string) => void;
}

// Iznos u evrima koji se uključuje prekidačem (kad je isključen, ne ide u obračun ni na štampu).
// Sa `choice` se iznos bira iz cenovnika smeštaja.
function OptionalAmount({
  id,
  title,
  hint,
  enabled,
  onToggle,
  value,
  onChange,
  choice,
}: {
  id: string;
  title: string;
  hint: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  value: string;
  onChange: (v: string) => void;
  choice?: PriceChoice;
}) {
  // Sačuvan izbor čija cena je u međuvremenu obrisana/promenjena ostaje vidljiv kao opcija
  const known = choice?.prices.some((p) => p.name === choice.option);
  const [manualMode, setManualMode] = useState(false);
  const selected = !choice ? "" : choice.option ? choice.option : manualMode || value ? MANUAL : "";
  const manual = !choice || selected === MANUAL;
  return (
    <div className={`rounded-xl border p-4 transition ${enabled ? "border-brand-300 bg-brand-50/40 dark:border-brand-500/40 dark:bg-brand-500/5" : "border-gray-200 dark:border-gray-800"}`}>
      <label className="flex cursor-pointer items-start justify-between gap-3">
        <span>
          <span className="block text-sm font-medium text-gray-900 dark:text-white">{title}</span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">{enabled ? hint : "Ne naplaćuje se i ne štampa se."}</span>
        </span>
        <span className="relative mt-0.5 inline-flex shrink-0">
          <input type="checkbox" role="switch" checked={enabled} onChange={(e) => onToggle(e.target.checked)} aria-label={`Naplati: ${title}`} className="peer sr-only" />
          <span className="h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-brand-500 peer-focus-visible:ring-3 peer-focus-visible:ring-brand-500/30 dark:bg-gray-700" />
          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
        </span>
      </label>
      {enabled && choice && (
        <div className="mt-3">
          <label htmlFor={`${id}-price`} className="sr-only">
            {title}: cena
          </label>
          <Select
            id={`${id}-price`}
            value={selected}
            onChange={(e) => {
              const v = e.target.value;
              setManualMode(v === MANUAL);
              if (v === MANUAL || v === "") return choice.onChoose("", v === MANUAL ? value : "");
              const price = choice.prices.find((p) => p.name === v);
              if (price) choice.onChoose(price.name, String(price.priceEUR));
            }}
          >
            <option value="">Izaberite cenu…</option>
            {choice.prices.map((p) => (
              <option key={p._id} value={p.name}>
                {p.name} · {formatEUR(p.priceEUR)}
              </option>
            ))}
            {choice.option && !known && (
              <option value={choice.option}>
                {choice.option} · {value} € (sačuvano)
              </option>
            )}
            <option value={MANUAL}>Drugi iznos (ručno)…</option>
          </Select>
        </div>
      )}
      {enabled && manual && (
        <div className="mt-3">
          <label htmlFor={id} className="sr-only">
            {title} (EUR)
          </label>
          <Input id={id} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0,00" trailing="EUR" autoFocus={!value} />
        </div>
      )}
    </div>
  );
}

export default function BillingPanel({ billing, nextPeriodLabel, readOnly = false, onSaved }: Props) {
  const ids = { debt: useId(), lodging: useId(), early: useId(), note: useId(), earlyStart: useId(), earlyEnd: useId() };
  const { fields, result, dirty, saving, saveBilling } = billing;
  const { user } = useAuth();
  const { data: prices = [] } = useLodgingPrices();
  const { data: notes = [] } = useLodgingNotes();
  // Sačuvana napomena koja je u međuvremenu obrisana iz liste ostaje vidljiva kao opcija
  const noteKnown = notes.some((n) => n.text === fields.earlyNote);
  const earlyInvalid = !!fields.earlyStart && !!fields.earlyEnd && fields.earlyEnd < fields.earlyStart;

  const rows: Array<[string, string, string, string]> = [
    ["Lekovi, artikli, analize i troškovi", "stavke iz liste", formatRSD(result.specTotalRSD), formatEUR(result.specEUR)],
    ...(fields.includeDebt ? [["Dug iz prethodnog perioda", "uneto gore", formatRSD(result.debtRSD), formatEUR(result.debtEUR)] as [string, string, string, string]] : []),
    ...(fields.includeLodging ? [[`Smeštaj za naredni period${fields.lodgingOption ? ` · ${fields.lodgingOption}` : ""}`, nextPeriodLabel, formatRSD(result.lodgingRSD), formatEUR(result.lodgingEUR)] as [string, string, string, string]] : []),
    ...(fields.includeEarly ? [[`Vanstandardni period smeštaja${fields.earlyOption ? ` · ${fields.earlyOption}` : ""}`, [result.earlyPeriodLabel, fields.earlyNote].filter(Boolean).join(" · ") || "uneto gore", formatRSD(result.earlyLodgingRSD), formatEUR(result.earlyLodgingEUR)] as [string, string, string, string]] : []),
  ];

  return (
    <fieldset disabled={readOnly} className="min-w-0 space-y-6">
      {prices.length === 0 && (
        <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-white/[0.03] dark:text-gray-400">
          Cenovnik smeštaja je prazan, pa se iznos smeštaja unosi ručno.{" "}
          {user?.role === "admin" ? (
            <Link to={paths.lodgingPrices} className="font-medium text-brand-600 hover:underline dark:text-brand-400">
              Dodajte cene smeštaja
            </Link>
          ) : (
            "Cene unosi admin u „Cene smeštaja”."
          )}
        </p>
      )}

      {/* Dug, smeštaj i vanstandardni period smeštaja su opcioni: isključeno se ne naplaćuje i ne štampa */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <OptionalAmount
          id={ids.debt}
          title="Dug iz prethodnog perioda"
          hint="Iznos koji porodica nije platila do sada."
          enabled={fields.includeDebt}
          onToggle={fields.setIncludeDebt}
          value={fields.debt}
          onChange={fields.setDebt}
        />
        <OptionalAmount
          id={ids.lodging}
          title="Smeštaj za naredni period"
          hint={`Plaća se unapred, za period ${nextPeriodLabel}`}
          enabled={fields.includeLodging}
          onToggle={fields.setIncludeLodging}
          value={fields.lodging}
          onChange={fields.setLodging}
          choice={prices.length || fields.lodgingOption ? { prices, option: fields.lodgingOption, onChoose: fields.chooseLodging } : undefined}
        />
        <OptionalAmount
          id={ids.early}
          title="Vanstandardni period smeštaja"
          hint="Smeštaj van redovnog perioda (npr. dani pre početka)."
          enabled={fields.includeEarly}
          onToggle={fields.setIncludeEarly}
          value={fields.early}
          onChange={fields.setEarly}
          choice={prices.length || fields.earlyOption ? { prices, option: fields.earlyOption, onChoose: fields.chooseEarly } : undefined}
        />
      </div>

      {fields.includeEarly && (
        <div className="grid max-w-xl gap-4 sm:grid-cols-2">
          <Field label="Vanstandardni period od" htmlFor={ids.earlyStart}>
            <DateInput id={ids.earlyStart} value={fields.earlyStart} onChange={fields.setEarlyStart} fromYear={2000} />
          </Field>
          <Field label="Vanstandardni period do" htmlFor={ids.earlyEnd} error={earlyInvalid ? "Kraj je pre početka." : undefined}>
            <DateInput id={ids.earlyEnd} value={fields.earlyEnd} onChange={fields.setEarlyEnd} min={fields.earlyStart || undefined} invalid={earlyInvalid} fromYear={2000} />
          </Field>
        </div>
      )}

      {fields.includeEarly && (
        <div className="max-w-xl">
          <label htmlFor={ids.note} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Napomena uz vanstandardni smeštaj
          </label>
          <Select id={ids.note} value={fields.earlyNote} onChange={(e) => fields.setEarlyNote(e.target.value)}>
            <option value="">Bez napomene</option>
            {notes.map((n) => (
              <option key={n._id} value={n.text}>
                {n.text}
              </option>
            ))}
            {fields.earlyNote && !noteKnown && <option value={fields.earlyNote}>{fields.earlyNote} (sačuvano)</option>}
          </Select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Štampa se u istom redu sa smeštajem.
            {notes.length === 0 && (user?.role === "admin" ? " Napomene dodajete u „Cene smeštaja”." : " Napomene dodaje admin u „Cene smeštaja”.")}
          </p>
        </div>
      )}

      <div className="relative overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Šta se plaća</th>
              <th className="px-4 py-2 text-right font-medium">RSD</th>
              <th className="px-4 py-2 text-right font-medium">EUR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 tabular-nums dark:divide-gray-800">
            {rows.map(([label, note, r, e]) => (
              <tr key={label} className="text-gray-700 dark:text-gray-300">
                <td className="px-4 py-2.5">
                  {label}
                  <span className="block text-xs text-gray-400">{note}</span>
                </td>
                <td className="px-4 py-2.5 text-right">{r}</td>
                <td className="px-4 py-2.5 text-right">{e}</td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-semibold text-gray-900 dark:bg-white/[0.03] dark:text-white">
              <td className="px-4 py-3">Ukupno za uplatu</td>
              <td className="px-4 py-3 text-right">{formatRSD(result.totalRSD)}</td>
              <td className="px-4 py-3 text-right">{formatEUR(result.totalEUR)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {dirty && <span className="text-xs text-warning-600 dark:text-warning-400">Imate nesačuvane izmene</span>}
        {!readOnly && (
          <Button onClick={() => void saveBilling().then((ok) => ok && onSaved?.())} loading={saving} size="sm" variant={dirty ? "primary" : "outline"}>
            Sačuvaj obračun
          </Button>
        )}
      </div>
    </fieldset>
  );
}
