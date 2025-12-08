import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import ComponentCard from "../../components/common/ComponentCard";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";

export default function MedicineReserveList() {
  const { token } = useAuth();
  const [reserve, setReserve] = useState<any[]>([]);

  const fetchReserve = async () => {
    const res = await axios.get(
      "https://medikalija-api.vercel.app/api/medicine-reserve",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setReserve(res.data.reserve || []);
  };

  useEffect(() => {
    fetchReserve();
  }, []);

  return (
    <ComponentCard title="REZERVA LEKOVA">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader>Lek</TableCell>
              <TableCell isHeader>Količina</TableCell>
              <TableCell isHeader>Izvor</TableCell>
              <TableCell isHeader>Cena</TableCell>
              <TableCell isHeader>Datum</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {reserve.map((r) => (
              <TableRow key={r._id}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.amount}</TableCell>
                <TableCell>{r.source === "home" ? "Dom" : "Porodica"}</TableCell>
                <TableCell>{r.pricePerUnit ? `${r.pricePerUnit} RSD` : "-"}</TableCell>
                <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ComponentCard>
  );
}
