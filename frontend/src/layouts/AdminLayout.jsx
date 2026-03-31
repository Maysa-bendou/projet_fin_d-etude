import { Outlet } from "react-router-dom";
import SidebarAdmin from "../components/Sidebar/SidebarAdmin";
import TopNavbar from "../components/TopNavbar/TopNavbar";
export default function AdminLayout() {
  return (
     <div className="flex h-screen">
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar />                        {/* ← ici */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}