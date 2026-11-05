import { useState } from "react";
import { LuDownload, LuLock, LuPrinter } from "react-icons/lu";
import Tabs from "@shared/ui/tabs/Tabs";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import { notify } from "@shared/lib/notify";
import { formatDay } from "@shared/lib/calendarDay";
import { getNextPeriodLabel } from "@features/specification/lib/helpers";
import { Specification } from "@features/specification/types/types";
import ConsumeItemForm from "./forms/ConsumeItemForm";
import AddCombinationForm from "./forms/AddCombinationForm";
import AddExtraCostForm from "./forms/AddExtraCostForm";
import SpecificationItems from "./SpecificationItems";
import BillingPanel from "./BillingPanel";
import { itemDisplayName } from "@features/specification/lib/items";
import { useBillingState } from "@features/specification/hooks/useBillingState";
import PeriodSwitcher from "./PeriodSwitcher";

type AddTab = "medicine" | "article" | "combination" | "extra";

// Bez ikonica: u uskoj koloni bi skratile nazive ("Arti…")
const ADD_TABS = [
  { value: "medicine" as const, label: "Lek" },
  { value: "article" as const, label: "Artikal" },
  { value: "combination" as const, label: "Analize" },
  { value: "extra" as const, label: "Trošak" },
];

interface Props {
  specification: Specification;
  patientId: string;
  patientName: string;
}

const Card = ({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) => (
  <section className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
    <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90">{title}</h3>
      {actions}
    </header>
    <div className="p-5">{children}</div>
  </section>
);

export default function SpecificationWorkspace({ specification: spec, patientId, patientName }: Props) {
  const [tab, setTab] = useState<AddTab>("medicine");
  const billing = useBillingState(spec);
  const nextPeriodLabel = getNextPeriodLabel(spec.endDate);
  const canAdd = !!spec.isActive;

  // pdfmake sa fontovima je ~1 MB — učitava se tek kad korisnik zatraži PDF
  const exportPdf = async (mode: "download" | "print") => {
    const { generateSpecificationPDF } = await import("@features/specification/lib/generateSpecificationPDF");
    return generateSpecificationPDF({
      mode,
      patientName,
      startDate: spec.startDate,
      endDate: spec.endDate,
      items: spec.items.map((item) => ({
        formattedName: itemDisplayName(item),
        amount: item.amount ?? 1,
        price: item.price ?? 0,
      })),
      ...billing.result,
      nextPeriodLabel,
    });
  };

  const runExport = (mode: "download" | "print") => exportPdf(mode).catch((err) => notify.error(err, "PDF nije napravljen."));

  return (
    <div className="space-y-5">
      {/* Traka sa periodom i akcijama */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {canAdd ? (
            <PeriodSwitcher patientId={patientId} activeSpecification={spec} />
          ) : (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {formatDay(spec.startDate)} – {formatDay(spec.endDate)}
            </span>
          )}
          {canAdd ? (
            <Badge size="sm" color="success">Aktivan period</Badge>
          ) : (
            <Badge size="sm" color="light">Zatvoren period</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" startIcon={<LuPrinter className="h-4 w-4" />} onClick={() => runExport("print")}>
            Štampaj
          </Button>
          <Button variant="outline" size="sm" startIcon={<LuDownload className="h-4 w-4" />} onClick={() => runExport("download")}>
            PDF
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(320px,380px)_1fr]">
        {/* Levo: dodavanje stavki */}
        <div className="lg:sticky lg:top-0">
          <Card title="Dodaj u specifikaciju">
            {canAdd ? (
              <div className="space-y-5">
                <Tabs variant="pills" items={ADD_TABS} value={tab} onChange={setTab} />
                {tab === "medicine" && <ConsumeItemForm key="medicine" kind="medicine" patientId={patientId} />}
                {tab === "article" && <ConsumeItemForm key="article" kind="article" patientId={patientId} />}
                {tab === "combination" && <AddCombinationForm patientId={patientId} />}
                {tab === "extra" && <AddExtraCostForm specId={spec._id} patientId={patientId} />}
              </div>
            ) : (
              <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                <LuLock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <p>
                  Ovo je zatvoren period. Nove stavke se dodaju u aktivan period sa profila pacijenta. Ovde možete
                  da uklonite stavku, izmenite obračun ili preuzmete PDF.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Desno: stavke i obračun */}
        <div className="min-w-0 space-y-5">
          <Card title={`Stavke (${spec.items.length})`}>
            <SpecificationItems specification={spec} patientId={patientId} />
          </Card>
          <Card title="Obračun za uplatu">
            <BillingPanel specification={spec} patientId={patientId} billing={billing} nextPeriodLabel={nextPeriodLabel} />
          </Card>
        </div>
      </div>
    </div>
  );
}
