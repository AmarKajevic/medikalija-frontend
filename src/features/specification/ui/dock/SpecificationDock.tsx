import { lazy, ReactNode, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { LuArrowUpRight, LuClipboardList, LuX } from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import { isManager, paths } from "@app/paths";
import { PageLoader } from "@shared/ui/feedback/Spinner";
import { loadSpecificationDialog } from "@app/routeLoaders";

// Prozor specifikacije je velik (koraci, obračun, forme) i treba samo upravi — učitava
// se tek kad se specifikacija otvori, ne sa svakom stranicom
const SpecificationWorkspaceDialog = lazy(loadSpecificationDialog);
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

// Dok se kod prozora učitava (samo prvi put)
const LoadingOverlay = () => (
  <div className="fixed inset-0 z-99999 flex items-center justify-center bg-gray-900/30">
    <div className="rounded-2xl bg-white px-6 py-4 shadow-theme-xl dark:bg-gray-900">
      <PageLoader label="Otvaranje specifikacije..." />
    </div>
  </div>
);

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
          <Suspense fallback={open ? <LoadingOverlay /> : null}>
            <SpecificationWorkspaceDialog
              key={active.patientId}
              open={open}
              onClose={() => setOpen(false)}
              patientId={active.patientId}
              patientName={active.patientName}
              keepMounted
            />
          </Suspense>
          {!open && (
            <div
              role="region"
              aria-label="Specifikacija u toku"
              className="fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-2rem)] items-center gap-3.5 rounded-2xl border-2 border-brand-500 bg-brand-500 py-3 pl-3.5 pr-2.5 text-white shadow-theme-xl ring-4 ring-brand-500/20 sm:bottom-6 sm:right-6"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <LuClipboardList className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Specifikacija u toku</p>
                <Link
                  to={paths.patient(active.patientId)}
                  title="Profil pacijenta"
                  className="flex items-center gap-1 truncate text-base font-semibold text-white hover:underline"
                >
                  <span className="truncate">{active.patientName}</span>
                  <LuArrowUpRight className="h-4 w-4 shrink-0 opacity-80" />
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="ml-1 h-11 shrink-0 rounded-xl bg-white px-5 text-base font-semibold text-brand-700 shadow-theme-xs transition hover:bg-brand-50"
              >
                Nastavi specifikaciju
              </button>
              <button
                type="button"
                onClick={() => setDocked(null)}
                aria-label="Zatvori specifikaciju u toku"
                title="Zatvori (sačuvano ostaje sačuvano)"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}
    </DockContext.Provider>
  );
}
