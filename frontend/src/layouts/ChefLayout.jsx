
import { Outlet } from "react-router-dom";

export default function ChefLayout() {

  return (
    <div className="flex">

      <main className="flex-1 p-6 bg-gray-100 min-h-screen">
        <Outlet />
      </main>

    </div>
  );

}