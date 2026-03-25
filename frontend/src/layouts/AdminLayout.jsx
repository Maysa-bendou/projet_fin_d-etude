import { Outlet } from "react-router-dom";
import SidebarAdmin from "../components/Sidebar/SidebarAdmin";

export default function AdminLayout() {
  return (
    <div className="flex">

      {/* ✅ Sidebar added */}
      <SidebarAdmin />

      <main className="flex-1 p-6 bg-gray-100 min-h-screen">
        <Outlet />
      </main>

    </div>
  );
}