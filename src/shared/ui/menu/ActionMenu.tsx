import { ReactNode, useEffect, useRef, useState } from "react";
import { Link } from "react-router";

export interface ActionMenuItem {
  label: string;
  icon?: ReactNode;
  to?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  /** Linija razdvajanja iznad stavke */
  separated?: boolean;
}

interface ActionMenuProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  items: ActionMenuItem[];
  align?: "left" | "right";
}

export default function ActionMenu({ trigger, items, align = "right" }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemClass = (item: ActionMenuItem) =>
    `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition disabled:opacity-50 ${
      item.danger
        ? "text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10"
        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
    }`;

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          role="menu"
          className={`absolute z-50 mt-2 min-w-56 rounded-xl border border-gray-200 bg-white p-1.5 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item) => (
            <div key={item.label}>
              {item.separated && <div className="my-1 h-px bg-gray-100 dark:bg-gray-800" />}
              {item.to ? (
                <Link role="menuitem" to={item.to} className={itemClass(item)} onClick={() => setOpen(false)}>
                  {item.icon && <span className="text-base text-gray-400">{item.icon}</span>}
                  {item.label}
                </Link>
              ) : (
                <button
                  role="menuitem"
                  type="button"
                  disabled={item.disabled}
                  className={itemClass(item)}
                  onClick={() => {
                    setOpen(false);
                    item.onClick?.();
                  }}
                >
                  {item.icon && <span className={`text-base ${item.danger ? "" : "text-gray-400"}`}>{item.icon}</span>}
                  {item.label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
