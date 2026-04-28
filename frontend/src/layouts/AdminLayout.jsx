import { Outlet } from "react-router-dom";
import SidebarAdmin from "../components/Sidebar/SidebarAdmin";
import TopNavbar from "../components/TopNavbar/TopNavbar";

export default function AdminLayout() {
  return (
    // Remplacement du gris par le beige global (#f9f6f2)
    <div className="flex h-screen bg-[#faf9f7]">
      
      {/* Sidebar Admin */}
      <SidebarAdmin />
      
      {/* Conteneur principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Barre de navigation supérieure */}
        <TopNavbar />
        
        {/* Zone de contenu dynamique avec un espacement large (p-8) */}
        <main className="flex-1 overflow-y-auto ">
          <Outlet />
        </main>
        
      </div>
    </div>
  );
}