import { Outlet } from "react-router-dom";
import SidebarChef from "../components/Sidebar/SidebarChef";
import TopNavbar from "../components/TopNavbar/TopNavbar";

export default function ChefLayout() {
  return (
    // On remplace bg-gray-50 par le beige global #f9f6f2
    <div className="flex h-screen bg-[#faf9f7]">
      
      {/* Sidebar Chef */}
      <SidebarChef />

      {/* Conteneur principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Barre de navigation supérieure */}
        <TopNavbar /> 

        {/* Espace de contenu avec padding de 8 pour l'effet d'aération */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}