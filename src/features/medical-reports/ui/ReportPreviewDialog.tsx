import { LuCircleAlert, LuDownload, LuPrinter } from "react-icons/lu";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";

interface Props {
  /** Adresa napravljenog PDF-a (blob:); null = zatvoren */
  url: string | null;
  /** Nepotpisan izveštaj se štampa sa oznakom NACRT */
  draft?: boolean;
  onClose: () => void;
  onDownload: () => void;
  onPrint: () => void;
  busy: "preview" | "download" | "print" | null;
}

// Pregled lekarskog izveštaja pre štampe: tačno onaj PDF koji će biti odštampan ili preuzet.
export default function ReportPreviewDialog({ url, draft = false, onClose, onDownload, onPrint, busy }: Props) {
  return (
    <Dialog
      open={!!url}
      onClose={onClose}
      size="full"
      title="Pregled lekarskog izveštaja"
      description="Ovako će izgledati odštampan izveštaj."
      scrollBody={false}
      footer={
        <>
          {draft && (
            <p className="mr-auto flex items-center gap-1.5 text-sm text-warning-700 dark:text-warning-400">
              <LuCircleAlert className="h-4 w-4 shrink-0" />
              Izveštaj nije potpisan — štampa se sa oznakom NACRT.
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
      {url && <iframe src={url} title="Lekarski izveštaj (PDF)" className="h-full w-full flex-1 border-0 bg-gray-100 dark:bg-gray-800" />}
    </Dialog>
  );
}
