import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { LuCalendarPlus, LuCheck, LuCopy, LuDownload, LuPenLine, LuPrinter, LuTrash2 } from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import { paths } from "@app/paths";
import { Breadcrumbs } from "@shared/ui/page/PageHeader";
import { Card, CardBody, CardHeader } from "@shared/ui/card/Card";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import Field from "@shared/ui/form/Field";
import { Input, Select, Textarea } from "@shared/ui/form/controls";
import DateInput from "@shared/ui/form/DateInput";
import TimeInput from "@shared/ui/form/TimeInput";
import SearchSelect, { SearchOption } from "@shared/ui/combobox/SearchSelect";
import Avatar from "@shared/ui/avatar/Avatar";
import { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import { PageLoader } from "@shared/ui/feedback/Spinner";
import EmptyState, { ErrorState } from "@shared/ui/feedback/EmptyState";
import { notify } from "@shared/lib/notify";
import { useFacility } from "@entities/facility/facility";
import { usePatients } from "@features/patients/hooks/usePatients";
import { combine, dateKey, newDraft, timeKey, type Draft } from "@features/calendar/model";
import EventDialog from "@features/calendar/ui/EventDialog";
import {
  emptyInput,
  inputFrom,
  MedicalReport,
  REPORT_TYPES,
  ReportInput,
  ReportType,
  reportTypeLabel,
  useDeleteReport,
  useReport,
  useReports,
  useSaveReport,
  useSignReport,
} from "@features/medical-reports/model";
import DiagnosisPicker from "@features/medical-reports/ui/DiagnosisPicker";
import ReportView from "@features/medical-reports/ui/ReportView";

const AUTOSAVE_MS = 1500;

const VITALS: Array<{ key: keyof ReportInput["vitals"]; label: string; unit: string; placeholder: string }> = [
  { key: "bloodPressure", label: "Pritisak", unit: "mmHg", placeholder: "130/85" },
  { key: "pulse", label: "Puls", unit: "/min", placeholder: "72" },
  { key: "temperature", label: "Temperatura", unit: "°C", placeholder: "36,6" },
  { key: "spo2", label: "Saturacija", unit: "%", placeholder: "97" },
  { key: "glucose", label: "Šećer", unit: "mmol/L", placeholder: "5,6" },
  { key: "weight", label: "Težina", unit: "kg", placeholder: "70" },
];

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export default function ReportPage() {
  const { reportId = "new" } = useParams<{ reportId: string }>();
  const isNew = reportId === "new";
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { facility } = useFacility();
  const ids = { patient: useId(), type: useId(), date: useId(), time: useId(), anam: useId(), find: useId(), ther: useId(), concl: useId(), fdate: useId(), fnote: useId() };

  const existing = useReport(isNew ? "" : reportId);
  const save = useSaveReport();
  const sign = useSignReport();
  const remove = useDeleteReport();
  const { data: patientsData } = usePatients();

  const [input, setInput] = useState<ReportInput | null>(null);
  const [state, setState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [confirm, setConfirm] = useState<"sign" | "delete" | null>(null);
  const [schedule, setSchedule] = useState<Draft | null>(null);
  const loadedFor = useRef<string | null>(null);
  const saving = useRef(false);
  // Broj izmena: ako se kuca dok čuvanje traje, stanje ostaje "nesačuvano"
  const version = useRef(0);

  // Nov izveštaj: pacijent i termin iz adrese (sa profila ili iz kalendara)
  useEffect(() => {
    if (!isNew || input) return;
    const at = params.get("at");
    const base = emptyInput(params.get("patient") ?? "", at ?? new Date().toISOString());
    const eventId = params.get("eventId");
    if (eventId) base.appointment = { eventId, occurrenceStart: params.get("occurrence") };
    if (params.get("type")) base.type = params.get("type") as ReportType;
    setInput(base);
  }, [isNew, input, params]);

  // Postojeći izveštaj: forma se puni jednom (ne preko izmena koje se upravo kucaju)
  useEffect(() => {
    if (isNew || !existing.data || loadedFor.current === reportId) return;
    loadedFor.current = reportId;
    setInput(inputFrom(existing.data));
    setState("saved");
    setSavedAt(new Date(existing.data.updatedAt));
  }, [isNew, existing.data, reportId]);

  const report: MedicalReport | undefined = isNew ? undefined : existing.data;
  const mine = isNew || (report && String(report.author._id) === String(user?._id));
  const editable = user?.role === "doctor" && mine && (!report || report.status === "draft");
  const canSave = !!input?.patientId && !!input?.visitDate;

  const persist = useCallback(async (): Promise<MedicalReport | null> => {
    if (!input || !canSave || saving.current) return null;
    saving.current = true;
    const startedAt = version.current;
    setState("saving");
    try {
      const saved = await save.mutateAsync({ id: isNew ? undefined : reportId, input });
      setSavedAt(new Date());
      setState(version.current === startedAt ? "saved" : "dirty");
      if (isNew) {
        loadedFor.current = saved._id;
        navigate(paths.report(saved._id), { replace: true });
      }
      return saved;
    } catch (err) {
      setState("error");
      notify.error(err, "Izveštaj nije sačuvan.");
      return null;
    } finally {
      saving.current = false;
    }
  }, [input, canSave, isNew, reportId, save, navigate]);

  // Automatsko čuvanje nacrta
  useEffect(() => {
    if (state !== "dirty" || !editable || !canSave) return;
    const t = setTimeout(() => void persist(), AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [state, editable, canSave, persist, input]);

  // Upozorenje pri zatvaranju sa nesačuvanim izmenama
  useEffect(() => {
    if (state !== "dirty" && state !== "saving") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [state]);

  const set = (patch: Partial<ReportInput>) => {
    setInput((cur) => (cur ? { ...cur, ...patch } : cur));
    version.current += 1;
    setState("dirty");
  };

  // Prethodni potpisani izveštaji istog pacijenta (za preuzimanje terapije)
  const previous = useReports({ patientId: input?.patientId, status: "signed", limit: 5 }, !!input?.patientId);
  const last = previous.data?.find((r) => r._id !== reportId);

  const patientOptions: SearchOption[] = useMemo(
    () =>
      ((patientsData?.patients ?? []) as Array<{ _id: string; name: string; lastName: string; dateOfBirth?: string; dischargeDate?: string }>)
        .sort((a, b) => `${a.lastName} ${a.name}`.localeCompare(`${b.lastName} ${b.name}`, "sr"))
        .map((p) => ({
          value: p._id,
          label: `${p.lastName} ${p.name}`,
          description: [p.dateOfBirth && `rođ. ${new Date(p.dateOfBirth).getUTCFullYear()}.`, p.dischargeDate && "otpušten"].filter(Boolean).join(" · ") || undefined,
          icon: <Avatar name={p.name} lastName={p.lastName} size="xs" />,
        })),
    [patientsData]
  );

  if (!isNew && existing.isLoading) return <PageLoader label="Učitavanje izveštaja..." />;
  if (!isNew && existing.isError) return <ErrorState message="Izveštaj nije učitan ili nemate pristup." onRetry={() => existing.refetch()} />;
  if (!input) return <PageLoader />;

  const patientName = report ? `${report.patient.name} ${report.patient.lastName}` : patientOptions.find((p) => p.value === input.patientId)?.label;
  const visit = new Date(input.visitDate);

  const pdf = async (mode: "download" | "print") => {
    const current = (state === "dirty" && editable ? await persist() : null) ?? existing.data;
    if (!current) return notify.error("Prvo sačuvajte izveštaj.");
    const { generateReportPDF } = await import("@features/medical-reports/lib/reportPdf");
    generateReportPDF(current, facility, mode).catch((err) => notify.error(err, "PDF nije napravljen."));
  };

  const doSign = async () => {
    const saved = state === "dirty" ? await persist() : report;
    if (!saved) return;
    sign.mutate(saved._id, {
      onSuccess: () => {
        notify.success("Izveštaj je potpisan.");
        setConfirm(null);
      },
      onError: (err) => {
        setConfirm(null);
        notify.error(err);
      },
    });
  };

  const copyFromLast = () => {
    if (!last) return;
    const merged = [...input.diagnoses];
    for (const d of last.diagnoses) if (!merged.some((x) => x.code === d.code && x.name === d.name)) merged.push(d);
    set({ diagnoses: merged, therapy: input.therapy.trim() ? input.therapy : last.therapy });
    notify.success("Preuzete su dijagnoze i terapija iz poslednjeg izveštaja.");
  };

  const status =
    state === "saving" ? "Čuva se..." : state === "dirty" ? "Nesačuvane izmene" : state === "error" ? "Greška pri čuvanju" : savedAt ? `Sačuvano u ${timeKey(savedAt)}` : "";

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Lekarski izveštaji", to: paths.reports },
          ...(input.patientId && patientName ? [{ label: patientName, to: paths.patient(input.patientId) }] : []),
          { label: isNew ? "Nov izveštaj" : reportTypeLabel(input.type) },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{isNew ? "Nov lekarski izveštaj" : reportTypeLabel(input.type)}</h1>
            {report?.status === "signed" ? <Badge color="success">Potpisan</Badge> : <Badge color="warning">Nacrt</Badge>}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {patientName ?? "Izaberite pacijenta"} · {visit.toLocaleDateString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric" })} {timeKey(visit)}
            {editable && status && <span className={`ml-2 ${state === "error" ? "text-error-600" : state === "dirty" ? "text-warning-600" : "text-gray-400"}`}>· {status}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && (
            <>
              <Button variant="outline" size="sm" startIcon={<LuPrinter className="h-4 w-4" />} onClick={() => void pdf("print")}>
                Štampaj
              </Button>
              <Button variant="outline" size="sm" startIcon={<LuDownload className="h-4 w-4" />} onClick={() => void pdf("download")}>
                PDF
              </Button>
            </>
          )}
          {editable && !isNew && (
            <Button variant="ghost" size="sm" className="text-error-600 hover:bg-error-50" startIcon={<LuTrash2 className="h-4 w-4" />} onClick={() => setConfirm("delete")}>
              Obriši nacrt
            </Button>
          )}
          {editable && (
            <Button size="sm" startIcon={<LuPenLine className="h-4 w-4" />} disabled={!canSave} onClick={() => setConfirm("sign")}>
              Potpiši
            </Button>
          )}
        </div>
      </div>

      {!editable && report ? (
        <ReportView report={report} canAddendum={user?.role === "doctor" && report.status === "signed"} />
      ) : !editable ? (
        <EmptyState title="Izveštaj piše doktor" description="Lekarske izveštaje pišu i potpisuju doktori." />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <Card>
              <CardHeader title="Pregled" />
              <CardBody className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.6fr)]">
                <Field label="Pacijent" htmlFor={ids.patient}>
                  <SearchSelect id={ids.patient} value={input.patientId ?? ""} disabled={!isNew} onChange={(v) => set({ patientId: v })} options={patientOptions} placeholder="Kucajte ime ili prezime..." />
                </Field>
                <Field label="Vrsta" htmlFor={ids.type}>
                  <Select id={ids.type} value={input.type} onChange={(e) => set({ type: e.target.value as ReportType })}>
                    {REPORT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-2">
                  <Field label="Datum" htmlFor={ids.date}>
                    <DateInput id={ids.date} value={dateKey(visit)} max={dateKey(new Date())} fromYear={2020} onChange={(d) => d && set({ visitDate: combine(d, timeKey(visit)).toISOString() })} />
                  </Field>
                  <Field label="Vreme" htmlFor={ids.time}>
                    <TimeInput id={ids.time} value={timeKey(visit)} onChange={(t) => set({ visitDate: combine(dateKey(visit), t).toISOString() })} />
                  </Field>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Vitalni parametri" description="Upišite samo ono što je mereno." />
              <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {VITALS.map((f) => (
                  <Field key={f.key} label={f.label} htmlFor={`${ids.patient}-${f.key}`}>
                    <Input
                      id={`${ids.patient}-${f.key}`}
                      inputMode={f.key === "bloodPressure" ? "text" : "decimal"}
                      value={input.vitals[f.key]}
                      onChange={(e) => set({ vitals: { ...input.vitals, [f.key]: e.target.value } })}
                      placeholder={f.placeholder}
                      trailing={f.unit}
                    />
                  </Field>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Anamneza i nalaz" />
              <CardBody className="space-y-4">
                <Field label="Anamneza" htmlFor={ids.anam} hint="Tegobe, tok bolesti, šta navodi pacijent ili osoblje.">
                  <Textarea id={ids.anam} rows={4} value={input.anamnesis} onChange={(e) => set({ anamnesis: e.target.value })} />
                </Field>
                <Field label="Objektivni nalaz" htmlFor={ids.find}>
                  <Textarea id={ids.find} rows={4} value={input.findings} onChange={(e) => set({ findings: e.target.value })} />
                </Field>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Dijagnoze"
                description="MKB-10"
                actions={
                  last && (
                    <Button size="xs" variant="outline" startIcon={<LuCopy className="h-3.5 w-3.5" />} onClick={copyFromLast}>
                      Preuzmi iz poslednjeg izveštaja
                    </Button>
                  )
                }
              />
              <CardBody>
                <DiagnosisPicker value={input.diagnoses} onChange={(diagnoses) => set({ diagnoses })} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Terapija i zaključak" />
              <CardBody className="space-y-4">
                <Field label="Terapija" htmlFor={ids.ther} hint="Lek, doza i učestalost — sestre je vide na profilu pacijenta.">
                  <Textarea id={ids.ther} rows={4} value={input.therapy} onChange={(e) => set({ therapy: e.target.value })} placeholder="npr. Concor 5mg 1x1 ujutru" />
                </Field>
                <Field label="Zaključak i preporuke" htmlFor={ids.concl}>
                  <Textarea id={ids.concl} rows={3} value={input.conclusion} onChange={(e) => set({ conclusion: e.target.value })} />
                </Field>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Kontrola" />
              <CardBody className="grid items-end gap-4 sm:grid-cols-[200px_1fr_auto]">
                <Field label="Datum kontrole" htmlFor={ids.fdate}>
                  <DateInput
                    id={ids.fdate}
                    value={input.followUp.date ? dateKey(new Date(input.followUp.date)) : ""}
                    min={dateKey(new Date())}
                    onChange={(d) => set({ followUp: { ...input.followUp, date: d ? combine(d, "09:00").toISOString() : null } })}
                  />
                </Field>
                <Field label="Napomena" htmlFor={ids.fnote}>
                  <Input id={ids.fnote} value={input.followUp.note} onChange={(e) => set({ followUp: { ...input.followUp, note: e.target.value } })} placeholder="npr. kontrola pritiska" />
                </Field>
                <Button
                  variant="outline"
                  startIcon={<LuCalendarPlus className="h-4 w-4" />}
                  disabled={!input.followUp.date || !input.patientId}
                  onClick={() =>
                    input.followUp.date &&
                    setSchedule({
                      ...newDraft({ start: new Date(input.followUp.date), patientId: input.patientId }),
                      title: `Kontrola${input.followUp.note ? ` — ${input.followUp.note}` : ""}`,
                      calendar: "plava",
                    })
                  }
                >
                  Zakaži u kalendaru
                </Button>
              </CardBody>
            </Card>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-20">
            <Card>
              <CardHeader title="Prethodni izveštaji" />
              {!input.patientId ? (
                <p className="px-5 py-4 text-sm text-gray-500">Izaberite pacijenta.</p>
              ) : (previous.data ?? []).filter((r) => r._id !== reportId).length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-500">Nema potpisanih izveštaja.</p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(previous.data ?? [])
                    .filter((r) => r._id !== reportId)
                    .map((r) => (
                      <li key={r._id}>
                        <Link to={paths.report(r._id)} target="_blank" className="block px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{reportTypeLabel(r.type)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(r.visitDate).toLocaleDateString("sr-Latn-RS")} · dr {r.author.lastName}
                          </p>
                          {r.diagnoses.length > 0 && <p className="mt-0.5 truncate text-xs text-gray-600 dark:text-gray-300">{r.diagnoses.map((d) => d.code || d.name).join(", ")}</p>}
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
            </Card>
            <p className="flex gap-2 px-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              <LuCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Nacrt se čuva sam dok kucate i vidite ga samo vi. Posle potpisa izveštaj vide sestre i uprava, a izmene su moguće samo kao dopuna.
            </p>
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={confirm === "sign"}
        onClose={() => setConfirm(null)}
        onConfirm={() => void doSign()}
        loading={sign.isPending || state === "saving"}
        variant="primary"
        title="Potpisati izveštaj?"
        description="Posle potpisa izveštaj se ne može menjati, a vide ga sestre i uprava. Ispravke se dodaju kao dopuna."
        confirmText="Potpiši"
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onClose={() => setConfirm(null)}
        loading={remove.isPending}
        title="Obrisati nacrt?"
        description="Nacrt će biti trajno obrisan."
        confirmText="Obriši"
        onConfirm={() =>
          remove.mutate(reportId, {
            onSuccess: () => {
              notify.success("Nacrt je obrisan.");
              setState("idle");
              navigate(input.patientId ? paths.patient(input.patientId) : paths.reports, { replace: true });
            },
            onError: (err) => notify.error(err),
          })
        }
      />
      {schedule && <EventDialog draft={schedule} lockPatient onClose={() => setSchedule(null)} />}
    </div>
  );
}
