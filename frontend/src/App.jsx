import { BrowserRouter, Routes, Route } from "react-router-dom";

/* LOGIN */
import LoginPage from "./pages/LoginPage/LoginPage";

/* LAYOUTS */
import EmployeeLayout from "./layouts/EmployeeLayout";
import TechnicianLayout from "./layouts/TechnicianLayout";
import ChefLayout from "./layouts/ChefLayout";
import ManagerLayout from "./layouts/ManagerLayout";
import AdminLayout from "./layouts/AdminLayout";

/* EMPLOYE */
import AccueilPage from "./pages/employe/AccueilPage/AccueilPage";
import CreateTicketPage from "./pages/employe/CreateTicketPage/CreateTicketPage";
import MesTicketsPage from "./pages/employe/MesTicketsPage/MesTicketsPage";
import ProfilePage from "./pages/employe/ProfilePage/ProfilePage";

/* TECHNICIEN */
import AccueilTechnicien from "./pages/technicien/AccueilTechnicien/AccueilTechnicien";
import TicketsAssignesPage from "./pages/technicien/TicketsAssignesPage/TicketsAssignesPage";
import TicketsServicePage from "./pages/technicien/TicketsServicePage/TicketsServicePage";
import HistoriqueTechnicien from "./pages/technicien/HistoriqueTechnicien/HistoriqueTechnicien";
import ProfileTechnicien from "./pages/technicien/ProfileTechnicien/ProfileTechnicien";

/* CHEF */
import AccueilChef from "./pages/chefService/AccueilChef/AccueilChef";

/* MANAGER */
import AccueilManager from "./pages/manager/AccueilManager/AccueilManager";

/* ADMIN */
import AccueilAdmin from "./pages/admin/AccueilAdmin/AccueilAdmin";

export default function App() {

  return (
    <BrowserRouter>

      <Routes>

        {/* LOGIN */}
        <Route path="/" element={<LoginPage />} />

        {/* ================= EMPLOYE ================= */}
        <Route path="/employee" element={<EmployeeLayout />}>

          <Route index element={<AccueilPage />} />
          <Route path="create-ticket" element={<CreateTicketPage />} />
          <Route path="mes-tickets" element={<MesTicketsPage />} />
          <Route path="profile" element={<ProfilePage />} />

        </Route>

        {/* ================= TECHNICIEN ================= */}
        <Route path="/technician" element={<TechnicianLayout />}>

          <Route index element={<AccueilTechnicien />} />
          <Route path="tickets-assignes" element={<TicketsAssignesPage />} />
          <Route path="tickets-service" element={<TicketsServicePage />} />
          <Route path="historique" element={<HistoriqueTechnicien />} />
          <Route path="profile" element={<ProfileTechnicien />} />

        </Route>

        {/* ================= CHEF ================= */}
        <Route path="/chef" element={<ChefLayout />}>

          <Route index element={<AccueilChef />} />

        </Route>

        {/* ================= MANAGER ================= */}
        <Route path="/manager" element={<ManagerLayout />}>

          <Route index element={<AccueilManager />} />

        </Route>

        {/* ================= ADMIN ================= */}
        <Route path="/admin" element={<AdminLayout />}>

          <Route index element={<AccueilAdmin />} />

        </Route>

      </Routes>

    </BrowserRouter>
  );

}