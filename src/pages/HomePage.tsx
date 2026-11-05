import { Link } from "react-router";
import { LuBell, LuPackage, LuPackageOpen, LuPill, LuUserPlus, LuUsers } from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import { isManager, paths } from "@app/paths";
import PageHeader from "@shared/ui/page/PageHeader";
import StatCard from "@shared/ui/StatCard";
import { ButtonLink } from "@shared/ui/button/Button";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { useDashboardStats } from "@features/dashboard/hooks/useDashboardStats";
import { FacilityDashboardStats, PersonalDashboardStats } from "@features/dashboard/types";
import { ActivityFeed, LowStockList, StaffOverview, UpcomingEvents } from "@features/dashboard/ui/DashboardWidgets";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Dobro jutro" : h < 18 ? "Dobar dan" : "Dobro veče";
};

const today = () =>
  new Date().toLocaleDateString("sr-Latn-RS", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const QUICK_ACTIONS = [
  { label: "Pacijenti", description: "Profili, učinak rada i potrošnja", to: paths.patients, icon: <LuUsers /> },
  { label: "Porodične zalihe", description: "Unos lekova i artikala koje donosi porodica", to: paths.familyStock, icon: <LuPackageOpen /> },
  { label: "Artikli", description: "Stanje artikala doma", to: paths.articles, icon: <LuPackage /> },
];

export default function HomePage() {
  const { user } = useAuth();
  const manager = isManager(user?.role);
  const { data, isLoading, isError, refetch } = useDashboardStats();

  const facility = data?.scope === "facility" ? (data as FacilityDashboardStats) : null;
  const personal = data?.scope === "personal" ? (data as PersonalDashboardStats) : null;

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user?.name ?? ""}`}
        description={<span className="capitalize">{today()}</span>}
        actions={
          manager && (
            <>
              <ButtonLink to={paths.medicines} variant="outline" size="sm" startIcon={<LuPill className="h-4 w-4" />}>
                Lekovi
              </ButtonLink>
              <ButtonLink to={`${paths.patients}?new=1`} size="sm" startIcon={<LuUserPlus className="h-4 w-4" />}>
                Novi pacijent
              </ButtonLink>
            </>
          )
        }
      />

      {isError && <div className="mb-6"><ErrorState message="Statistika trenutno nije dostupna." onRetry={() => refetch()} /></div>}

      {manager ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Pacijenti na smeštaju" value={facility?.patients.active ?? "—"} loading={isLoading} icon={<LuUsers />} to={paths.patients} hint="Pregled pacijenata" />
            <StatCard label="Primljeno (30 dana)" value={facility?.patients.admittedLast30Days ?? "—"} loading={isLoading} icon={<LuUserPlus />} hint={facility ? `${facility.patients.discharged} otpušteno ukupno` : undefined} />
            <StatCard
              label="Lekovi pri kraju"
              value={facility?.lowStockMedicines.length ?? "—"}
              loading={isLoading}
              icon={<LuPill />}
              to={paths.medicines}
              hint="10 komada ili manje"
              tone={facility && facility.lowStockMedicines.length > 0 ? "warning" : "default"}
            />
            <StatCard label="Nepročitana obaveštenja" value={facility?.unreadNotifications ?? "—"} loading={isLoading} icon={<LuBell />} to={paths.notifications} hint="Otvori obaveštenja" />
          </div>

          <div className="mt-6 grid items-start gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              {isLoading ? <Skeleton className="h-96" /> : <ActivityFeed activity={facility?.recentActivity ?? []} />}
            </div>
            <div className="space-y-6">
              {isLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <>
                  <LowStockList medicines={facility?.lowStockMedicines ?? []} />
                  <UpcomingEvents events={facility?.upcomingEvents ?? []} />
                  {facility && facility.staffByRole.length > 0 && <StaffOverview staff={facility.staffByRole} />}
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Pacijenti na smeštaju" value={personal?.activePatients ?? "—"} loading={isLoading} icon={<LuUsers />} to={paths.patients} hint="Otvori listu" />
            <StatCard label="Događaji (7 dana)" value={personal?.upcomingEvents.length ?? "—"} loading={isLoading} icon={<LuBell />} />
            <StatCard label="Nepročitana obaveštenja" value={personal?.unreadNotifications ?? "—"} loading={isLoading} icon={<LuBell />} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs transition hover:border-brand-200 hover:shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-lg text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  {a.icon}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-gray-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">{a.label}</span>
                  <span className="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">{a.description}</span>
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-6 grid items-start gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              {isLoading ? <Skeleton className="h-80" /> : <ActivityFeed title="Moji nedavni unosi" activity={personal?.recentActivity ?? []} />}
            </div>
            {isLoading ? <Skeleton className="h-64" /> : <UpcomingEvents events={personal?.upcomingEvents ?? []} />}
          </div>
        </>
      )}
    </>
  );
}
