import { useState } from "react";
import useArticles from "@entities/article/hooks/useArticle";
import ArticlesForm from "@features/articles/ui/ArticlesForm";
import DeleteArticle from "@features/articles/ui/DeleteArticle";
import EditArticle from "@features/articles/ui/EditArticle";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@shared/ui/table/index";
import ComponentCard from "@shared/ui/common/ComponentCard";

export default function ArticlesList() {
  const { getArticles } = useArticles();
  const { data: articles = [], isLoading } = getArticles;

  const refetchArticles = getArticles.refetch;

  // ✅ NOVO: lokalni search (isto kao kod lekova)
  const [search, setSearch] = useState("");

  const safeSearch = search.toLowerCase();

  const filteredArticles = articles.filter((a) =>
    a.name.toLowerCase().includes(safeSearch)
  );

  const homeArticles = filteredArticles.filter(
    (a) => (a.quantity ?? 0) > 0
  );
  const familyArticles = filteredArticles.filter(
    (a) => (a.familyQuantity ?? 0) > 0
  );

  if (isLoading) return <p>Učitavanje artikala...</p>;

  return (
    <div className="space-y-10">
      <ArticlesForm />

      {/* ✅ SEARCH BAR – ISTI KAO KOD LEKOVA */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pretraži artikle..."
          className="w-full max-w-md border-2 rounded px-3 py-2 bg-white"
        />
      </div>

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
