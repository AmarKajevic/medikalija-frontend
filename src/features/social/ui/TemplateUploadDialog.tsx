import { ChangeEvent, FormEvent, useEffect, useId, useState } from "react";
import { LuCircleAlert, LuCircleCheck, LuFileText } from "react-icons/lu";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Field from "@shared/ui/form/Field";
import { Input } from "@shared/ui/form/controls";
import { notify } from "@shared/lib/notify";
import { DocumentTemplate, useMergeFields, useSaveTemplate } from "@features/social/dossier";
import { checkTemplate, fileToBase64, TemplateCheck } from "@features/social/lib/wordTemplate";

const MAX_BYTES = 2 * 1024 * 1024;

interface Props {
  open: boolean;
  onClose: () => void;
  /** Izmena postojećeg šablona (naziv, opis ili novi fajl) */
  template?: DocumentTemplate | null;
}

// Postavljanje Word šablona: pre slanja proverava polja u fajlu, da greška u kucanju
// ({jmgb} umesto {jmbg}) ne prođe neprimećeno.
export default function TemplateUploadDialog({ open, onClose, template }: Props) {
  const formId = useId();
  const id = useId();
  const save = useSaveTemplate();
  const catalog = useMergeFields();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [check, setCheck] = useState<TemplateCheck | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(template?.name ?? "");
    setDescription(template?.description ?? "");
    setFile(null);
    setCheck(null);
  }, [open, template]);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setCheck(null);
    if (!f) return;
    if (!/\.docx$/i.test(f.name)) return setCheck({ known: [], unknown: [], errors: ["Izaberite Word fajl sa ekstenzijom .docx (stari .doc sačuvajte u Wordu kao .docx)."] });
    if (f.size > MAX_BYTES) return setCheck({ known: [], unknown: [], errors: ["Fajl je veći od 2 MB. Smanjite slike u dokumentu."] });
    if (!name) setName(f.name.replace(/\.docx$/i, ""));
    if (!catalog.data) return;
    setChecking(true);
    try {
      setCheck(await checkTemplate(await f.arrayBuffer(), catalog.data));
    } finally {
      setChecking(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!template && !file) return notify.error("Izaberite Word fajl.");
    if (check?.errors.length) return notify.error("Ispravite šablon u Wordu pa ga postavite ponovo.");
    if (!name.trim()) return notify.error("Unesite naziv šablona.");
    try {
      await save.mutateAsync({
        id: template?._id,
        input: { name: name.trim(), description: description.trim(), ...(file ? { fileName: file.name, data: await fileToBase64(file) } : {}) },
      });
      notify.success(template ? "Šablon je sačuvan." : "Šablon je postavljen.");
      onClose();
    } catch (err) {
      notify.error(err, "Šablon nije sačuvan.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={template ? "Izmena šablona" : "Novi Word šablon"}
      description="Napravite dokument u Wordu, na mesta gde idu podaci upišite polja (npr. {ime_prezime}), sačuvajte kao .docx i postavite ga ovde."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Otkaži
          </Button>
          <Button size="sm" type="submit" form={formId} loading={save.isPending || checking} disabled={!!check?.errors.length}>
            Sačuvaj šablon
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label={template ? "Novi fajl (nije obavezno)" : "Word fajl (.docx)"} htmlFor={`${id}-file`} hint={template ? `Trenutno: ${template.fileName}` : "Najviše 2 MB."}>
          <input
            id={`${id}-file`}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={onFile}
            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:text-gray-300 dark:file:bg-brand-500/15 dark:file:text-brand-300"
          />
        </Field>

        {checking && <p className="text-sm text-gray-500">Proveravam polja u šablonu…</p>}
        {check && check.errors.length > 0 && (
          <div role="alert" className="space-y-1 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
            <p className="flex items-center gap-1.5 font-medium">
              <LuCircleAlert className="h-4 w-4" /> Šablon ima grešku:
            </p>
            {check.errors.map((e) => (
              <p key={e}>{e}</p>
            ))}
          </div>
        )}
        {check && !check.errors.length && (
          <div className="space-y-2 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800">
            <p className="flex items-center gap-1.5 text-success-700 dark:text-success-400">
              <LuCircleCheck className="h-4 w-4" />
              {check.known.length ? `Pronađeno ${check.known.length} polja koja aplikacija popunjava.` : "Šablon nema polja — biće preuzet kakav jeste."}
            </p>
            {check.unknown.length > 0 && (
              <p className="flex items-start gap-1.5 text-warning-700 dark:text-warning-400">
                <LuCircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Nepoznata polja (ostaće prazna, proverite kucanje): <strong>{check.unknown.map((u) => `{${u}}`).join(", ")}</strong>
                </span>
              </p>
            )}
          </div>
        )}

        <Field label="Naziv" htmlFor={`${id}-name`}>
          <Input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} placeholder="npr. Ugovor o smeštaju" leading={<LuFileText className="h-4 w-4" />} maxLength={120} />
        </Field>
        <Field label="Opis (nije obavezno)" htmlFor={`${id}-desc`}>
          <Input id={`${id}-desc`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kada se koristi" maxLength={300} />
        </Field>
      </form>
    </Dialog>
  );
}
