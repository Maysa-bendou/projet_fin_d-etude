import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* LOGIN */
import LoginPage from "./pages/LoginPage/LoginPage";

/* Profil */
import ProfilePage from "./components/ProfilePage/ProfilePage";

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
import TicketDetailsPage from "./pages/employe/TicketDetailsPage/TicketDetailsPage";

/* TECHNICIEN */
import AccueilTechnicien from "./pages/technicien/AccueilTechnicien/AccueilTechnicien";
import TicketsAssignesPage from "./pages/technicien/TicketsAssignesPage/TicketsAssignesPage";
import TicketsServicePage from "./pages/technicien/TicketsServicePage/TicketsServicePage";
import TicketsDetailsPage from "./pages/technicien/TicketsDetailsPage/TicketsDetailsPage";
import HistoriqueTechnicien from "./pages/technicien/HistoriqueTechnicien/HistoriqueTechnicien";
import TicketDetailTechnicien from "./pages/technicien/TicketDetailTechnicien/TicketDetailTechnicien";
/* CHEF */
import AccueilChef from "./pages/chefService/AccueilChef/AccueilChef";

/* MANAGER */
import AccueilManager from "./pages/manager/AccueilManager/AccueilManager";
import PerformancesPage from "./pages/manager/PerformancesPage/PerformancesPage";
import RepartitionPage from "./pages/manager/RepartitionPage/RepartitionPage";
import AffectationsPage from "./pages/manager/AffectationsPage/AffectationsPage";
import TicketsService from "./pages/manager/TicketsServicePage/TicketsServicePage";
import TicketsDetails from "./pages/manager/TicketsDetailsPage/TicketsDetailsPage";

/* ADMIN */
import GestionUtilisateurs from "./pages/admin/GestionUtilisateurs/GestionUtilisateurs";
import AccueilAdmin from "./pages/admin/AccueilAdmin/AccueilAdmin";
import TicketsAdmin from "./pages/admin/Tickets/Tickets";
import StatistiquesAdmin from "./pages/admin/Statistiques/Statistiques";
import ParametresAdmin from "./pages/admin/Parametres/Parametres";

// ✅ Blocks access if not logged in or wrong role
function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "null");

  // Not logged in → back to login
  if (!token || !user) return <Navigate to="/" replace />;

  // Wrong role → back to login
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/" replace />;

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route path="/" element={<LoginPage />} />

        {/* ================= EMPLOYE ================= */}
        <Route path="/employee" element={
          <PrivateRoute allowedRoles={["employee"]}>
            <EmployeeLayout />
          </PrivateRoute>
        }>
          <Route index element={<AccueilPage />} />
          <Route path="create-ticket" element={<CreateTicketPage />} />
          <Route path="mes-tickets" element={<MesTicketsPage />} />
          <Route path="ticket/:id" element={<TicketDetailsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* ================= TECHNICIEN ================= */}
        <Route path="/technician" element={
          <PrivateRoute allowedRoles={["technician"]}>
            <TechnicianLayout />
          </PrivateRoute>
        }>
          <Route index element={<AccueilTechnicien />} />
          <Route path="tickets-assignes" element={<TicketsAssignesPage />} />
<Route path="ticket-technicien/:id" element={<TicketDetailTechnicien />} />
  <Route path="tickets-service" element={<TicketsServicePage />} />
<Route path="tickets-service/:id" element={<TicketsDetailsPage />} />
          <Route path="historique" element={<HistoriqueTechnicien />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* ================= CHEF SERVICE ================= */}
        <Route path="/chef" element={
          <PrivateRoute allowedRoles={["chef_service"]}> {/* ✅ exact DB value */}
            <ChefLayout />
          </PrivateRoute>
        }>
          <Route index element={<AccueilChef />} />
          <Route path="profile" element={<ProfilePage />} /> {/* ✅ added */}
        </Route>

{/* ================= MANAGER ================= */}
<Route path="/manager" element={
  <PrivateRoute allowedRoles={["manager"]}>
    <ManagerLayout />
  </PrivateRoute>
}>
  <Route index element={<AccueilManager />} />
  <Route path="profile" element={<ProfilePage />} />
  <Route path="tickets-service" element={<TicketsService />} />
  <Route path="tickets-service/:id" element={<TicketsDetails />} />
  <Route path="performances" element={<PerformancesPage />} />
  <Route path="repartition" element={<RepartitionPage />} />
  <Route path="affectations" element={<AffectationsPage />} />
</Route>

        {/* ================= ADMIN ================= */}
        <Route path="/admin" element={
          <PrivateRoute allowedRoles={["admin"]}> {/* ✅ exact DB value */}
            <AdminLayout />
          </PrivateRoute>
        }>
          <Route index element={<AccueilAdmin />} />
          <Route path="utilisateurs" element={<GestionUtilisateurs />} />
          <Route path="tickets" element={<TicketsAdmin />} />
          <Route path="statistiques" element={<StatistiquesAdmin />} />
          <Route path="parametres" element={<ParametresAdmin />} />
          <Route path="profile" element={<ProfilePage />} /> {/* ✅ added */}
        </Route>

        {/* Catch all unknown routes → login */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}