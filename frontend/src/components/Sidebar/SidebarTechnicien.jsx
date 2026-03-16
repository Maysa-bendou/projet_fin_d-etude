import { Link } from "react-router-dom";

export default function SidebarTechnicien() {

  const menuItems = [
    { label: "Accueil", path: "/technician" },
    { label: "Tickets assignés", path: "/technician/tickets-assignes" },
    { label: "Tickets du service", path: "/technician/tickets-service" },
    { label: "Historique", path: "/technician/historique" },
    { label: "Profil", path: "/technician/profile" }
  ];

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  return (
    <aside className="w-64 h-screen bg-black text-white flex flex-col">

      <div className="p-5 text-xl font-bold border-b border-gray-700">
        IT Portal
      </div>

      <ul className="flex-1 mt-4">

        {menuItems.map((item, index) => (

          <li key={index} className="px-4 py-3 hover:bg-gray-700">

            <Link to={item.path}>
              {item.label}
            </Link>

          </li>

        ))}

      </ul>

      <button
        onClick={logout}
        className="m-4 bg-red-600 hover:bg-red-700 py-2 rounded"
      >
        Déconnexion
      </button>

    </aside>
  );
}