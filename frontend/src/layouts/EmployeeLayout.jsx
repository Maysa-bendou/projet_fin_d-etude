import Sidebar from "../components/Sidebar/Sidebar";
import { Outlet } from "react-router-dom";
import TopNavbar from "../components/TopNavbar/TopNavbar";

export default function EmployeeLayout() {
  return (
    // On remplace bg-gray-50 par le beige exact #f9f6f2
    <div className="flex h-screen" style={{ backgroundColor: '#faf9f7' }}>

      {/* Sidebar à gauche */}
      <Sidebar />

      {/* Partie droite */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Navbar en haut */}
        <TopNavbar />

        {/* Contenu de la page */}
        {/* On enlève p-6 ici pour que la page intérieure gère ses propres marges sans créer de bordures blanches */}
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#faf9f7' }}>
          <Outlet />
        </main>

      </div>
    </div>
  );
}