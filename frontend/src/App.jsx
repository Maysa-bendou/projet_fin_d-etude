import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage/LoginPage";
import CreateTicketPage from "./pages/CreateTicketPage/CreateTicketPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/create-ticket" element={<CreateTicketPage />} />
      </Routes>
    </BrowserRouter>
  );
}
