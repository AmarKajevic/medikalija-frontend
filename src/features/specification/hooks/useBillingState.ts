import { useEffect, useState } from "react";
import { notify } from "@shared/lib/notify";
import { useExchangeRates } from "@entities/exchange-rate/model/ExchangeRateContext";
import { computeBilling } from "@features/specification/lib/billing";
import { useSaveBilling } from "@features/specification/hooks/useSaveBilling";
import { Specification } from "@features/specification/types/types";

const toNumber = (v: string) => Number(v.replace(",", ".")) || 0;

// Stanje obračuna (dug, smeštaj, kursevi). Živi iznad koraka čarobnjaka, pa se
// unete vrednosti i oznaka "nesačuvano" ne gube pri prelasku sa koraka na korak.
export function useBillingState(spec: Specification, patientId: string) {
  const { rates, updateRates } = useExchangeRates();
  const save = useSaveBilling(spec._id, patientId);
  const [debt, setDebtRaw] = useState("");
  const [lodging, setLodgingRaw] = useState("");
  const [lowerRate, setLowerRate] = useState("");
  const [middleRate, setMiddleRate] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDebtRaw(spec.billing?.previousDebtEUR ? String(spec.billing.previousDebtEUR) : "");
    setLodgingRaw(spec.billing?.nextLodgingEUR ? String(spec.billing.nextLodgingEUR) : "");
    setDirty(false);
  }, [spec._id, spec.billing?.previousDebtEUR, spec.billing?.nextLodgingEUR]);

  useEffect(() => {
    setLowerRate(rates.lower ? String(rates.lower) : "");
    setMiddleRate(rates.middle ? String(rates.middle) : "");
  }, [rates.lower, rates.middle]);

  const result = computeBilling({
    specTotalRSD: spec.totalPrice ?? 0,
    debtEUR: toNumber(debt),
    lodgingEUR: toNumber(lodging),
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

  /** Čuva dug i smeštaj. Vraća false ako čuvanje nije uspelo. */
  const saveBilling = async (): Promise<boolean> => {
    try {
      await save.mutateAsync({ previousDebtEUR: result.debtEUR, nextLodgingEUR: result.lodgingEUR });
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
      lowerRate,
      setLowerRate,
      middleRate,
      setMiddleRate,
    },
    rates,
    result,
    commitRates,
    dirty,
    saving: save.isPending,
    saveBilling,
  };
}

export type BillingState = ReturnType<typeof useBillingState>;
