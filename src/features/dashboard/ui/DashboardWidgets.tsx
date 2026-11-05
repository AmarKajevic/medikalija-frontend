import { Link } from "react-router";
import { LuActivity, LuCalendarDays, LuFlaskConical, LuPackage, LuPill, LuStethoscope, LuTriangleAlert, LuUsers } from "react-icons/lu";
import { Card, CardHeader } from "@shared/ui/card/Card";
import EmptyState from "@shared/ui/feedback/EmptyState";
import Badge from "@shared/ui/badge/Badge";
import Avatar from "@shared/ui/avatar/Avatar";
import { formatQty, roleLabel } from "@shared/lib/format";
import { paths } from "@app/paths";
import { ActivityItem, LowStockMedicine, UpcomingEvent } from "@features/dashboard/types";
import { eventColorClass } from "@features/calendar/colors";
import { relativeTime } from "@features/notifications/hooks";

const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  Dijagnoza: <LuStethoscope />,
  Lek: <LuPill />,
  Artikal: <LuPackage />,
  Analiza: <LuFlaskConical />,
};

// Događaji su celodnevni i čuvaju se kao UTC ponoć — prikazuje se samo datum, u UTC-u
const formatEventDate = (iso: string) =>
  new Date(iso).toLocaleDateString("sr-Latn-RS", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export function ActivityFeed({ activity, title = "Nedavne aktivnosti" }: { activity: ActivityItem[]; title?: string }) {
  return (
    <Card>
      <CardHeader title={title} icon={<LuActivity />} />
      {activity.length === 0 ? (
        <EmptyState compact title="Još nema aktivnosti" description="Unosi lekova, artikala i dijagnoza pojaviće se ovde." />
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {activity.map((item, i) => (
            <li key={`${item.createdAt}-${i}`} className="flex items-start gap-3 px-5 py-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                {ACTIVITY_ICON[item.type] ?? <LuActivity />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  <span className="font-medium">{item.description}</span>
                  {item.patient && <span className="text-gray-500 dark:text-gray-400"> · {item.patient}</span>}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {item.type}
                  {item.createdBy && ` · ${item.createdBy.name} ${item.createdBy.lastName ?? ""} (${roleLabel(item.createdBy.role)})`}
                </p>
              </div>
              <time className="shrink-0 text-xs text-gray-400" dateTime={item.createdAt}>
                {relativeTime(item.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function UpcomingEvents({ events }: { events: UpcomingEvent[] }) {
  return (
    <Card>
      <CardHeader
        title="Narednih 7 dana"
        icon={<LuCalendarDays />}
        actions={
          <Link to={paths.calendar} className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Kalendar
          </Link>
        }
      />
      {events.length === 0 ? (
        <EmptyState compact title="Nema zakazanih događaja" />
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {events.map((e) => (
            <li key={e._id} className="flex items-center gap-3 px-5 py-3">
              <span className={`h-2 w-2 shrink-0 rounded-full ${eventColorClass(e.calendar)}`} />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-800 dark:text-gray-200">{e.title}</span>
              <time className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{formatEventDate(e.start)}</time>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function LowStockList({ medicines }: { medicines: LowStockMedicine[] }) {
  return (
    <Card>
      <CardHeader
        title="Niske zalihe lekova"
        icon={<LuTriangleAlert />}
        actions={
          <Link to={paths.medicines} className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Svi lekovi
          </Link>
        }
      />
      {medicines.length === 0 ? (
        <EmptyState compact title="Sve zalihe su u redu" />
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {medicines.map((m) => (
            <li key={m._id}>
              <Link to={paths.medicine(m._id)} className="flex items-center justify-between gap-3 px-5 py-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                <span className="truncate text-sm text-gray-800 dark:text-gray-200">{m.name}</span>
                <Badge size="sm" color={m.quantity <= 0 ? "error" : "warning"}>
                  {m.quantity <= 0 ? "Nema na stanju" : `${formatQty(m.quantity)} kom.`}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function StaffOverview({ staff }: { staff: { role: string; count: number }[] }) {
  const total = staff.reduce((s, r) => s + r.count, 0);
  return (
    <Card>
      <CardHeader
        title="Osoblje"
        description={`${total} aktivnih naloga`}
        icon={<LuUsers />}
        actions={
          <Link to={paths.users} className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Korisnici
          </Link>
        }
      />
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {staff.map((r) => (
          <li key={r.role} className="flex items-center gap-3 px-5 py-2.5">
            <Avatar name={roleLabel(r.role)} size="xs" />
            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{roleLabel(r.role)}</span>
            <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white">{r.count}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
