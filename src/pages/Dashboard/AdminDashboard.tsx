import { Link } from "react-router";
import { FaUserPlus, FaUsers, FaUserShield, FaTrashAlt, FaPills, FaPrescriptionBottleAlt, FaUserNurse, FaDiaspora, FaYCombinator, FaDochub, FaMedkit, FaBookMedical } from "react-icons/fa";

function AdminDashboard() {
  const links = [
    { to: "../patient-page", label: "Dodaj pacijenta", icon: <FaUserPlus /> },
    { to: "../patient-list", label: "Lista pacijenata", icon: <FaUsers /> },
    { to: "/signup", label: "Registruj sestru", icon: <FaUserShield /> },
    { to: "/patient/Delete/:patientId", label: "Izbriši pacijenta", icon: <FaTrashAlt /> },
    { to: "/medicine/addMedicine", label: "Dodaj lekove", icon: <FaPills /> },
    { to: "/medicine", label: "Lista lekova", icon: <FaPrescriptionBottleAlt /> },
    { to: "/analysis/list", label: "lista Analiza", icon: <FaDochub /> },
    { to: "/combinationGroup", label: "kombinacije analiza ", icon: <FaYCombinator /> },
    { to: "/articles", label: "artikli ", icon: <FaDiaspora /> },
    { to: "/nurse-actions", label: "Kontrola sestara ", icon: <FaUserNurse/> },
    { to: "/users-list", label: "Lista korisnika aplikacije ", icon: <FaUserPlus/> },
    { to: "/adding-to-reserve-list", label: "dodavanje rezervnih lekova", icon: <FaMedkit/> },
    { to: "/reserve-list", label: "Lista rezervnih lekova", icon: <FaBookMedical/> },


  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
      {links.map((link, index) => (
        <Link
          key={index}
          to={link.to}
          className="flex flex-col items-center justify-center p-6 bg-white/80 border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition"
        >
          <div className="text-4xl mb-3 text-gray-700">{link.icon}</div>
          <span className="text-center font-medium text-gray-800">{link.label}</span>
        </Link>
      ))}
    </div>
  );
}

export default AdminDashboard;
