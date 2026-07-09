import { useEffect, useState } from "react";
import axios from "axios";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import ComponentCard from "../../components/common/ComponentCard";
import { useAuth } from "../../context/AuthContext";

interface NurseAction {
  type: string;
  createdBy: {name:string, lastName:string}; 
  patient: string;
  description: string;
  createdAt: string;
}

export default function NurseActionsList() {
  const { token } = useAuth();
  const [actions, setActions] = useState<NurseAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/nurse-actions", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setActions(response.data.nurseActions);
      }
    } catch (error) {
      console.error("Greška pri učitavanju radnji sestara:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center py-4">Učitavanje...</p>;

  return (
    <ComponentCard title="Aktivnosti medicinskih sestara">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start">Sestra</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start">Pacijent</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start">Radnja</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start">Detalji</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start">Datum</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {actions.map((a, idx) => (
              <TableRow key={idx}>
                <TableCell className="...">
  {a.createdBy.name} {a.createdBy.lastName}
</TableCell>

                <TableCell className="px-5 py-4 sm:px-6 text-start">{a.patient}</TableCell>
                <TableCell className="px-5 py-4 sm:px-6 text-start">{a.type}</TableCell>
                <TableCell className="px-5 py-4 sm:px-6 text-start">{a.description}</TableCell>
                <TableCell className="px-5 py-4 sm:px-6 text-start">{new Date(a.createdAt).toLocaleString("sr-RS")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ComponentCard>
  );
}
