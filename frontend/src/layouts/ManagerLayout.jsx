import { Outlet } from "react-router-dom";
import SidebarManager from "../components/Sidebar/SidebarManager";
import TopNavbar from "../components/TopNavbar/TopNavbar";

export default function ManagerLayout() {
  return (
    // On remplace bg-gray-50 par le beige global (#f9f6f2)
    <div className="flex h-screen bg-[#f9f6f2]">

      {/* Sidebar à gauche */}
      <SidebarManager />

      {/* Contenu à droite */}
      <div className="flex-1 flex flex-col overflow-hidden">
             
        {/* Barre de navigation supérieure */}
        <TopNavbar /> 
     
        {/* Zone de contenu principale avec un espacement large (p-8) */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>

    </div>
  );
}