import { ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { LuX } from "react-icons/lu";

type DialogSize = "sm" | "md" | "lg" | "xl" | "full";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  /** Dodatne akcije u zaglavlju, levo od dugmeta za zatvaranje. */
  headerActions?: ReactNode;
  footer?: ReactNode;
  size?: DialogSize;
  children: ReactNode;
  /** Ako je false, telo dijaloga ne skroluje samo (sadržaj sam upravlja skrolom). */
  scrollBody?: boolean;
  /** Zatvoren dijalog ostaje u memoriji (sakriven), pa se po ponovnom otvaranju nastavlja gde se stalo */
  keepMounted?: boolean;
}

const sizeClasses: Record<DialogSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  full: "max-w-[1760px] h-[calc(100dvh-1rem)] sm:h-[calc(100dvh-2rem)]",
};

// Broj trenutno otvorenih dijaloga, da zatvaranje unutrašnjeg (npr. potvrde
// brisanja) ne vrati skrol stranici dok je spoljašnji još otvoren.
let openDialogs = 0;

export default function Dialog({
  open,
  onClose,
  title,
  description,
  headerActions,
  footer,
  size = "md",
  children,
  scrollBody = true,
  keepMounted = false,
}: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    openDialogs += 1;
    document.body.style.overflow = "hidden";
    // Aplikacija ispod dijaloga ne prima fokus ni klikove i skrivena je čitačima ekrana
    document.getElementById("root")?.setAttribute("inert", "");
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      // Esc zatvara samo najgornji dijalog
      if (e.key === "Escape" && panelRef.current?.dataset.top === "true") {
        e.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      openDialogs -= 1;
      if (openDialogs === 0) {
        document.body.style.overflow = "";
        document.getElementById("root")?.removeAttribute("inert");
      }
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const panels = document.querySelectorAll<HTMLElement>("[data-dialog-panel]");
    panels.forEach((p, i) => (p.dataset.top = String(i === panels.length - 1)));
  });

  if (!open && !keepMounted) return null;

  return createPortal(
    <div className={`fixed inset-0 z-99999 flex items-center justify-center p-2 ${size === "full" ? "sm:p-4" : "sm:p-8"} ${open ? "" : "hidden"}`} aria-hidden={open ? undefined : true}>
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        data-dialog-panel={open ? "" : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`relative flex max-h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-theme-xl outline-none dark:bg-gray-900 ${sizeClasses[size]}`}
      >
        {(title || headerActions) && (
          <div className="flex items-start gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 id={titleId} className="truncate text-lg font-semibold text-gray-900 dark:text-white/90">
                  {title}
                </h2>
              )}
              {description && <div className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</div>}
            </div>
            {headerActions && <div className="flex shrink-0 items-center gap-2">{headerActions}</div>}
            <button
              type="button"
              onClick={onClose}
              aria-label="Zatvori"
              className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <LuX className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className={`min-h-0 flex-1 ${scrollBody ? "overflow-y-auto px-5 py-5 sm:px-6" : "flex flex-col"}`}>
          {children}
        </div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-800 dark:bg-white/[0.02] sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmText?: string;
  loading?: boolean;
  variant?: "danger" | "primary";
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Potvrdi",
  loading = false,
  variant = "danger",
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg px-3.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/5"
          >
            Otkaži
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`h-9 rounded-lg px-3.5 text-sm font-medium text-white disabled:opacity-50 ${
              variant === "danger" ? "bg-error-500 hover:bg-error-600" : "bg-brand-500 hover:bg-brand-600"
            }`}
          >
            {loading ? "U toku..." : confirmText}
          </button>
        </>
      }
    >
      {description && <div className="text-sm text-gray-600 dark:text-gray-400">{description}</div>}
    </Dialog>
  );
}
