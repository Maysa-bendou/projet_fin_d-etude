import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CreateTicketPage from "./pages/CreateTicketPage/CreateTicketPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Bypass login → directement CreateTicketPage */}
        <Route path="/" element={<CreateTicketPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
