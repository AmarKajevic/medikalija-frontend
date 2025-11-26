import { FaFileMedical, FaPrescriptionBottleAlt, FaUsers } from "react-icons/fa"
import { Link } from "react-router"

export default function NurseDashboard() {
  const links= [
    { to: "/articles", label: "artikli ", icon: <FaPrescriptionBottleAlt /> },
    { to: "/familyMedicine", label: "dodavanje lekova od porodice ", icon: <FaFileMedical /> },
    { to: "../patient-table", label: "Lista pacijenata", icon: <FaUsers /> },
  ]
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
  )
}