// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProfilePage from "./pages/ProfilePage/ProfilePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Page par défaut → Profile */}
        <Route path="/" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
