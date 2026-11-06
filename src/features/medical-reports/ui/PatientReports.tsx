import { Link } from "react-router";
import { LuFilePlus, LuFileText } from "react-icons/lu";
import { Card, CardHeader } from "@shared/ui/card/Card";
import { ButtonLink } from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { paths } from "@app/paths";
import { reportTypeLabel, useReports } from "@features/medical-reports/model";

// Medicinska dokumentacija pacijenta: potpisani izveštaji (i nacrti autora).
export default function PatientReports({ patientId, canWrite }: { patientId: string; canWrite: boolean }) {
  const { data = [], isLoading } = useReports({ patientId, limit: 50 });
  const latestTherapy = data.find((r) => r.status === "signed" && r.therapy.trim());

  return (
    <Card>
      <CardHeader
        title="Medicinska dokumentacija"
        description="Lekarski izveštaji, od najnovijeg"
        icon={<LuFileText />}
        actions={
          canWrite && (
            <ButtonLink to={paths.newReport(patientId)} size="xs" startIcon={<LuFilePlus className="h-3.5 w-3.5" />}>
              Nov izveštaj
            </ButtonLink>
          )
        }
      />
      {latestTherapy && (
        <div className="border-b border-gray-100 bg-brand-50/50 px-5 py-3 dark:border-gray-800 dark:bg-brand-500/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">Aktuelna terapija</p>
          <p className="mt-0.5 whitespace-pre-line text-sm text-gray-800 dark:text-gray-200">{latestTherapy.therapy}</p>
          <p className="mt-1 text-xs text-gray-500">
            iz izveštaja {new Date(latestTherapy.visitDate).toLocaleDateString("sr-Latn-RS")} · dr {latestTherapy.author.name} {latestTherapy.author.lastName}
          </p>
        </div>
      )}
      {isLoading ? (
        <div className="space-y-2 p-5">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : data.length === 0 ? (
        <EmptyState compact icon={<LuFileText />} title="Nema izveštaja" description={canWrite ? "Napišite prvi izveštaj posle pregleda." : undefined} />
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.map((r) => (
            <li key={r._id}>
              <Link to={paths.report(r._id)} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {reportTypeLabel(r.type)}
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      {new Date(r.visitDate).toLocaleDateString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric" })} · dr {r.author.name} {r.author.lastName}
                    </span>
                  </p>
                  {r.diagnoses.length > 0 && (
                    <p className="mt-0.5 truncate text-xs text-gray-600 dark:text-gray-300">{r.diagnoses.map((d) => (d.code ? `${d.code} ${d.name}` : d.name)).join(" · ")}</p>
                  )}
                  {r.conclusion && <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{r.conclusion}</p>}
                </div>
                {r.status === "draft" ? <Badge size="sm" color="warning">Nacrt</Badge> : r.addenda.length > 0 ? <Badge size="sm" color="info">Dopunjen</Badge> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
