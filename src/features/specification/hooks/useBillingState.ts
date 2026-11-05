import { useEffect, useState } from "react";
import { notify } from "@shared/lib/notify";
import { useExchangeRates } from "@entities/exchange-rate/model/ExchangeRateContext";
import { computeBilling } from "@features/specification/lib/billing";
import { Specification } from "@features/specification/types/types";

const toNumber = (v: string) => Number(v.replace(",", ".")) || 0;

// Stanje obračuna (dug, smeštaj, kursevi) — izdvojeno da bi ga koristio i PDF.
export function useBillingState(spec: Specification) {
  const { rates, updateRates } = useExchangeRates();
  const [debt, setDebt] = useState("");
  const [lodging, setLodging] = useState("");
  const [lowerRate, setLowerRate] = useState("");
  const [middleRate, setMiddleRate] = useState("");

  useEffect(() => {
    setDebt(spec.billing?.previousDebtEUR ? String(spec.billing.previousDebtEUR) : "");
    setLodging(spec.billing?.nextLodgingEUR ? String(spec.billing.nextLodgingEUR) : "");
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

  return {
    fields: { debt, setDebt, lodging, setLodging, lowerRate, setLowerRate, middleRate, setMiddleRate },
    result,
    commitRates,
  };
}
