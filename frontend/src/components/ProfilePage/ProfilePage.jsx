import React, { useState, useEffect } from "react";
import { 
  MdEmail, MdPhone, MdLocationOn, MdBuild, 
  MdLanguage, MdFlag, MdCake, MdMoreVert 
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

  if (loading || error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        {error || "Chargement..."}
      </div>
    );
  }

  const initials = `${user.name?.[0] ?? ""}${user.surname?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="p-4 md:p-8 bg-[#f8f9fa] min-h-screen font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ── CARD 1: VOTRE PROFIL ── */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex items-center gap-6">
          <div className="shrink-0 w-24 h-24 rounded-full bg-[#e40c0c] flex items-center justify-center text-white text-4xl font-black shadow-lg">
            {user.avatar ? <img src={user.avatar} className="rounded-full h-full w-full object-cover" alt="avatar" /> : initials}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Votre profil</h3>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{user.name} {user.surname}</h2>
            <div className="flex items-center gap-2 text-sm mt-1">
              <MdPhone size={16} className="text-emerald-500" />
              <p className="text-gray-900 font-medium">{user.phone ?? "Non renseigné"}</p>
            </div>
          </div>
        </div>

        {/* ── CARD 2: LOCALISATION ── */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Localisation</h3>
            <MdMoreVert className="text-slate-300 cursor-pointer" />
          </div>
          <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Bureau Principal</span>
          <div className="mt-6 flex gap-4 items-start">
            <MdLocationOn className="text-indigo-400 mt-1" size={24} />
            <div className="text-sm text-slate-700 font-medium leading-relaxed">
              Djezzy Headquarters, Alger<br />
              <span className="text-slate-400">Bloc {user.block_number ?? "—"} / Bureau {user.office ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* ── CARD 3: CONTACT ── */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col gap-6">
          <h3 className="text-lg font-bold text-gray-800">Contact</h3>
          <div className="space-y-6">
            <div className="flex gap-4 items-center">
              <MdEmail className="text-blue-400" size={24} />
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Email Primaire</p>
                <p className="text-sm font-semibold text-slate-700">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-4 items-center border-t border-slate-50 pt-6">
              <MdCake className="text-rose-400" size={24} />
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Date d'anniversaire</p>
                <p className="text-sm font-semibold text-gray-900">{user.birthday ?? "15 Juillet"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD 4: PARAMÈTRES ── */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col gap-6">
          <h3 className="text-lg font-bold text-gray-800">Paramètres</h3>
          <div className="space-y-6">
            <div className="flex gap-4 items-center">
              <MdLanguage className="text-sky-400" size={24} />
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Langue</p>
                <p className="text-sm font-bold text-slate-800">Français (DZ)</p>
              </div>
            </div>
            <div className="flex gap-4 items-center border-t border-slate-50 pt-6">
              <MdFlag className="text-amber-400" size={24} />
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Nationalité</p>
                <p className="text-sm font-bold text-slate-800">Algérienne</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD 5: DÉTAILS PROFESSIONNELS ── */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 md:col-span-2">
           <div className="flex items-center mb-8">
              <div className="flex items-center gap-3 bg-[#f3e8ff] rounded-full px-6 py-2.5">
                <MdBuild className="text-[#7c3aed]" size={20} />
                <h3 className="text-lg font-bold text-[#7c3aed] tracking-tight">Détails Professionnels</h3>
              </div>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-2">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Rôle</p>
                <p className="text-sm font-bold text-slate-800">{user.role}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Département</p>
                <p className="text-sm font-bold text-slate-800">{user.department ?? "—"}</p>
              </div>
              
              {/* CONDITION : On affiche SERVICE uniquement pour Technicien et Manager */}
              {(user.role === "technician" || user.role === "manager") && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Service</p>
                  <p className="text-sm font-bold text-slate-800">{user.services?.name ?? "Non assigné"}</p>
                </div>
              )}

              <div>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Poste actuel</p>
                <p className="text-sm font-bold text-slate-800">{user.job_title ?? "—"}</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}