import { Link } from "react-router";
import usePatients from "../../hooks/Patient/usePatients";

export default function PatientTable() {
  const { data: patients, isLoading, isError } = usePatients();

  if (isLoading) return <p>Učitavanje pacijenata...</p>;
  if (isError) return <p className="text-red-500">Greška pri učitavanju!</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Ime</th>
            <th className="p-2 border">Prezime</th>
            <th className="p-2 border">Datum rođenja</th>
            <th className="p-2 border">Datum prijema</th>
            <th className="p-2 border">Adresa</th>
            <th className="p-2 border">Profil</th>
          </tr>
        </thead>
        <tbody>
          {patients?.map((p) => (
            <tr key={p._id} className="hover:bg-gray-50">
              <td className="p-2 border">{p.name}</td>
              <td className="p-2 border">{p.lastName}</td>
              <td className="p-2 border">
                {p.dateOfBirth
                  ? new Date(p.dateOfBirth).toLocaleDateString("sr-RS")
                  : "-"}
              </td>
              <td className="p-2 border">
                {p.admissionDate
                  ? new Date(p.admissionDate).toLocaleDateString("sr-RS")
                  : "-"}
              </td>
              <td className="p-2 border">{p.address}</td>
              <td className="p-2 border text-center">
                <Link
                  to={`/patient-profile-nurse/${p._id}`}
                  className="text-blue-500 hover:underline"
                >
                  Otvori
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
