import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage/LoginPage";
import MainLayout from "./layouts/MainLayout";

import AccueilPage from "./pages/AccueilPage/AccueilPage";
import CreateTicketPage from "./pages/CreateTicketPage/CreateTicketPage";
import MesTicketsPage from "./pages/MesTicketsPage/MesTicketsPage";
import HistoriquePage from "./pages/HistoriquePage/HistoriquePage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";

export default function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* LOGIN */}
        <Route path="/" element={<LoginPage />} />

        {/* APPLICATION */}
        <Route path="/app" element={<MainLayout />}>

          <Route index element={<AccueilPage />} />
          <Route path="create-ticket" element={<CreateTicketPage />} />
          <Route path="mes-tickets" element={<MesTicketsPage />} />
          <Route path="historique" element={<HistoriquePage />} />
          <Route path="profile" element={<ProfilePage />} />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}