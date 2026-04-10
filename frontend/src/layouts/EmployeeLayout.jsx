
import Sidebar from "../components/Sidebar/Sidebar";
import Navbar from "../components/navbar/navbar";
import { Outlet } from "react-router-dom";
import TopNavbar from "../components/TopNavbar/TopNavbar";
export default function EmployeeLayout() {
  return (
    <div className="flex h-screen bg-gray-50">

      {/* Sidebar à gauche */}
      <Sidebar />

      {/* Partie droite : Navbar en haut + contenu en bas */}
      <div className="flex flex-col flex-1 overflow-hidden">

         {/* Navbar en haut */}
        <TopNavbar />

        {/* Contenu de la page */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

      </div>

    </div>
  );
}