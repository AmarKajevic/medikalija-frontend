import { useEffect, useRef, useState } from "react";

// "Sign in with Google" preko Google Identity Services. Google vraća potpisan
// ID token (credential), a server ga proverava i prijavljuje samo pozvane korisnike.

interface GoogleIdApi {
  initialize: (opts: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: "popup"; auto_select?: boolean; use_fedcm_for_prompt?: boolean }) => void;
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

const SCRIPT = "https://accounts.google.com/gsi/client";
let loading: Promise<void> | null = null;

function loadScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("Google skripta nije učitana."));
    };
    document.head.appendChild(s);
  });
  return loading;
}

interface Props {
  clientId: string;
  onCredential: (credential: string) => void;
  text?: "signin_with" | "continue_with";
}

export default function GoogleSignInButton({ clientId, onCredential, text = "continue_with" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  callback.current = onCredential;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.google) return;
        window.google.accounts.id.initialize({ client_id: clientId, callback: (r) => callback.current(r.credential), ux_mode: "popup" });
        window.google.accounts.id.renderButton(ref.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text,
          logo_alignment: "center",
          locale: "sr",
          width: ref.current.offsetWidth || 320,
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [clientId, text]);

  if (failed) return <p className="text-center text-xs text-gray-500">Google prijava trenutno nije dostupna.</p>;
  // Google iscrtava svoje dugme (ne preslovljava se — Google ga prikazuje na svom jeziku)
  return <div ref={ref} data-no-translit className="flex min-h-10 w-full justify-center" aria-label="Prijava preko Google-a" />;
}
