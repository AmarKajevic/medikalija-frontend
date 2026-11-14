import { Suspense } from "react";
import { Navigate, NavLink, useParams } from "react-router";
import { useAuth } from "@app/providers/AuthContext";
import { paths } from "@app/paths";
import PageHeader from "@shared/ui/page/PageHeader";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import ErrorBoundary from "@shared/ui/feedback/ErrorBoundary";
import { catalogSectionsFor, type CatalogSection } from "./catalogSections";

// "Šabloni i cene": svi šabloni i cenovnici na jednoj stranici (umesto šest stavki u meniju).
// Levo izbor sekcije (na telefonu traka sa dugmadima), desno izabrana sekcija. Sekcija je u
// adresi (/templates/care), pa se link može poslati i dugme "nazad" radi kako se očekuje.
export default function CatalogPage() {
  const { section } = useParams<{ section?: string }>();
  const { user } = useAuth();
  const sections = catalogSectionsFor(user?.role);
  const active = sections.find((s) => s.id === section);

  // Bez sekcije (ili nedozvoljena/nepostojeća) → prva dostupna
  if (!active) return sections[0] ? <Navigate to={paths.catalogSection(sections[0].id)} replace /> : <Navigate to={paths.home} replace />;

  const groups = [...new Set(sections.map((s) => s.group))];
  const Section = active.component;

  return (
    <>
      <PageHeader title="Šabloni i cene" description="Šabloni koje osoblje koristi pri unosu i cenovnici koji se koriste u specifikaciji — sve na jednom mestu." />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav aria-label="Sekcije" className="lg:sticky lg:top-4 lg:self-start">
          {/* Telefon i tablet: horizontalna traka; desktop: vertikalni meni po grupama */}
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
            {sections.map((s) => (
              <li key={s.id} className="shrink-0">
                <SectionLink section={s} compact />
              </li>
            ))}
          </ul>
          <div className="hidden space-y-5 lg:block">
            {groups.map((g) => (
              <div key={g}>
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{g}</p>
                <ul className="space-y-0.5">
                  {sections
                    .filter((s) => s.group === g)
                    .map((s) => (
                      <li key={s.id}>
                        <SectionLink section={s} />
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <section aria-label={active.label} className="min-w-0">
          <ErrorBoundary resetKey={active.id}>
            <Suspense
              fallback={
                <div className="space-y-3">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-64" />
                </div>
              }
            >
              <Section />
            </Suspense>
          </ErrorBoundary>
        </section>
      </div>
    </>
  );
}

function SectionLink({ section: s, compact = false }: { section: CatalogSection; compact?: boolean }) {
  return (
    <NavLink
      to={paths.catalogSection(s.id)}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-lg text-left transition focus:outline-hidden focus-visible:ring-3 focus-visible:ring-brand-500/30 ${
          compact ? "border px-3 py-1.5" : "px-3 py-2"
        } ${
          isActive
            ? compact
              ? "border-brand-400 bg-brand-50 dark:border-brand-500/60 dark:bg-brand-500/10"
              : "bg-brand-50 dark:bg-brand-500/10"
            : compact
              ? "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
              : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`flex shrink-0 items-center justify-center rounded-md ${compact ? "h-6 w-6 text-sm" : "h-8 w-8 text-base"} ${s.tone}`}>{s.icon}</span>
          <span className="min-w-0">
            <span className={`block text-sm font-medium ${isActive ? "text-brand-700 dark:text-brand-300" : "text-gray-800 dark:text-white/90"} ${compact ? "whitespace-nowrap" : ""}`}>
              {s.label}
            </span>
            {!compact && <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{s.hint}</span>}
          </span>
        </>
      )}
    </NavLink>
  );
}
