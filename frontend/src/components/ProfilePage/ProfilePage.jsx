import React, { useState, useEffect } from "react";
import { 
  MdEmail, MdPhone, MdLocationOn, MdBuild, MdFlag
} from "react-icons/md";

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

        if (!response.ok) throw new Error("Erreur chargement");

        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError("Impossible de charger le profil.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f9f6f2] text-slate-500">
        Chargement du profil...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f9f6f2] text-red-500">
        {error}
      </div>
    );
  }

  const initials = `${user.name?.[0] ?? ""}${user.surname?.[0] ?? ""}`.toUpperCase();
  const card = "bg-white border border-slate-200 rounded-xl shadow-sm p-6";

  return (
    <div className="min-h-screen bg-[#f9f6f2] p-8">

      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Mon Profil</h1>
        <p className="text-sm text-slate-500">Informations personnelles et professionnelles</p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* IDENTITÉ */}
        <div className={`${card} flex items-center gap-5`}>
          <div className="w-16 h-16 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-bold text-xl">
            {initials}
          </div>

          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
              Collaborateur
            </p>

            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              {user.name} {user.surname}
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                <MdFlag size={14} />
                Algérienne
              </span>
            </h2>
          </div>
        </div>

        {/* LOCALISATION */}
        <div className={card}>
          <h3 className="text-sm font-bold text-slate-700 mb-4">Localisation</h3>

          <div className="flex gap-3 text-slate-600">
            <MdLocationOn size={20} className="text-indigo-500" />
            <div className="text-sm">
              <p className="font-semibold text-slate-800">Djezzy Headquarters</p>
              Bloc {user.block_number ?? "—"} / Bureau {user.office ?? "—"}
            </div>
          </div>
        </div>

        {/* CONTACT */}
        <div className={card}>
          <h3 className="text-sm font-bold text-slate-700 mb-4">Contact</h3>

          <div className="space-y-4 text-sm">

            <div className="flex items-center gap-3">
              <MdEmail size={18} className="text-blue-500" />
              <span className="font-medium text-slate-700">{user.email}</span>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t">
              <MdPhone size={18} className="text-emerald-500" />
              <span className="font-medium text-slate-700">
                {user.phone ?? "Non renseigné"}
              </span>
            </div>

          </div>
        </div>

        {/* DÉTAILS PRO */}
        <div className={`${card} md:col-span-2 xl:col-span-3`}>
          <div className="flex items-center gap-2 mb-6">
            <MdBuild className="text-purple-500" />
            <h3 className="text-sm font-bold text-slate-700">
              Détails Professionnels
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <p className="text-slate-400 text-xs uppercase font-bold">Rôle</p>
              <p className="font-semibold text-slate-800">{user.role}</p>
            </div>

            <div>
              <p className="text-slate-400 text-xs uppercase font-bold">Département</p>
              <p className="font-semibold text-slate-800">
                {user.department ?? "—"}
              </p>
            </div>

            {(user.role === "technician" || user.role === "manager") && (
              <div>
                <p className="text-slate-400 text-xs uppercase font-bold">Service</p>
                <p className="font-semibold text-slate-800">
                  {user.services?.name ?? "Non assigné"}
                </p>
              </div>
            )}

            <div>
              <p className="text-slate-400 text-xs uppercase font-bold">Poste</p>
              <p className="font-semibold text-slate-800">
                {user.job_title ?? "—"}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}