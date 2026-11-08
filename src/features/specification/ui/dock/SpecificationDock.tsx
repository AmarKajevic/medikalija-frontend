import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { LuArrowUpRight, LuClipboardList, LuX } from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import { isManager, paths } from "@app/paths";
import SpecificationWorkspaceDialog from "@features/specification/ui/workspace/SpecificationWorkspaceDialog";
import { DockContext } from "./useSpecificationDock";

// Specifikacija "u toku": kad se prozor specifikacije skloni (X ili Esc), ostaje mala
// kartica u donjem desnom uglu na svakoj stranici. "Nastavi" vraća tačno tamo gde se
// stalo (kartica, korak, nesačuvan obračun) — kao sklopljen nacrt u Gmail-u.
interface Docked {
  patientId: string;
  patientName: string;
  /** Čija je (drugi korisnik u istom browseru ne nasleđuje tuđu specifikaciju) */
  userId: string;
}

const STORAGE_KEY = "spec-dock";

const load = (): Docked | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Docked) : null;
  } catch {
    return null;
  }
};

export function SpecificationDockProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?._id ? String(user._id) : "";
  const [docked, setDocked] = useState<Docked | null>(load);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (docked) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(docked));
    else sessionStorage.removeItem(STORAGE_KEY);
  }, [docked]);

  const openSpecification = useCallback(
    ({ patientId, patientName }: { patientId: string; patientName: string }) => {
      setDocked({ patientId, patientName, userId });
      setOpen(true);
    },
    [userId]
  );
  const api = useMemo(() => ({ openSpecification }), [openSpecification]);

  // Samo uprava radi specifikacije, i samo svoju (posle odjave/prijave drugog korisnika se ne prikazuje)
  const active = docked && isManager(user?.role) && docked.userId === userId ? docked : null;

  return (
    <DockContext.Provider value={api}>
      {children}
      {active && (
        <>
          <SpecificationWorkspaceDialog
            key={active.patientId}
            open={open}
            onClose={() => setOpen(false)}
            patientId={active.patientId}
            patientName={active.patientName}
            keepMounted
          />
          {!open && (
            <div
              role="region"
              aria-label="Specifikacija u toku"
              className="fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-gray-200 bg-white py-2.5 pl-3 pr-2 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 sm:bottom-6 sm:right-6"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                <LuClipboardList className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Specifikacija u toku</p>
                <Link
                  to={paths.patient(active.patientId)}
                  title="Profil pacijenta"
                  className="flex items-center gap-1 truncate text-sm font-semibold text-gray-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                >
                  <span className="truncate">{active.patientName}</span>
                  <LuArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="ml-1 h-9 shrink-0 rounded-lg bg-brand-500 px-3 text-sm font-medium text-white transition hover:bg-brand-600"
              >
                Nastavi
              </button>
              <button
                type="button"
                onClick={() => setDocked(null)}
                aria-label="Zatvori specifikaciju u toku"
                title="Zatvori (sačuvano ostaje sačuvano)"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-white"
              >
                <LuX className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </DockContext.Provider>
  );
}
