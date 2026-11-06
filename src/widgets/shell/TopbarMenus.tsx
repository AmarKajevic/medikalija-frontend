import { useEffect, useRef, useState, ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { LuBell, LuCheckCheck, LuLogOut, LuMonitor, LuMoon, LuSun } from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import { ThemePreference, useTheme } from "@app/providers/ThemeContext";
import { isManager, paths } from "@app/paths";
import Avatar from "@shared/ui/avatar/Avatar";
import ScriptSwitch from "@shared/ui/ScriptSwitch";
import { roleLabel } from "@shared/lib/format";
import { relativeTime, useMarkAllNotificationsRead, useNotifications } from "@features/notifications/hooks";

function Popover({ trigger, children, width = "w-80" }: { trigger: (toggle: () => void, open: boolean) => ReactNode; children: (close: () => void) => ReactNode; width?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      {trigger(() => setOpen((v) => !v), open)}
      {open && (
        <div className={`absolute right-0 top-full z-50 mt-2 ${width} max-w-[calc(100vw-1.5rem)] rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900`}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

const iconButton =
  "relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white";

export function NotificationsMenu() {
  const { user } = useAuth();
  const { data = [] } = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const unread = data.filter((n) => !n.isRead).length;

  return (
    <Popover
      trigger={(toggle) => (
        <button type="button" onClick={toggle} className={iconButton} aria-label={`Obaveštenja${unread ? ` (${unread} nepročitanih)` : ""}`}>
          <LuBell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Obaveštenja</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                <LuCheckCheck className="h-3.5 w-3.5" /> Označi sve kao pročitano
              </button>
            )}
          </div>
          <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
            {data.length === 0 && <li className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Nema obaveštenja.</li>}
            {data.slice(0, 8).map((n) => (
              <li key={n._id} className="flex gap-3 px-4 py-3">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-transparent" : "bg-brand-500"}`} />
                <div className="min-w-0">
                  <p className={`text-sm ${n.isRead ? "text-gray-600 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>{n.message}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{relativeTime(n.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
          {isManager(user?.role) && (
            <Link
              to={paths.notifications}
              onClick={close}
              className="block border-t border-gray-100 px-4 py-2.5 text-center text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            >
              Sva obaveštenja
            </Link>
          )}
        </>
      )}
    </Popover>
  );
}

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string; icon: ReactNode }> = [
  { value: "light", label: "Svetla", icon: <LuSun className="h-4 w-4" /> },
  { value: "dark", label: "Tamna", icon: <LuMoon className="h-4 w-4" /> },
  { value: "system", label: "Sistem", icon: <LuMonitor className="h-4 w-4" /> },
];

export function UserMenu() {
  const { user, logout } = useAuth();
  const { preference, setPreference } = useTheme();
  const navigate = useNavigate();

  return (
    <Popover
      width="w-64"
      trigger={(toggle) => (
        <button type="button" onClick={toggle} className="flex items-center gap-2.5 rounded-lg p-1 pr-2 transition hover:bg-gray-100 dark:hover:bg-white/5" aria-label="Korisnički meni">
          <Avatar name={user?.name} lastName={user?.lastName} size="sm" />
          <span className="hidden text-left leading-tight md:block">
            <span className="block text-sm font-medium text-gray-900 dark:text-white">
              {user?.name} {user?.lastName}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">{roleLabel(user?.role)}</span>
          </span>
        </button>
      )}
    >
      {(close) => (
        <div className="p-1.5">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
              {user?.name} {user?.lastName}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
          <div className="my-1 h-px bg-gray-100 dark:bg-gray-800" />
          <p className="px-3 pb-1 pt-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Tema</p>
          <div className="mx-1.5 mb-1.5 grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-white/[0.04]">
            {THEME_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setPreference(o.value)}
                aria-pressed={preference === o.value}
                className={`flex flex-col items-center gap-1 rounded-md py-1.5 text-[11px] font-medium transition ${
                  preference === o.value
                    ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {o.icon}
                {o.label}
              </button>
            ))}
          </div>
          <p className="px-3 pb-1 pt-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Pismo</p>
          <ScriptSwitch className="mx-1.5 mb-1.5" />
          <div className="my-1 h-px bg-gray-100 dark:bg-gray-800" />
          <button
            type="button"
            onClick={async () => {
              close();
              await logout();
              navigate(paths.signIn);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <LuLogOut className="h-4 w-4 text-gray-400" /> Odjavi se
          </button>
        </div>
      )}
    </Popover>
  );
}
