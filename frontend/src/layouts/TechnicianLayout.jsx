import SidebarTechnicien from "../components/Sidebar/SidebarTechnicien";
import { Outlet } from "react-router-dom";

export default function TechnicianLayout() {

  return (
    <div className="flex">

      <SidebarTechnicien />

      <main className="flex-1 p-6 bg-gray-100 min-h-screen">
        <Outlet />
      </main>

    </div>
  );

}