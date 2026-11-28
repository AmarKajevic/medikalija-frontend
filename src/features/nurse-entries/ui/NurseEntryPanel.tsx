import { useState } from "react";
import Tabs from "@shared/ui/tabs/Tabs";
import { Card, CardBody, CardHeader } from "@shared/ui/card/Card";
import ConsumeItemForm from "@features/specification/ui/workspace/forms/ConsumeItemForm";
import WorkNoteForm from "@features/diagnosis/ui/WorkNoteForm";
import CareTaskPicker from "./CareTaskPicker";

type EntryTab = "care" | "medicine" | "article" | "note";

// Sve što sestra unosi za pacijenta: urađena nega (iz liste), lek, potrošni materijal, dijagnoza (iz šablona) / učinak.
// careOnly: negovateljica — samo usluge nege iz kataloga.
export default function NurseEntryPanel({ patientId, title = "Novi unos", careOnly = false }: { patientId: string; title?: string; careOnly?: boolean }) {
  const [tab, setTab] = useState<EntryTab>("care");
  if (careOnly) {
    return (
      <Card>
        <CardHeader title="Urađena nega" description="Označite šta ste uradili. Ono što se naplaćuje ide upravi na odobrenje." />
        <CardBody>
          <CareTaskPicker key={patientId} patientId={patientId} />
        </CardBody>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader title={title} description="Ono što se naplaćuje ide upravi na odobrenje." />
      <CardBody className="space-y-5">
        {/* Bez ikonica: u uskoj koloni bi skratile nazive */}
        <Tabs
          variant="pills"
          value={tab}
          onChange={setTab}
          items={[
            { value: "care", label: "Nega" },
            { value: "medicine", label: "Lek" },
            { value: "article", label: "Materijal" },
            { value: "note", label: "Dijagnoza" },
          ]}
        />
        {tab === "care" && <CareTaskPicker key={patientId} patientId={patientId} />}
        {tab === "medicine" && <ConsumeItemForm key={`m-${patientId}`} kind="medicine" patientId={patientId} recordOnly />}
        {tab === "article" && <ConsumeItemForm key={`a-${patientId}`} kind="article" patientId={patientId} recordOnly />}
        {tab === "note" && <WorkNoteForm key={patientId} patientId={patientId} />}
      </CardBody>
    </Card>
  );
}
