import { Link, NavLink, useLocation } from "react-router";
import { LuPanelLeftClose, LuPanelLeftOpen, LuX } from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import { navigationFor, NavItem } from "@app/navigation";
import { isManager, paths } from "@app/paths";
import { usePendingSummary } from "@features/nurse-entries/model";
import { useFacility } from "@entities/facility/facility";
import BrandMark from "./BrandMark";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function isActive(item: NavItem, pathname: string) {
  if (item.to === "/") return pathname === "/";
  return item.matchPrefix ? pathname === item.to || pathname.startsWith(`${item.to}/`) : pathname === item.to;
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const groups = navigationFor(user?.role);
  const pending = usePendingSummary(isManager(user?.role)).data?.total ?? 0;

  return (
    <nav aria-label="Glavna navigacija" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {groups.map((group, gi) => (
        <div key={group.label ?? gi}>
          {group.label &&
            (collapsed ? (
              <div className="mx-3 mb-2 h-px bg-gray-200 dark:bg-gray-800" />
            ) : (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group.label}
              </p>
            ))}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item, pathname);
              const count = item.badge === "approvals" ? pending : 0;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onNavigate}
                    title={collapsed ? (count ? `${item.label} (${count})` : item.label) : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`group flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
                      collapsed ? "justify-center px-0" : ""
                    } ${
                      active
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
                    }`}
                  >
                    <span
                      className={`relative text-[18px] ${
                        active ? "text-brand-600 dark:text-brand-400" : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"
                      }`}
                    >
                      {item.icon}
                      {collapsed && count > 0 && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-warning-500" aria-hidden="true" />}
                    </span>
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!collapsed && count > 0 && (
                      <span className="rounded-full bg-warning-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-warning-700 dark:bg-warning-500/20 dark:text-warning-300" aria-label={`${count} čeka`}>
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const { facility } = useFacility();
  return (
    <>
      {/* Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-gray-200 bg-white transition-[width] duration-200 dark:border-gray-800 dark:bg-gray-900 lg:flex ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <div className={`flex h-16 shrink-0 items-center border-b border-gray-100 dark:border-gray-800 ${collapsed ? "justify-center" : "px-5"}`}>
          <Link to={paths.home} aria-label={`${facility.name} — početna`}>
            <BrandMark collapsed={collapsed} />
          </Link>
        </div>
        <NavList collapsed={collapsed} />
        <div className="border-t border-gray-100 p-3 dark:border-gray-800">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Proširi meni" : "Skupi meni"}
            className={`flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white ${
              collapsed ? "justify-center px-0" : ""
            }`}
          >
            {collapsed ? <LuPanelLeftOpen className="h-[18px] w-[18px]" /> : <LuPanelLeftClose className="h-[18px] w-[18px]" />}
            {!collapsed && "Skupi meni"}
          </button>
        </div>
      </aside>

      {/* Mobilni: fioka preko sadržaja */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Meni">
          <div className="absolute inset-0 bg-gray-900/50" onClick={onCloseMobile} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-theme-xl dark:bg-gray-900">
            <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5 dark:border-gray-800">
              <BrandMark />
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Zatvori meni"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>
            <NavList collapsed={false} onNavigate={onCloseMobile} />
          </aside>
        </div>
      )}
    </>
  );
}
