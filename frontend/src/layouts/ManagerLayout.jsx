import { Outlet } from "react-router-dom";
import SidebarManager from "../components/Sidebar/SidebarManager";

export default function ManagerLayout() {
  return (
    <div className="flex h-screen bg-gray-50">

      {/* Sidebar à gauche */}
      <SidebarManager />

      {/* Contenu à droite */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>

    </div>
  );
}