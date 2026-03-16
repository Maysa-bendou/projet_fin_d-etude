import Sidebar from "../components/Sidebar/Sidebar";
import { Outlet } from "react-router-dom";

export default function EmployeeLayout() {
  return (
    <div className="flex">

      <Sidebar />

      <main className="flex-1 p-6">
        <Outlet />
      </main>

    </div>
  );
}