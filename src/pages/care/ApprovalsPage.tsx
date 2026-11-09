import PageHeader from "@shared/ui/page/PageHeader";
import { Card, CardBody } from "@shared/ui/card/Card";
import EntryReview from "@features/nurse-entries/ui/EntryReview";

// Svi unosi koji čekaju odobrenje (sestre i vanredna fizioterapija), po pacijentu.
export default function ApprovalsPage() {
  return (
    <>
      <PageHeader
        title="Za odobrenje"
        description="Unosi sestara i vanredna fizioterapija. Prihvaćeno ulazi u specifikaciju pacijenta (lekovi i artikli se skidaju sa stanja, prvo porodično). Odbijeno se ne naplaćuje i ne skida sa stanja."
      />
      <Card>
        <CardBody>
          <EntryReview />
        </CardBody>
      </Card>
    </>
  );
}
