import { useEffect, useState } from "react";
import { api } from "@shared/api/api";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@shared/ui/table/index";
import ComponentCard from "@shared/ui/common/ComponentCard";

interface NurseAction {
  type: string;
  createdBy: {name:string, lastName:string};
  patient: string;
  description: string;
  createdAt: string;
}

export default function NurseActionsList() {
  const [actions, setActions] = useState<NurseAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      const response = await api.get("/api/nurse-actions");

      if (response.data.success) {
        setActions(response.data.nurseActions);
      }
    } catch (error) {
      console.error("Greška pri učitavanju radnji sestara:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">Učitavanje...</p>;

  return (
    <div className="p-6">
      <ComponentCard title="Aktivnosti medicinskih sestara">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Sestra</TableCell>
                <TableCell isHeader>Pacijent</TableCell>
                <TableCell isHeader>Radnja</TableCell>
                <TableCell isHeader>Detalji</TableCell>
                <TableCell isHeader>Datum</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {actions.length === 0 ? (
                <TableRow>
                  <TableCell className="text-gray-500 dark:text-gray-400">
                    Nema zabeleženih aktivnosti.
                  </TableCell>
                </TableRow>
              ) : (
                actions.map((a, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-gray-800 dark:text-white/90">
                      {a.createdBy.name} {a.createdBy.lastName}
                    </TableCell>
                    <TableCell>{a.patient}</TableCell>
                    <TableCell>{a.type}</TableCell>
                    <TableCell>{a.description}</TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400">
                      {new Date(a.createdAt).toLocaleString("sr-RS")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>
    </div>
  );
}
