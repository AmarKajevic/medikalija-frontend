import { useId, useState } from "react";
import { LuLock, LuMessageSquarePlus } from "react-icons/lu";
import { Card, CardBody, CardHeader } from "@shared/ui/card/Card";
import Button from "@shared/ui/button/Button";
import Field from "@shared/ui/form/Field";
import { Textarea } from "@shared/ui/form/controls";
import { notify } from "@shared/lib/notify";
import { MedicalReport, useAddAddendum } from "@features/medical-reports/model";

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const person = (p?: { name: string; lastName: string }) => (p ? `${p.name} ${p.lastName}` : "");

const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</h3>
    <div className="whitespace-pre-line text-sm leading-relaxed text-gray-800 dark:text-gray-200">{children}</div>
  </section>
);

// Potpisan (ili tuđi) izveštaj: samo za čitanje, ispravke kao dopune.
export default function ReportView({ report, canAddendum }: { report: MedicalReport; canAddendum: boolean }) {
  const id = useId();
  const add = useAddAddendum();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const v = report.vitals ?? ({} as MedicalReport["vitals"]);
  const vitals: Array<[string, string]> = (
    [
      ["Pritisak", v.bloodPressure ? `${v.bloodPressure} mmHg` : ""],
      ["Puls", v.pulse != null ? `${v.pulse}/min` : ""],
      ["Temperatura", v.temperature != null ? `${String(v.temperature).replace(".", ",")} °C` : ""],
      ["Saturacija", v.spo2 != null ? `${v.spo2} %` : ""],
      ["Šećer", v.glucose != null ? `${String(v.glucose).replace(".", ",")} mmol/L` : ""],
      ["Težina", v.weight != null ? `${String(v.weight).replace(".", ",")} kg` : ""],
    ] as Array<[string, string]>
  ).filter(([, val]) => val);

  const submit = () => {
    if (!text.trim()) return notify.error("Unesite tekst dopune.");
    add.mutate(
      { id: report._id, text: text.trim() },
      {
        onSuccess: () => {
          notify.success("Dopuna je dodata.");
          setText("");
          setOpen(false);
        },
        onError: (err) => notify.error(err),
      }
    );
  };

  return (
    <div className="space-y-6">
      {report.status === "signed" && (
        <p className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2.5 text-sm text-gray-600 dark:bg-white/[0.03] dark:text-gray-400">
          <LuLock className="h-4 w-4 shrink-0" />
          Potpisao/la dr {person(report.author)} {report.signedAt ? dateTime(report.signedAt) : ""}. Izveštaj je zaključan; ispravke se dodaju kao dopuna.
        </p>
      )}
      <Card>
        <CardBody className="space-y-5">
          {vitals.length > 0 && (
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {vitals.map(([label, val]) => (
                <div key={label} className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
                  <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
                  <dd className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{val}</dd>
                </div>
              ))}
            </dl>
          )}
          {report.anamnesis && <Block title="Anamneza">{report.anamnesis}</Block>}
          {report.findings && <Block title="Objektivni nalaz">{report.findings}</Block>}
          {report.diagnoses.length > 0 && (
            <Block title="Dijagnoze">
              <ul className="space-y-1">
                {report.diagnoses.map((d) => (
                  <li key={`${d.code}-${d.name}`}>
                    {d.code && <span className="mr-2 font-semibold tabular-nums">{d.code}</span>}
                    {d.name}
                  </li>
                ))}
              </ul>
            </Block>
          )}
          {report.therapy && <Block title="Terapija">{report.therapy}</Block>}
          {report.conclusion && <Block title="Zaključak i preporuke">{report.conclusion}</Block>}
          {report.followUp?.date && (
            <Block title="Kontrola">
              {new Date(report.followUp.date).toLocaleDateString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric" })}
              {report.followUp.note && ` — ${report.followUp.note}`}
            </Block>
          )}
        </CardBody>
      </Card>

      {(report.addenda.length > 0 || canAddendum) && (
        <Card>
          <CardHeader
            title="Dopune"
            description="Naknadne ispravke i dodaci, sa autorom i vremenom."
            actions={
              canAddendum &&
              !open && (
                <Button size="xs" variant="outline" startIcon={<LuMessageSquarePlus className="h-3.5 w-3.5" />} onClick={() => setOpen(true)}>
                  Dodaj dopunu
                </Button>
              )
            }
          />
          <CardBody className="space-y-4">
            {report.addenda.length === 0 && !open && <p className="text-sm text-gray-500">Nema dopuna.</p>}
            {report.addenda.map((a) => (
              <div key={a._id} className="border-l-2 border-brand-300 pl-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {dateTime(a.createdAt)} · dr {person(a.author)}
                </p>
                <p className="mt-0.5 whitespace-pre-line text-sm text-gray-800 dark:text-gray-200">{a.text}</p>
              </div>
            ))}
            {open && (
              <div className="space-y-2">
                <Field label="Tekst dopune" htmlFor={id}>
                  <Textarea id={id} rows={3} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
                </Field>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
                    Otkaži
                  </Button>
                  <Button size="sm" loading={add.isPending} onClick={submit}>
                    Sačuvaj dopunu
                  </Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
