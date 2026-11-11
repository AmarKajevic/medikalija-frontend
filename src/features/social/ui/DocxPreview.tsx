import { useEffect, useRef, useState } from "react";
import { LuDownload, LuPrinter } from "react-icons/lu";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import { PageLoader } from "@shared/ui/feedback/Spinner";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { downloadBlob } from "@features/social/lib/wordTemplate";

/** Word dokument prikazan kao stranice (docx-preview se učitava tek kad zatreba) */
export function DocxPreview({ file, className = "" }: { file: Blob | ArrayBuffer | null; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const el = ref.current;
    if (!el || !file) return;
    let cancelled = false;
    setState("loading");
    import("docx-preview")
      .then(({ renderAsync }) => {
        el.innerHTML = "";
        return renderAsync(file, el, undefined, { inWrapper: true, breakPages: true, ignoreLastRenderedPageBreak: true, className: "docx" });
      })
      .then(() => !cancelled && setState("ready"))
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <div className={`relative overflow-auto rounded-lg bg-gray-100 dark:bg-gray-800 ${className}`}>
      {state === "loading" && <PageLoader label="Pripremam pregled..." />}
      {state === "error" && <ErrorState message="Pregled nije moguć, ali dokument možete preuzeti." />}
      <div ref={ref} data-docx-preview className={state === "ready" ? "" : "hidden"} />
    </div>
  );
}

/** Štampa prikazanog dokumenta: kopija stranica i stilova u skriven okvir, pa dijalog za štampu */
function printPreview(container: HTMLElement | null, title: string) {
  if (!container) return;
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${title.replace(/</g, "&lt;")}</title>` +
      "<style>@page{margin:0}body{margin:0}.docx-wrapper{background:none!important;padding:0!important}.docx-wrapper>section.docx{box-shadow:none!important;margin:0!important}</style>" +
      `</head><body>${container.innerHTML}</body></html>`
  );
  doc.close();
  frame.contentWindow!.focus();
  frame.contentWindow!.print();
  setTimeout(() => frame.remove(), 1000);
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  file: Blob | null;
  fileName: string;
}

// Pregled popunjenog dokumenta pre preuzimanja ili štampe.
export default function DocxPreviewDialog({ open, onClose, title, description, file, fileName }: DialogProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="full"
      title={title}
      description={description}
      scrollBody={false}
      footer={
        <>
          <Button variant="outline" size="sm" startIcon={<LuPrinter className="h-4 w-4" />} onClick={() => printPreview(wrapper.current?.querySelector("[data-docx-preview]") as HTMLElement | null, fileName)} disabled={!file}>
            Štampaj
          </Button>
          <Button size="sm" startIcon={<LuDownload className="h-4 w-4" />} onClick={() => file && downloadBlob(file, fileName)} disabled={!file}>
            Preuzmi Word
          </Button>
        </>
      }
    >
      <div ref={wrapper} className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
        <DocxPreview file={file} className="min-h-0 flex-1" />
      </div>
    </Dialog>
  );
}
