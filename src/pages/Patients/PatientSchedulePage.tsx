import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LuDownload, LuFileText, LuPrinter } from "react-icons/lu";
import { api } from "@shared/api/api";
import { paths } from "@app/paths";
import usePatient from "@entities/patient/hooks/usePatient";
import PageHeader from "@shared/ui/page/PageHeader";
import { Card, CardHeader } from "@shared/ui/card/Card";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { calendarYear, formatDay } from "@shared/lib/calendarDay";
import { notify } from "@shared/lib/notify";
import { useFacility } from "@entities/facility/facility";

type Period = { index: number; startDate: string; endDate: string; isPast: boolean; isCurrent: boolean };

const groupByYear = (periods: Period[]) =>
  periods.reduce<Record<number, Period[]>>((acc, p) => {
    (acc[calendarYear(p.startDate)] ??= []).push(p);
    return acc;
  }, {});

// docx (~340 KB) se učitava tek na klik "Izvezi", ne sa stranicom
async function exportWord(name: string, grouped: Record<number, Period[]>) {
  const [{ Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType }, { saveAs }] = await Promise.all([import("docx"), import("file-saver")]);
  const cell = (text: string, bold = false) =>
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold })] })] });

  const doc = new Document({
    sections: Object.entries(grouped).map(([year, periods]) => ({
      children: [
        new Paragraph({ children: [new TextRun({ text: `${name} — ${year}. godina`, bold: true, size: 28 })], spacing: { after: 240 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [cell("#", true), cell("Početak", true), cell("Kraj", true)] }),
            ...periods.map((p) => new TableRow({ children: [cell(String(p.index)), cell(formatDay(p.startDate)), cell(formatDay(p.endDate))] })),
          ],
        }),
      ],
    })),
  });
  saveAs(await Packer.toBlob(doc), `raspored-perioda-${name.replace(/\s+/g, "-")}.docx`);
}

export default function PatientSchedulePage() {
  const { patientId = "" } = useParams<{ patientId: string }>();
  const { data: patient } = usePatient(patientId);
  const { data: periods = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["future-specs", patientId],
    queryFn: async (): Promise<Period[]> => (await api.get(`/api/specification/${patientId}/future-spec-periods`)).data.periods,
    enabled: !!patientId,
  });

  const name = patient ? `${patient.name} ${patient.lastName}` : "Pacijent";
  const grouped = groupByYear(periods);
  const { facility } = useFacility();
  const [busy, setBusy] = useState<string | null>(null);

  // Jedna godina: štampa ili PDF (pdfmake se učitava tek na klik)
  const yearPdf = async (year: string, list: Period[], mode: "download" | "print") => {
    setBusy(`${year}-${mode}`);
    try {
      const { generateSchedulePDF } = await import("@features/patients/lib/schedulePdf");
      await generateSchedulePDF({ patientName: name, year, periods: list, facility, mode });
    } catch (e) {
      notify.error(e, "PDF nije napravljen.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Raspored obračunskih perioda"
        description="Periodi od 30 kalendarskih dana od dana prijema, za narednih 20 godina (prestupne godine su uračunate). Svaka godina se štampa ili preuzima kao PDF posebno."
        breadcrumbs={[{ label: "Pacijenti", to: paths.patients }, { label: name, to: paths.patient(patientId) }, { label: "Raspored" }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            startIcon={<LuDownload className="h-4 w-4" />}
            disabled={periods.length === 0}
            onClick={() => exportWord(name, grouped).catch((e) => notify.error(e, "Dokument nije napravljen."))}
          >
            Sve godine (Word)
          </Button>
        }
      />

      {isError ? (
        <ErrorState message="Raspored nije učitan." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-96" />)}
        </div>
      ) : (
        <div className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(grouped).map(([year, list]) => (
            <Card key={year}>
              <CardHeader
                title={`${year}.`}
                description={`${list.length} perioda`}
                actions={
                  <div className="flex gap-1">
                    <Button
                      size="xs"
                      variant="outline"
                      startIcon={<LuPrinter className="h-3.5 w-3.5" />}
                      loading={busy === `${year}-print`}
                      onClick={() => void yearPdf(year, list, "print")}
                      aria-label={`Štampaj ${year}.`}
                    >
                      Štampaj
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      startIcon={<LuFileText className="h-3.5 w-3.5" />}
                      loading={busy === `${year}-download`}
                      onClick={() => void yearPdf(year, list, "download")}
                      aria-label={`PDF ${year}.`}
                    >
                      PDF
                    </Button>
                  </div>
                }
              />
              <ol className="divide-y divide-gray-100 dark:divide-gray-800">
                {list.map((p) => (
                  <li
                    key={p.index}
                    className={`flex items-center gap-3 px-5 py-2.5 text-sm ${
                      p.isCurrent ? "bg-brand-50 dark:bg-brand-500/10" : p.isPast ? "text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span className="w-8 shrink-0 text-xs tabular-nums text-gray-400">#{p.index}</span>
                    <span className="flex-1 tabular-nums">
                      {formatDay(p.startDate)} – {formatDay(p.endDate)}
                    </span>
                    {p.isCurrent && <Badge size="sm" color="primary">Tekući</Badge>}
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
