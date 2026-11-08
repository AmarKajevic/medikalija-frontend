import { Link } from "react-router";
import { LuClipboardCheck } from "react-icons/lu";
import PageHeader from "@shared/ui/page/PageHeader";
import { Card, CardBody, CardHeader } from "@shared/ui/card/Card";
import { isManager, paths } from "@app/paths";
import { useAuth } from "@app/providers/AuthContext";
import { useNurseEntries } from "@features/nurse-entries/model";
import EntryList from "@features/nurse-entries/ui/EntryList";
import PhysioEntryForm from "@features/physio/ui/PhysioEntryForm";

// Fizioterapija: fizioterapeut beleži redovnu (ne naplaćuje se) i vanrednu terapiju
// (uprava određuje cenu i odobrava je u "Za odobrenje"). Uprava ovde vidi sve unose.
export default function PhysioPage() {
  const { user } = useAuth();
  const manager = isManager(user?.role);
  const pending = useNurseEntries({ type: ["physio"], status: ["pending"], limit: 500 }, { enabled: manager }).data ?? [];

  return (
    <>
      <PageHeader
        title="Fizioterapija"
        description="Kada i kod kog pacijenta je rađena fizikalna terapija. Redovna se ne naplaćuje; vanrednu odobrava uprava i određuje joj cenu."
        actions={
          manager && pending.length > 0 ? (
            <Link
              to={paths.approvals}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-warning-50 px-3 text-sm font-medium text-warning-700 hover:bg-warning-100 dark:bg-warning-500/10 dark:text-warning-400"
            >
              <LuClipboardCheck className="h-4 w-4" />
              Vanredne na čekanju: {pending.length}
            </Link>
          ) : undefined
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <Card>
          <CardHeader title="Nova terapija" description="Pacijent, vrsta terapije i da li je redovna ili vanredna." />
          <CardBody>
            <PhysioEntryForm />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={manager ? "Svi unosi fizioterapije" : "Moji unosi"} description="Redovne su zabeležene, vanredne čekaju odobrenje ili su u specifikaciji." />
          <CardBody>
            <EntryList mine={!manager} type={["physio"]} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
