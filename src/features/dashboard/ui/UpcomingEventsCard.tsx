import { UpcomingEvent } from "@features/dashboard/types";

const CALENDAR_BADGE: Record<string, string> = {
  Danger: "bg-error-500",
  Warning: "bg-warning-500",
  Success: "bg-success-500",
  Primary: "bg-brand-500",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function UpcomingEventsCard({ events }: { events: UpcomingEvent[] }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
        Predstojeći događaji (narednih 7 dana)
      </h3>
      {events.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Nema zakazanih događaja.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event._id} className="flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  CALENDAR_BADGE[event.calendar] || "bg-gray-400"
                }`}
              />
              <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
                {event.title}
              </span>
              <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                {formatDate(event.start)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
