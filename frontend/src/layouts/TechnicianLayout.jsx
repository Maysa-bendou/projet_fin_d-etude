import SidebarTechnicien from "../components/Sidebar/SidebarTechnicien";
import { Outlet } from "react-router-dom";
import TopNavbar from "../components/TopNavbar/TopNavbar";

export default function TechnicianLayout() {
  return (
    // On applique le beige sur le conteneur parent de TOUTE la page
    <div className="flex h-screen bg-[#faf9f7]">
      
      {/* Sidebar - assure-toi qu'elle n'a pas de bordure blanche inutile */}
      <SidebarTechnicien />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Navbar - elle doit aussi "flotter" sur le fond beige ou être transparente */}
        <TopNavbar />
        
        {/* Zone de contenu principale */}
        <main className="flex-1 overflow-y-auto  pb-8">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
