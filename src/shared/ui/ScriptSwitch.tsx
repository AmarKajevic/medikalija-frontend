import { useScript } from "@shared/lib/scriptContext";
import type { Script } from "@shared/lib/script";

// Nazivi pisama se uvek prikazuju u svom pismu (ne preslovljavaju se).
const OPTIONS: Array<{ value: Script; label: string }> = [
  { value: "latin", label: "Latinica" },
  { value: "cyrillic", label: "Ћирилица" },
];

export default function ScriptSwitch({ className = "" }: { className?: string }) {
  const { script, setScript } = useScript();
  return (
    <div role="group" aria-label="Pismo" data-no-translit className={`grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-white/[0.04] ${className}`}>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          lang={o.value === "cyrillic" ? "sr-Cyrl" : "sr-Latn"}
          aria-pressed={script === o.value}
          onClick={() => setScript(o.value)}
          className={`rounded-md px-2 py-1.5 text-xs font-medium transition ${
            script === o.value ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white" : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
