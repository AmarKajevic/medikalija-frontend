import { useEffect, useState } from "react";
import { notify } from "@shared/lib/notify";
import { useExchangeRates } from "@entities/exchange-rate/model/ExchangeRateContext";
import { computeBilling } from "@features/specification/lib/billing";
import { useSaveBilling } from "@features/specification/hooks/useSaveBilling";
import { Specification } from "@features/specification/types/types";
import { formatDay } from "@shared/lib/calendarDay";

const toNumber = (v: string) => Number(v.replace(",", ".")) || 0;

// Stanje obračuna (dug, smeštaj, vanstandardni period smeštaja, kursevi). Živi iznad koraka čarobnjaka, pa se
// unete vrednosti i oznaka "nesačuvano" ne gube kad se dijalog smeštaja zatvori ili pređe na pregled.
export function useBillingState(spec: Specification, patientId: string) {
  const { rates, updateRates } = useExchangeRates();
  const save = useSaveBilling(spec._id, patientId);
  const [debt, setDebtRaw] = useState("");
  const [lodging, setLodgingRaw] = useState("");
  const [early, setEarlyRaw] = useState("");
  // Izabrana cena iz cenovnika smeštaja (naziv, npr. "30 dana"); "" = ručno unet iznos
  const [lodgingOption, setLodgingOptionRaw] = useState("");
  const [earlyOption, setEarlyOptionRaw] = useState("");
  // Napomena uz vanstandardni smeštaj (iz liste koju pravi admin)
  const [earlyNote, setEarlyNoteRaw] = useState("");
  const [lowerRate, setLowerRate] = useState("");
  const [middleRate, setMiddleRate] = useState("");
  // Dug i smeštaj su opcioni: isključeni se ne naplaćuju i ne štampaju
  const [includeDebt, setIncludeDebtRaw] = useState(false);
  const [includeLodging, setIncludeLodgingRaw] = useState(false);
  const [includeEarly, setIncludeEarlyRaw] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDebtRaw(spec.billing?.previousDebtEUR ? String(spec.billing.previousDebtEUR) : "");
    setLodgingRaw(spec.billing?.nextLodgingEUR ? String(spec.billing.nextLodgingEUR) : "");
    setIncludeDebtRaw(spec.billing?.includeDebt ?? (spec.billing?.previousDebtEUR ?? 0) > 0);
    setIncludeLodgingRaw(spec.billing?.includeLodging ?? (spec.billing?.nextLodgingEUR ?? 0) > 0);
    setEarlyRaw(spec.billing?.earlyLodgingEUR ? String(spec.billing.earlyLodgingEUR) : "");
    setIncludeEarlyRaw(spec.billing?.includeEarlyLodging ?? (spec.billing?.earlyLodgingEUR ?? 0) > 0);
    setLodgingOptionRaw(spec.billing?.nextLodgingOption ?? "");
    setEarlyOptionRaw(spec.billing?.earlyLodgingOption ?? "");
    setEarlyNoteRaw(spec.billing?.earlyLodgingNote ?? "");
    setDirty(false);
  }, [
    spec._id,
    spec.billing?.previousDebtEUR,
    spec.billing?.nextLodgingEUR,
    spec.billing?.earlyLodgingEUR,
    spec.billing?.includeDebt,
    spec.billing?.includeLodging,
    spec.billing?.includeEarlyLodging,
    spec.billing?.nextLodgingOption,
    spec.billing?.earlyLodgingOption,
    spec.billing?.earlyLodgingNote,
  ]);

  useEffect(() => {
    setLowerRate(rates.lower ? String(rates.lower) : "");
    setMiddleRate(rates.middle ? String(rates.middle) : "");
  }, [rates.lower, rates.middle]);

  // Vanstandardni smeštaj važi za datume vanstandardnog perioda koji je izabran pri otvaranju
  const earlyPeriodLabel = spec.nonStandard ? `${formatDay(spec.startDate)} — ${formatDay(spec.endDate)}` : "";

  const result = computeBilling({
    specTotalRSD: spec.totalPrice ?? 0,
    debtEUR: includeDebt ? toNumber(debt) : 0,
    lodgingEUR: includeLodging ? toNumber(lodging) : 0,
    earlyLodgingEUR: includeEarly ? toNumber(early) : 0,
    lowerRate: toNumber(lowerRate),
    middleRate: toNumber(middleRate),
  });

  const commitRates = async () => {
    const lower = toNumber(lowerRate);
    const middle = toNumber(middleRate);
    if (lower === rates.lower && middle === rates.middle) return;
    try {
      await updateRates(lower, middle);
      notify.success("Kursna lista je ažurirana.");
    } catch (err) {
      notify.error(err, "Kurs nije sačuvan.");
    }
  };

  /** Čuva dug i smeštaj. `exclude` odmah isključuje jednu stavku (uklanjanje iz liste). Vraća false ako čuvanje nije uspelo. */
  const saveBilling = async (exclude?: "debt" | "lodging" | "early"): Promise<boolean> => {
    if (exclude === "debt") setIncludeDebtRaw(false);
    if (exclude === "lodging") setIncludeLodgingRaw(false);
    if (exclude === "early") setIncludeEarlyRaw(false);
    try {
      await save.mutateAsync({
        previousDebtEUR: toNumber(debt),
        nextLodgingEUR: toNumber(lodging),
        earlyLodgingEUR: toNumber(early),
        includeDebt: includeDebt && exclude !== "debt",
        includeLodging: includeLodging && exclude !== "lodging",
        includeEarlyLodging: includeEarly && exclude !== "early",
        nextLodgingOption: lodgingOption,
        earlyLodgingOption: earlyOption,
        earlyLodgingNote: earlyNote,
      });
      setDirty(false);
      notify.success("Obračun je sačuvan.");
      return true;
    } catch (err) {
      notify.error(err);
      return false;
    }
  };

  return {
    fields: {
      debt,
      setDebt: (v: string) => {
        setDebtRaw(v);
        setDirty(true);
      },
      lodging,
      setLodging: (v: string) => {
        setLodgingRaw(v);
        setDirty(true);
      },
      early,
      setEarly: (v: string) => {
        setEarlyRaw(v);
        setDirty(true);
      },
      lodgingOption,
      earlyOption,
      /** Izbor cene iz cenovnika: iznos + naziv zajedno */
      chooseLodging: (option: string, amount: string) => {
        setLodgingOptionRaw(option);
        setLodgingRaw(amount);
        setDirty(true);
      },
      chooseEarly: (option: string, amount: string) => {
        setEarlyOptionRaw(option);
        setEarlyRaw(amount);
        setDirty(true);
      },
      earlyNote,
      setEarlyNote: (v: string) => {
        setEarlyNoteRaw(v);
        setDirty(true);
      },
      includeEarly,
      setIncludeEarly: (v: boolean) => {
        setIncludeEarlyRaw(v);
        setDirty(true);
      },
      lowerRate,
      setLowerRate,
      middleRate,
      setMiddleRate,
      includeDebt,
      setIncludeDebt: (v: boolean) => {
        setIncludeDebtRaw(v);
        setDirty(true);
      },
      includeLodging,
      setIncludeLodging: (v: boolean) => {
        setIncludeLodgingRaw(v);
        setDirty(true);
      },
    },
    rates,
    result: { ...result, includeDebt, includeLodging, includeEarlyLodging: includeEarly, lodgingOption, earlyLodgingOption: earlyOption, earlyLodgingNote: earlyNote, earlyPeriodLabel },
    commitRates,
    dirty,
    saving: save.isPending,
    saveBilling,
  };
}

export type BillingState = ReturnType<typeof useBillingState>;
