import useArticles from "../../hooks/Patient/useArticle";
import ArticlesForm from "./ArticlesForm";
import DeleteArticle from "./DeleteArticle";
import EditArticle from "./EditArticle";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import ComponentCard from "../../components/common/ComponentCard";

export default function ArticlesList() {
  const { getArticles } = useArticles();
  const { data: articles = [], isLoading } = getArticles;

  const refetchArticles = getArticles.refetch;

  const homeArticles = articles.filter((a) => (a.quantity ?? 0) > 0);
  const familyArticles = articles.filter((a) => (a.familyQuantity ?? 0) > 0);

  if (isLoading) return <p>Učitavanje artikala...</p>;

  return (
    <div className="space-y-10">
      <ArticlesForm />

      {/* 🟦 DOM ARTIKLI */}
      <ComponentCard title="ARTIKLI — DOM">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Naziv</TableCell>
                <TableCell isHeader>Pakovanja</TableCell>
                <TableCell isHeader>Kom / pak.</TableCell>
                <TableCell isHeader>Ukupno komada</TableCell>
                <TableCell isHeader>Cena po komadu</TableCell>
                <TableCell isHeader>Izmeni</TableCell>
                <TableCell isHeader>Obriši</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {homeArticles.map((a) => (
                <TableRow key={a._id}>
                  <TableCell>{a.name}</TableCell>
                  <TableCell>{a.packageCount ?? 0}</TableCell>
                  <TableCell>{a.unitsPerPackage ?? "-"}</TableCell>
                  <TableCell>{a.quantity.toFixed(2)}</TableCell>
                  <TableCell>{a.price ? `${a.price} RSD` : "-"}</TableCell>
                  <TableCell>
                    <EditArticle
                      articleId={a._id}
                      price={a.price}
                      quantity={a.quantity}
                      mode="home"
                      onUpdated={refetchArticles}
                    />
                  </TableCell>
                  <TableCell>
                    <DeleteArticle articleId={a._id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>

      {/* 🟨 PORODIČNI ARTIKLI */}
      {familyArticles.length > 0 && (
        <ComponentCard title="ARTIKLI OD PORODICE">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Naziv</TableCell>
                  <TableCell isHeader>Pakovanja</TableCell>
                  <TableCell isHeader>Kom / pak.</TableCell>
                  <TableCell isHeader>Ukupno komada</TableCell>
                  <TableCell isHeader>Dodaj / Izmeni</TableCell>
                  <TableCell isHeader>Obriši</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {familyArticles.map((a) => (
                  <TableRow key={a._id}>
                    <TableCell>{a.name}</TableCell>
                    <TableCell>{a.familyPackageCount ?? 0}</TableCell>
                    <TableCell>{a.unitsPerPackage ?? "-"}</TableCell>
                    <TableCell>{a.familyQuantity.toFixed(2)}</TableCell>
                    <TableCell>
                      <EditArticle
                        articleId={a._id}
                        quantity={a.familyQuantity}
                        mode="family"
                        onUpdated={refetchArticles}
                      />
                    </TableCell>
                    <TableCell>
                      <DeleteArticle articleId={a._id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ComponentCard>
      )}
    </div>
  );
}
