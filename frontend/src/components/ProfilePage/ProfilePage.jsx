// src/components/ProfilePage/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import { MdEmail, MdPhone, MdLocationOn, MdBuild } from "react-icons/md";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Non authentifié");

        const response = await fetch("http://localhost:3001/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Erreur lors du chargement du profil");

        const data = await response.json();
        setUser(data);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger le profil.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-sm">Chargement du profil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  // ✅ name = prénom, surname = nom
  const initials = `${user.name?.[0] ?? ""}${user.surname?.[0] ?? ""}`.toUpperCase();

  // ✅ Role label in French for display
  const roleLabel = {
    employee:      "Employé",
    technician:    "Technicien",
    chef_service:  "Chef de Service",
    manager:       "Manager",
    admin:         "Administrateur",
  }[user.role] ?? user.role;

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-6 mt-10">

      {/* Header: Avatar + Name + Role */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
          {user.avatar ? (
            <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>

        <div>
          {/* ✅ name = prénom, surname = nom */}
          <h2 className="text-2xl font-bold text-gray-900">
            {user.name} {user.surname}
          </h2>
          <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium mt-1">
            {roleLabel}
          </span>
          {user.job_title && (
            <p className="text-blue-600 text-sm font-medium mt-1">
              {user.job_title} {/* ✅ was user.poste */}
            </p>
          )}
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Personal Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Informations personnelles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { label: "Nom",       value: user.surname              },
                { label: "Prénom",    value: user.name                 },
                { label: "Email",     value: user.email                },
                { label: "Téléphone", value: user.phone       ?? "—"   }, // ✅ phone
                // { label: "Rôle",      value: roleLabel                 }, 
              ].map(f => (
                <div key={f.label}>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    {f.label}
                  </p>
                  <p className="text-sm font-medium text-gray-800">
                    {f.value ?? "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Professional Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Informations professionnelles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { label: "Département", value: user.department   ?? "—" }, // ✅ department
                { label: "Poste",       value: user.job_title    ?? "—" }, // ✅ job_title
                { label: "Bureau",      value: user.office       ?? "—" }, // ✅ office
                { label: "Bloc",        value: user.block_number ?? "—" }, // ✅ block_number
              ].map(f => (
                <div key={f.label}>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    {f.label}
                  </p>
                  <p className="text-sm font-medium text-gray-800">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Technician-only Services */}
         {user.role === "technician" && user.services && (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
      <MdBuild className="text-blue-500" /> Service associé
    </h3>

    <span className="px-3 py-1.5 rounded-full text-sm bg-blue-50 text-blue-600 font-medium">
      {user.services.name}
    </span>
  </div>
)}
        </div>

        {/* Right Column: Quick Info */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-sm space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <MdLocationOn className="text-red-400" />
              {/* ✅ office + block_number */}
              <span>{user.office ?? "—"} — Bloc {user.block_number ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MdPhone className="text-green-500" />
              <span>{user.phone ?? "—"}</span> {/* ✅ phone */}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MdEmail className="text-blue-500" />
              <span>{user.email ?? "—"}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}