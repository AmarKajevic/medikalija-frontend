import { useState } from "react";
import { LuCheck, LuCopy, LuDownload, LuEllipsis, LuFileText, LuPencil, LuPlus, LuTrash2, LuWandSparkles } from "react-icons/lu";
import { Card, CardBody, CardHeader } from "@shared/ui/card/Card";
import Button from "@shared/ui/button/Button";
import ActionMenu from "@shared/ui/menu/ActionMenu";
import { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import EmptyState, { ErrorState } from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { notify } from "@shared/lib/notify";
import { formatDay } from "@shared/lib/calendarDay";
import { DocumentTemplate, fetchTemplateFile, MergeField, useDeleteTemplate, useMergeFields, useTemplates } from "@features/social/dossier";
import { downloadBlob } from "@features/social/lib/wordTemplate";
import TemplateUploadDialog from "./TemplateUploadDialog";
import AutoTemplateDialog from "./AutoTemplateDialog";

const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

function CopyTag({ tag, label }: { tag: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tag);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      notify.error("Kopiranje nije uspelo — označite polje i kopirajte ručno.");
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      title={`Kopiraj ${tag}`}
      className="group flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.03]"
    >
      <span className="min-w-0">
        <code className="block truncate text-sm font-medium text-brand-700 dark:text-brand-300">{tag}</code>
        <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{label}</span>
      </span>
      {copied ? <LuCheck className="h-4 w-4 shrink-0 text-success-600" aria-label="kopirano" /> : <LuCopy className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-gray-500" />}
    </button>
  );
}

// Šabloni ustanove i uputstvo kako se prave u Wordu.
export default function TemplatesPanel({ canWrite }: { canWrite: boolean }) {
  const { data = [], isLoading, isError, refetch } = useTemplates();
  const catalog = useMergeFields();
  const remove = useDeleteTemplate();
  const [editing, setEditing] = useState<DocumentTemplate | null | "new">(null);
  const [toDelete, setToDelete] = useState<DocumentTemplate | null>(null);
  const [auto, setAuto] = useState(false);

  const groups = (catalog.data?.fields ?? []).reduce<Record<string, MergeField[]>>((acc, f) => ({ ...acc, [f.group]: [...(acc[f.group] ?? []), f] }), {});

  const downloadOriginal = async (t: DocumentTemplate) => {
    try {
      downloadBlob(new Blob([await fetchTemplateFile(t._id)]), t.fileName);
    } catch (err) {
      notify.error(err, "Šablon nije preuzet.");
    }
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_400px]">
      <Card>
        <CardHeader
          icon={<LuFileText />}
          title="Word šabloni"
          description="Ugovori, obaveštenja, dopisi CSR-u… Popunjavaju se podacima korisnika jednim klikom, iz dosijea korisnika."
          actions={
            canWrite && (
              <div className="flex flex-wrap gap-2">
                <Button size="xs" variant="outline" startIcon={<LuWandSparkles className="h-3.5 w-3.5" />} onClick={() => setAuto(true)}>
                  Iz popunjenog dokumenta
                </Button>
                <Button size="xs" startIcon={<LuPlus className="h-3.5 w-3.5" />} onClick={() => setEditing("new")}>
                  Novi šablon
                </Button>
              </div>
            )
          }
        />
        {isLoading ? (
          <div className="p-5">
            <Skeleton className="h-24" />
          </div>
        ) : isError ? (
          <div className="p-5">
            <ErrorState message="Šabloni nisu učitani." onRetry={() => refetch()} />
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            icon={<LuFileText />}
            title="Još nema šablona"
            description="Postavite dokument koji već koristite, popunjen za jednog korisnika — aplikacija sama prepoznaje podatke. Ili napravite šablon u Wordu sa poljima iz liste desno."
            action={
              canWrite ? (
                <div className="flex flex-wrap justify-center gap-2">
                  <Button size="sm" startIcon={<LuWandSparkles className="h-4 w-4" />} onClick={() => setAuto(true)}>
                    Iz popunjenog dokumenta
                  </Button>
                  <Button size="sm" variant="outline" startIcon={<LuPlus className="h-4 w-4" />} onClick={() => setEditing("new")}>
                    Šablon sa poljima
                  </Button>
                </div>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.map((t) => (
              <li key={t._id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400">
                  <LuFileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white/90">{t.name}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {[t.description, `${t.fileName} · ${kb(t.size)}`, `izmenjen ${formatDay(t.updatedAt)}${t.uploadedBy ? ` · ${t.uploadedBy.name} ${t.uploadedBy.lastName}` : ""}`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <ActionMenu
                  trigger={({ toggle }) => (
                    <button type="button" onClick={toggle} aria-label={`Akcije za šablon ${t.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5">
                      <LuEllipsis className="h-4 w-4" />
                    </button>
                  )}
                  items={[
                    { label: "Preuzmi prazan šablon", icon: <LuDownload />, onClick: () => void downloadOriginal(t) },
                    ...(canWrite
                      ? [
                          { label: "Izmeni ili zameni fajl", icon: <LuPencil />, onClick: () => setEditing(t) },
                          { label: "Obriši šablon", icon: <LuTrash2 />, danger: true, separated: true, onClick: () => setToDelete(t) },
                        ]
                      : []),
                  ]}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Polja za šablone" description="Kliknite polje da ga kopirate, pa ga nalepite u Word." />
        <CardBody className="space-y-5">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
            <li>U Wordu napišite dokument kao i obično.</li>
            <li>
              Gde ide podatak, nalepite polje, npr. <code className="text-brand-700 dark:text-brand-300">{"{ime_prezime}"}</code>.
            </li>
            <li>Za tabelu sa više redova (npr. porodica): u jedan red tabele stavite polja između oznaka ispod — red se ponavlja za svakog člana.</li>
            <li>Datumi se upisuju sa tačkom na kraju (15.03.1938.), pa posle polja sa datumom ne kucajte tačku.</li>
            <li>Sačuvajte kao .docx i postavite ovde.</li>
          </ol>
          {catalog.isLoading ? (
            <Skeleton className="h-40" />
          ) : (
            <>
              {Object.entries(groups).map(([group, fields]) => (
                <section key={group}>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{group}</h4>
                  <div className="grid gap-0.5 sm:grid-cols-2 xl:grid-cols-1">
                    {fields.map((f) => (
                      <CopyTag key={f.key} tag={`{${f.key}}`} label={f.label} />
                    ))}
                  </div>
                </section>
              ))}
              {catalog.data?.lists.map((l) => (
                <section key={l.key}>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Tabela: {l.label}</h4>
                  <p className="mb-1 px-2 text-xs text-gray-500 dark:text-gray-400">
                    U prvu ćeliju reda <code>{`{#${l.key}}`}</code>, u poslednju <code>{`{/${l.key}}`}</code>, a između:
                  </p>
                  <CopyTag tag={`{#${l.key}}`} label="početak reda koji se ponavlja" />
                  {l.fields.map((f) => (
                    <CopyTag key={f.key} tag={`{${f.key}}`} label={f.label} />
                  ))}
                  <CopyTag tag={`{/${l.key}}`} label="kraj reda koji se ponavlja" />
                </section>
              ))}
            </>
          )}
        </CardBody>
      </Card>

      {canWrite && <AutoTemplateDialog open={auto} onClose={() => setAuto(false)} />}
      <TemplateUploadDialog open={editing !== null} onClose={() => setEditing(null)} template={editing === "new" ? null : editing} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() =>
          toDelete &&
          remove.mutate(toDelete._id, {
            onSuccess: () => {
              notify.success("Šablon je obrisan.");
              setToDelete(null);
            },
            onError: (err) => notify.error(err),
          })
        }
        loading={remove.isPending}
        title={`Obrisati šablon „${toDelete?.name}”?`}
        description="Već preuzeti popunjeni dokumenti ostaju kod vas; šablon se više neće nuditi."
        confirmText="Obriši"
      />
    </div>
  );
}
