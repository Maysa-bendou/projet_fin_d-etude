import SidebarTechnicien from "../components/Sidebar/SidebarTechnicien";
import { Outlet } from "react-router-dom";
import TopNavbar from "../components/TopNavbar/TopNavbar";

export default function TechnicianLayout() {

  return (
    <div className="flex h-screen">
      <SidebarTechnicien />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar />                        {/* ← ici */}
       
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );

}