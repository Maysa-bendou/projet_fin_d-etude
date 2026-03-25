import { Outlet } from "react-router-dom";
import SidebarChef from "../components/Sidebar/SidebarChef";

export default function ChefLayout() {
  return (
    <div className="flex">

      {/* ✅ Sidebar added */}
      <SidebarChef />

      <main className="flex-1 p-6 bg-gray-100 min-h-screen">
        <Outlet />
      </main>

    </div>
  );
}