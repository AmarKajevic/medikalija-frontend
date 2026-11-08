import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { LuMenu } from "react-icons/lu";
import Sidebar from "./Sidebar";
import GlobalSearch from "./GlobalSearch";
import { NotificationsMenu, UserMenu } from "./TopbarMenus";
import BrandMark from "./BrandMark";
import IdleLogout from "@features/auth/ui/IdleLogout";
import { SpecificationDockProvider } from "@features/specification/ui/dock/SpecificationDock";

const COLLAPSE_KEY = "sidebar-collapsed";

// Okvir aplikacije: bočni meni + gornja traka + sadržaj stranice.
export default function AppShell() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "1");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  // Nova stranica počinje od vrha
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    // Specifikacija u toku ostaje dostupna na svakoj stranici
    <SpecificationDockProvider>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <a
        href="#main"
        className="sr-only z-[100] rounded-lg bg-white px-3 py-2 text-sm font-medium shadow focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Preskoči na sadržaj
      </a>

      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`transition-[padding] duration-200 ${collapsed ? "lg:pl-[72px]" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/85 px-4 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/85 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Otvori meni"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 lg:hidden"
          >
            <LuMenu className="h-5 w-5" />
          </button>
          <span className="lg:hidden">
            <BrandMark collapsed />
          </span>
          <div className="flex flex-1 justify-center lg:justify-start">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-1">
            <NotificationsMenu />
            <UserMenu />
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
          <IdleLogout />
        </main>
      </div>
    </div>
    </SpecificationDockProvider>
  );
}
