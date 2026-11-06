import PageHeader from "@shared/ui/page/PageHeader";
import { Card, CardBody } from "@shared/ui/card/Card";
import EntryReview from "@features/nurse-entries/ui/EntryReview";

// Svi unosi sestara koji čekaju odobrenje, po pacijentu.
export default function ApprovalsPage() {
  return (
    <>
      <PageHeader
        title="Za odobrenje"
        description="Prihvaćeno ulazi u aktivnu specifikaciju pacijenta i skida se sa stanja (prvo porodično). Odbijeno se ne naplaćuje i ne skida sa stanja."
      />
      <Card>
        <CardBody>
          <EntryReview />
        </CardBody>
      </Card>
    </>
  );
}
