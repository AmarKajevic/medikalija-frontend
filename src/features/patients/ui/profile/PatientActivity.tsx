import { ReactNode, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LuFlaskConical, LuPackage, LuPill, LuStethoscope, LuTrash2 } from "react-icons/lu";
import Tabs from "@shared/ui/tabs/Tabs";
import Button from "@shared/ui/button/Button";
import { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { api } from "@shared/api/api";
import { notify } from "@shared/lib/notify";
import { formatQty, formatRSD, roleLabel } from "@shared/lib/format";
import { useDiagnoses } from "@entities/diagnosis/hooks/useDiagnosis";
import { useMedicine } from "@entities/medicine/hooks/useMedicine";
import { usePatientArticles } from "@entities/article/hooks/useArticle";
import { useUsedCombination } from "@features/combinations/hooks/useUsedCombination";

type TabKey = "diagnoses" | "medicines" | "combinations" | "articles";

// Unosi uprave (admin, glavna sestra) menjaju stanje i specifikaciju; unosi
// sestara se samo beleže. Filter "Autor" razdvaja jedne od drugih.
const MANAGER_ROLES = ["admin", "main-nurse"];
type WithAuthor = { createdBy?: { name?: string; role?: string } };
export type AuthorFilter = "all" | "managers" | "nurses";
const byAuthor = <T extends WithAuthor>(rows: T[] | undefined, filter: AuthorFilter) =>
  (Array.isArray(rows) ? rows : []).filter((r) => {
    if (filter === "all") return true;
    const manager = MANAGER_ROLES.includes(r?.createdBy?.role ?? "");
    return filter === "managers" ? manager : !manager;
  });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const CLEAR = {
  diagnoses: { url: (id: string) => `/api/diagnosis/patient/${id}/diagnoses/delete-all`, key: "diagnosis", label: "dijagnoze" },
  medicines: { url: (id: string) => `/api/medicine/patient/${id}/medicines/delete-all`, key: "usedMedicine", label: "unose lekova" },
  combinations: {
    url: (id: string) => `/api/analysis/combination/patient/${id}/combinations/delete-all`,
    key: "usedCombinations",
    label: "unose analiza",
  },
  articles: { url: (id: string) => `/api/articles/patient/${id}/articles/delete-all`, key: "usedArticles", label: "unose artikala" },
} as const;

type DiagnosisRecord = { _id: string; description: string; createdAt: string } & WithAuthor;

interface Row {
  id: string;
  title: ReactNode;
  detail?: ReactNode;
  amount?: ReactNode;
  author?: WithAuthor["createdBy"];
  date: string;
}

function ActivityList({ rows, empty }: { rows: Row[]; empty: string }) {
  if (rows.length === 0) return <EmptyState compact title={empty} />;
  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
      {rows.map((r) => (
        <li key={r.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{r.title}</p>
            {r.detail && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{r.detail}</p>}
          </div>
          {r.amount && <div className="shrink-0 text-sm tabular-nums text-gray-700 dark:text-gray-300">{r.amount}</div>}
          <div className="shrink-0 text-xs text-gray-500 sm:w-48 sm:text-right dark:text-gray-400">
            {r.author?.name} {r.author?.role && `· ${roleLabel(r.author.role)}`}
            <br />
            {formatDateTime(r.date)}
          </div>
        </li>
      ))}
    </ul>
  );
}

interface PatientActivityProps {
  patientId: string;
  defaultAuthor?: AuthorFilter;
  /** Uprava može da briše istoriju unosa */
  canClear?: boolean;
}

export default function PatientActivity({ patientId, defaultAuthor = "all", canClear = false }: PatientActivityProps) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>("diagnoses");
  const [author, setAuthor] = useState<AuthorFilter>(defaultAuthor);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const diagnoses = byAuthor(useDiagnoses(patientId).data as DiagnosisRecord[] | undefined, author);
  const medicines = byAuthor(useMedicine(patientId).data, author);
  const articles = byAuthor(usePatientArticles(patientId).data, author);
  const combinations = byAuthor(useUsedCombination(patientId).data, author);

  const rows: Record<TabKey, Row[]> = {
    diagnoses: diagnoses.map((d) => ({
      id: d._id,
      title: d.description,
      author: d.createdBy,
      date: d.createdAt,
    })),
    medicines: medicines.map((m) => ({
      id: m._id,
      title: m.medicine?.name ?? "Obrisan lek",
      detail:
        m.familyAmount > 0
          ? `${formatQty(m.familyAmount)} sa porodičnog, ${formatQty(m.homeAmount)} sa stanja doma`
          : `${formatRSD(m.priceAtTheTime)} po komadu`,
      amount: (
        <>
          × {formatQty(m.amount)} · <span className="font-medium">{formatRSD(m.amount * m.priceAtTheTime)}</span>
        </>
      ),
      author: m.createdBy,
      date: m.createdAt,
    })),
    combinations: combinations.map((c) => ({
      id: c._id,
      title: c.combinationName,
      detail: c.analyses.map((a) => a.name).join(", "),
      amount: <span className="font-medium">{formatRSD(c.totalPriceAtTheTime)}</span>,
      author: c.createdBy,
      date: c.createdAt,
    })),
    articles: articles.map((a) => ({
      id: a._id,
      title: a.article?.name ?? "Obrisan artikal",
      amount: (
        <>
          × {formatQty(a.amount)} · <span className="font-medium">{formatRSD(a.amount * (a.article?.price ?? 0))}</span>
        </>
      ),
      author: a.createdBy,
      date: a.createdAt,
    })),
  };

  const clearAll = async () => {
    setClearing(true);
    try {
      await api.delete(CLEAR[tab].url(patientId));
      await qc.invalidateQueries({ queryKey: [CLEAR[tab].key, patientId] });
      notify.success("Istorija unosa je obrisana.");
      setConfirmClear(false);
    } catch (err) {
      notify.error(err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <div className="px-5 pt-4">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "diagnoses", label: "Dijagnoze", icon: <LuStethoscope className="h-4 w-4" />, count: rows.diagnoses.length },
            { value: "medicines", label: "Lekovi", icon: <LuPill className="h-4 w-4" />, count: rows.medicines.length },
            { value: "combinations", label: "Analize", icon: <LuFlaskConical className="h-4 w-4" />, count: rows.combinations.length },
            { value: "articles", label: "Artikli", icon: <LuPackage className="h-4 w-4" />, count: rows.articles.length },
          ]}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-2.5 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <label htmlFor={`author-${patientId}`} className="text-xs text-gray-500 dark:text-gray-400">
            Autor
          </label>
          <select
            id={`author-${patientId}`}
            value={author}
            onChange={(e) => setAuthor(e.target.value as AuthorFilter)}
            className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="all">Svi</option>
            <option value="managers">Uprava (utiče na stanje)</option>
            <option value="nurses">Sestre (samo beleženje)</option>
          </select>
        </div>
        {canClear && rows[tab].length > 0 && (
          <Button
            variant="ghost"
            size="xs"
            className="text-error-600 hover:bg-error-50 hover:text-error-700 dark:text-error-400 dark:hover:bg-error-500/10"
            startIcon={<LuTrash2 className="h-3.5 w-3.5" />}
            onClick={() => setConfirmClear(true)}
          >
            Obriši sve
          </Button>
        )}
      </div>
      <div className="px-5 pb-2">
        <ActivityList
          rows={rows[tab]}
          empty={
            { diagnoses: "Nema dijagnoza", medicines: "Nema unetih lekova", combinations: "Nema urađenih analiza", articles: "Nema unetih artikala" }[tab]
          }
        />
      </div>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clearAll}
        loading={clearing}
        title={`Obrisati sve ${CLEAR[tab].label}?`}
        description="Briše se samo istorija unosa na profilu. Specifikacija i stanje na lageru se ne menjaju. Ova radnja se ne može poništiti."
        confirmText="Obriši sve"
      />
    </div>
  );
}
