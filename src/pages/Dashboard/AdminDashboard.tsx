import { Link } from "react-router";
import { FaUsers, FaPrescriptionBottleAlt, FaBell, FaUserMd } from "react-icons/fa";
import { useDashboardStats } from "@features/dashboard/hooks/useDashboardStats";
import { FacilityDashboardStats } from "@features/dashboard/types";
import StatCard from "@features/dashboard/ui/StatCard";
import StaffByRoleChart from "@features/dashboard/ui/StaffByRoleChart";
import UpcomingEventsCard from "@features/dashboard/ui/UpcomingEventsCard";
import LowStockMedicinesCard from "@features/dashboard/ui/LowStockMedicinesCard";
import RecentActivityCard from "@features/dashboard/ui/RecentActivityCard";
import { ADMIN_QUICK_LINKS } from "@shared/config/quickLinks";

function AdminDashboard() {
  const { data, isLoading, isError } = useDashboardStats();
  const stats = data?.scope === "facility" ? (data as FacilityDashboardStats) : null;

  const links = ADMIN_QUICK_LINKS;

  return (
    <div className="p-6 space-y-6">
      {isError && (
        <div className="rounded-2xl border border-error-200 bg-error-50 p-4 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400">
          Statistika trenutno nije dostupna. Pokušajte kasnije.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Aktivni pacijenti"
          value={isLoading ? "…" : stats?.patients.active ?? "—"}
          icon={<FaUsers />}
          color="brand"
        />
        <StatCard
          label="Osoblje"
          value={
            isLoading
              ? "…"
              : stats?.staffByRole.reduce((sum, r) => sum + r.count, 0) ?? "—"
          }
          icon={<FaUserMd />}
          color="success"
        />
        <StatCard
          label="Lekovi na niskim zalihama"
          value={isLoading ? "…" : stats?.lowStockMedicines.length ?? "—"}
          icon={<FaPrescriptionBottleAlt />}
          color="warning"
        />
        <StatCard
          label="Nepročitane notifikacije"
          value={isLoading ? "…" : stats?.unreadNotifications ?? "—"}
          icon={<FaBell />}
          color="error"
        />
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <StaffByRoleChart staffByRole={stats.staffByRole} />
            <LowStockMedicinesCard medicines={stats.lowStockMedicines} />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <UpcomingEventsCard events={stats.upcomingEvents} />
            <RecentActivityCard activity={stats.recentActivity} />
          </div>
        </>
      )}

      <div>
        <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
          Brzi pristup
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {links.map((link, index) => (
            <Link
              key={index}
              to={link.to}
              className="flex flex-col items-center justify-center p-6 bg-white/80 border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="text-4xl mb-3 text-gray-700 dark:text-gray-300">{link.icon}</div>
              <span className="text-center font-medium text-gray-800 dark:text-white/90">
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
