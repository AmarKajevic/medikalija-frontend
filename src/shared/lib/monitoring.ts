// Prijava grešaka iz browsera u Sentry — samo ako je VITE_SENTRY_DSN podešen.
// Biblioteka se učitava tek tada (bez DSN-a ne ulazi u početno učitavanje aplikacije).
type SentryModule = typeof import("@sentry/react");

let sentry: SentryModule | null = null;

export async function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || import.meta.env.MODE === "test") return;
  try {
    sentry = await import("@sentry/react");
    // Bez ličnih podataka i bez snimanja ekrana: aplikacija prikazuje podatke pacijenata
    sentry.init({ dsn, environment: import.meta.env.MODE, sendDefaultPii: false, tracesSampleRate: 0 });
  } catch {
    sentry = null;
  }
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (sentry) sentry.captureException(error, { extra: context });
  else if (import.meta.env.DEV) console.error(error);
}
