import { Outlet } from "react-router-dom";
import SidebarManager from "../components/Sidebar/SidebarManager";
import TopNavbar from "../components/TopNavbar/TopNavbar";
export default function ManagerLayout() {
  return (
    <div className="flex h-screen bg-gray-50">

      {/* Sidebar à gauche */}
      <SidebarManager />
      {/* Contenu à droite */}
     <div className="flex-1 flex flex-col overflow-hidden">
             
             {/* The Navbar you provided */}
             <TopNavbar /> 
     
             {/* The Main area where your pages (Accueil, Tickets, etc.) appear */}
             <main className="flex-1 overflow-y-auto p-4">
               <Outlet />
             </main>
           </div>

    </div>
  );
}