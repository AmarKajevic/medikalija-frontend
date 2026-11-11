import { ChangeEvent, useEffect, useId, useMemo, useState } from "react";
import { LuCircleAlert, LuFileText, LuInfo } from "react-icons/lu";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Field from "@shared/ui/form/Field";
import { Checkbox, Input, Select } from "@shared/ui/form/controls";
import SearchSelect, { SearchOption } from "@shared/ui/combobox/SearchSelect";
import { notify } from "@shared/lib/notify";
import { usePatients } from "@features/patients/hooks/usePatients";
import { fetchMergeData, MergeField, useMergeFields, useSaveTemplate } from "@features/social/dossier";
import { autoTemplate, AutoTemplateResult, Detection } from "@features/social/lib/autoTemplate";
import { fillTemplate } from "@features/social/lib/wordTemplate";
import { DocxPreview } from "./DocxPreview";

const KIND_LABEL: Record<Detection["kind"], string> = { value: "Podatak", list: "Tabela", section: "Poglavlje", text: "U tekstu" };

const toBase64 = (buf: ArrayBuffer) => {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};

// Popunjen dokument jednog korisnika → šablon za sve: aplikacija predlaže šta se menja,
// socijalni radnik proverava (može isključiti ili izabrati drugo polje) i vidi pregled pre čuvanja.
export default function AutoTemplateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const id = useId();
  const catalog = useMergeFields();
  const save = useSaveTemplate();
  const { data: patientsData } = usePatients();
  const [original, setOriginal] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState("");
  const [pdf, setPdf] = useState(false);
  const [error, setError] = useState("");
  const [overrides, setOverrides] = useState<Record<string, string | null>>({});
  const [name, setName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [preview, setPreview] = useState<Blob | ArrayBuffer | null>(null);

  useEffect(() => {
    if (!open) return;
    setOriginal(null);
    setFileName("");
    setPdf(false);
    setError("");
    setOverrides({});
    setName("");
    setPatientId("");
    setPreview(null);
  }, [open]);

  const analysis = useMemo((): { result: AutoTemplateResult | null; error: string } => {
    if (!original) return { result: null, error: "" };
    try {
      return { result: autoTemplate(original, overrides), error: "" };
    } catch (err) {
      return { result: null, error: err instanceof Error ? err.message : "Dokument nije pročitan." };
    }
  }, [original, overrides]);
  const result = analysis.result;
  const shownError = error || analysis.error;

  // Pregled: šablon sa poljima, ili popunjen podacima izabranog korisnika
  useEffect(() => {
    if (!result) return setPreview(null);
    let cancelled = false;
    if (!patientId) {
      setPreview(result.output);
      return;
    }
    fetchMergeData(patientId)
      .then((data) => fillTemplate(result.output, data))
      .then((blob) => !cancelled && setPreview(blob))
      .catch((err) => !cancelled && notify.error(err, "Pregled nije napravljen."));
    return () => {
      cancelled = true;
    };
  }, [result, patientId]);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setError("");
    setOverrides({});
    setOriginal(null);
    setPdf(false);
    if (!f) return;
    if (/\.pdf$/i.test(f.name)) return setPdf(true);
    if (!/\.docx$/i.test(f.name)) return setError("Izaberite Word dokument (.docx).");
    if (f.size > 2 * 1024 * 1024) return setError("Fajl je veći od 2 MB. Smanjite slike u dokumentu.");
    setFileName(f.name);
    setName(f.name.replace(/\.docx$/i, ""));
    setOriginal(await f.arrayBuffer());
  };

  const fieldOptions = useMemo(() => {
    const groups = (catalog.data?.fields ?? []).reduce<Record<string, MergeField[]>>((acc, f) => ({ ...acc, [f.group]: [...(acc[f.group] ?? []), f] }), {});
    return Object.entries(groups);
  }, [catalog.data]);
  const patientOptions: SearchOption[] = useMemo(
    () =>
      ((patientsData?.patients ?? []) as Array<{ _id: string; name: string; lastName: string; dischargeDate?: string }>)
        .filter((p) => !p.dischargeDate)
        .sort((a, b) => `${a.lastName} ${a.name}`.localeCompare(`${b.lastName} ${b.name}`, "sr"))
        .map((p) => ({ value: p._id, label: `${p.lastName} ${p.name}` })),
    [patientsData]
  );

  const setField = (d: Detection, field: string | null) => setOverrides((o) => ({ ...o, [d.id]: field }));
  /** Ponovo uključeno: vraća se predlog aplikacije */
  const resetField = (d: Detection) =>
    setOverrides((o) => {
      const next = { ...o };
      delete next[d.id];
      return next;
    });
  const active = result?.detections.filter((d) => d.field).length ?? 0;

  const onSave = async () => {
    if (!result) return;
    if (!name.trim()) return notify.error("Unesite naziv šablona.");
    try {
      await save.mutateAsync({ input: { name: name.trim(), description: "Napravljen iz popunjenog dokumenta", fileName: fileName || `${name.trim()}.docx`, data: toBase64(result.output) } });
      notify.success("Šablon je sačuvan. Sada ga možete popuniti za bilo kog korisnika.");
      onClose();
    } catch (err) {
      notify.error(err, "Šablon nije sačuvan.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="full"
      title="Šablon iz popunjenog dokumenta"
      description="Postavite dokument popunjen za jednog korisnika — aplikacija prepoznaje podatke i pravi šablon koji se popunjava za bilo kog korisnika."
      scrollBody={false}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Otkaži
          </Button>
          <Button size="sm" onClick={() => void onSave()} loading={save.isPending} disabled={!result}>
            Sačuvaj kao šablon
          </Button>
        </>
      }
    >
      <div className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[440px_1fr]">
        <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
          <Field label="Popunjen dokument (.docx)" htmlFor={`${id}-file`} hint="Npr. socijalni karton, ugovor ili obaveštenje popunjeno za jednog korisnika.">
            <input
              id={`${id}-file`}
              type="file"
              accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
              onChange={onFile}
              className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:text-gray-300 dark:file:bg-brand-500/15 dark:file:text-brand-300"
            />
          </Field>

          {pdf && (
            <div role="alert" className="space-y-2 rounded-lg border border-blue-light-200 bg-blue-light-50 p-3 text-sm text-blue-light-800 dark:border-blue-light-500/30 dark:bg-blue-light-500/10 dark:text-blue-light-300">
              <p className="flex items-center gap-1.5 font-medium">
                <LuInfo className="h-4 w-4" /> PDF prvo pretvorite u Word
              </p>
              <p>PDF je format za štampu i ne može se pouzdano menjati. Word to radi sam:</p>
              <ol className="list-decimal space-y-0.5 pl-5">
                <li>U Wordu: Datoteka → Otvori → izaberite PDF (Word ga pretvara u dokument).</li>
                <li>Proverite da li tabele izgledaju dobro.</li>
                <li>Datoteka → Sačuvaj kao → Word dokument (.docx), pa ga postavite ovde.</li>
              </ol>
            </div>
          )}
          {shownError && (
            <p role="alert" className="flex items-center gap-1.5 rounded-lg bg-error-50 p-3 text-sm text-error-700 dark:bg-error-500/10 dark:text-error-300">
              <LuCircleAlert className="h-4 w-4 shrink-0" /> {shownError}
            </p>
          )}

          {result && (
            <>
              <Field label="Naziv šablona" htmlFor={`${id}-name`}>
                <Input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} leading={<LuFileText className="h-4 w-4" />} maxLength={120} />
              </Field>

              <section>
                <h4 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white/90">Prepoznato ({active})</h4>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Ovo se menja podacima korisnika. Isključite ono što treba da ostane isto, ili izaberite drugo polje.</p>
                {result.detections.length === 0 && <p className="text-sm text-gray-500">Nijedan podatak nije prepoznat. Možete ručno upisati polja u Wordu (vidi „Polja za šablone“).</p>}
                <ul className="space-y-2">
                  {result.detections.map((d) => (
                    <li key={d.id} className={`rounded-lg border p-2.5 ${d.field ? "border-gray-200 dark:border-gray-800" : "border-dashed border-gray-200 opacity-60 dark:border-gray-800"}`}>
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id={`${id}-${d.id}`}
                          className="min-w-0 flex-1"
                          label={
                            <span>
                              <span className="mr-1.5 rounded bg-gray-100 px-1 py-0.5 text-[10px] font-semibold uppercase text-gray-500 dark:bg-white/5">{KIND_LABEL[d.kind]}</span>
                              <span className="font-medium">{d.label}</span>
                            </span>
                          }
                          description={<span className="line-clamp-2">„{d.sample}”</span>}
                          checked={!!d.field}
                          onChange={(e) => (e.target.checked ? resetField(d) : setField(d, null))}
                        />
                      </div>
                      {d.field && (d.kind === "value" || d.kind === "text") && (
                        <Select aria-label={`Polje za: ${d.label}`} className="mt-2 h-9 text-xs" value={d.field} onChange={(e) => setField(d, e.target.value)}>
                          {fieldOptions.map(([group, fields]) => (
                            <optgroup key={group} label={group}>
                              {fields.map((f) => (
                                <option key={f.key} value={f.key}>
                                  {f.label} — {`{${f.key}}`}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </Select>
                      )}
                    </li>
                  ))}
                </ul>
              </section>

              {result.unrecognized.length > 0 && (
                <section className="rounded-lg bg-warning-50 p-3 text-sm text-warning-800 dark:bg-warning-500/10 dark:text-warning-300">
                  <p className="mb-1 flex items-center gap-1.5 font-medium">
                    <LuCircleAlert className="h-4 w-4" /> Ostaje kao u originalu
                  </p>
                  <p className="mb-1 text-xs">Ovo nije prepoznato kao podatak korisnika. Ako treba da se menja, upišite polje u Wordu.</p>
                  <ul className="list-disc pl-5 text-xs">
                    {result.unrecognized.map((u) => (
                      <li key={u}>{u}</li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        <div className="flex min-h-[420px] flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pregled:</span>
            <div className="min-w-56 flex-1 sm:max-w-sm">
              <SearchSelect id={`${id}-patient`} value={patientId} onChange={setPatientId} options={patientOptions} emptyLabel="Šablon sa poljima" placeholder="Popuni za korisnika..." />
            </div>
          </div>
          {preview ? (
            <DocxPreview file={preview} className="min-h-0 flex-1" />
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm text-gray-500 dark:border-gray-800">
              Izaberite popunjen Word dokument da vidite pregled.
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
