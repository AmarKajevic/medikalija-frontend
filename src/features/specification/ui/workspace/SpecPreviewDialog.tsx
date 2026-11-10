import { LuCircleAlert, LuDownload, LuPrinter } from "react-icons/lu";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";

interface Props {
  /** Adresa napravljenog PDF-a (blob:); null = zatvoren */
  url: string | null;
  onClose: () => void;
  onDownload: () => void;
  onPrint: () => void;
  busy: "preview" | "download" | "print" | null;
  /** Unosi osoblja koji još čekaju odobrenje (nisu u specifikaciji) */
  pendingCount?: number;
}

// Pregled specifikacije pre štampe: tačno onaj PDF koji će biti odštampan ili preuzet.
export default function SpecPreviewDialog({ url, onClose, onDownload, onPrint, busy, pendingCount = 0 }: Props) {
  return (
    <Dialog
      open={!!url}
      onClose={onClose}
      size="full"
      title="Pregled specifikacije"
      description="Ovako će izgledati odštampana specifikacija."
      scrollBody={false}
      footer={
        <>
          {pendingCount > 0 && (
            <p className="mr-auto flex items-center gap-1.5 text-sm text-warning-700 dark:text-warning-400">
              <LuCircleAlert className="h-4 w-4 shrink-0" />
              {pendingCount === 1 ? "1 unos osoblja još čeka odobrenje" : `${pendingCount} unosa osoblja još čeka odobrenje`} i nije u specifikaciji.
            </p>
          )}
          <Button variant="outline" startIcon={<LuDownload className="h-4 w-4" />} loading={busy === "download"} onClick={onDownload}>
            Skini PDF
          </Button>
          <Button startIcon={<LuPrinter className="h-4 w-4" />} loading={busy === "print"} onClick={onPrint}>
            Štampaj
          </Button>
        </>
      }
    >
      {url && <iframe src={url} title="Specifikacija (PDF)" className="h-full w-full flex-1 border-0 bg-gray-100 dark:bg-gray-800" />}
    </Dialog>
  );
}
