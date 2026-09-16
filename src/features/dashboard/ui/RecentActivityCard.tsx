import { ActivityItem } from "@features/dashboard/types";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function RecentActivityCard({ activity }: { activity: ActivityItem[] }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
        Nedavne aktivnosti
      </h3>
      {activity.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Nema nedavnih aktivnosti.</p>
      ) : (
        <ul className="space-y-4">
          {activity.map((item, index) => (
            <li key={index} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {item.type}
                  </span>{" "}
                  — {item.description}
                  {item.patient && (
                    <span className="text-gray-500 dark:text-gray-400"> ({item.patient})</span>
                  )}
                </p>
                {item.createdBy && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {item.createdBy.name} {item.createdBy.lastName}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                {formatDate(item.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
