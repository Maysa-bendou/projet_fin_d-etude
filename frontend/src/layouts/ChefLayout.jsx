import { Outlet } from "react-router-dom";
import SidebarChef from "../components/Sidebar/SidebarChef";
import TopNavbar from "../components/TopNavbar/TopNavbar";

export default function ChefLayout() {
  return (
    // 1. Added 'flex' here to put Sidebar and Content side-by-side
    <div className="flex h-screen bg-gray-50">
      
      {/* 2. YOU MUST CALL THE SIDEBAR HERE */}
      <SidebarChef />

      {/* 3. This container holds the TopNavbar and the Page Content */}
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