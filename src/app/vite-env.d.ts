/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Samo ako API nije iza /api na istom sajtu */
  readonly VITE_API_URL?: string;
  /** Sentry DSN za greške u browseru (opciono) */
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
