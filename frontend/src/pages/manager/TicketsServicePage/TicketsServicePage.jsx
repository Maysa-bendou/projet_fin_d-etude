import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const TicketsServicePage = () => {
  const navigate = useNavigate();

  // Données de base depuis le localStorage
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role || "";
  const serviceId = user?.serviceId || user?.service_id || null;

  // États des données
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullUser, setFullUser] = useState(null);

  // ✅ États des filtres (Uniquement Catégorie, Statut et Assignation)
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [filterCategory, setFilterCategory] = useState("Tous");
  const [filterAssignment, setFilterAssignment] = useState("Tous");

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      // 1. Récupérer le profil pour avoir le nom du service (évite le 404 sur /api/services)
      const profileRes = await fetch("http://localhost:3001/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setFullUser(profileData);
      }

      // 2. Récupérer tous les tickets
      const ticketsRes = await fetch("http://localhost:3001/api/tickets");
      const ticketsData = await ticketsRes.json();
      
      // Filtrer immédiatement par le serviceId du manager connecté
      const serviceTickets = ticketsData.filter((t) => t.serviceId === serviceId);
      setTickets(serviceTickets);
    } catch (err) {
      console.error("Erreur lors du chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serviceId) fetchData();
  }, [serviceId]);

  // ✅ Logique de filtrage dynamique
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Filtrage par Statut
      const matchesStatus = filterStatus === "Tous" || t.status === filterStatus;
      
      // Filtrage par Catégorie
      const categoryValue = t.category || t.categorie || "N/A";
      const matchesCategory = filterCategory === "Tous" || categoryValue === filterCategory;
      
      // Filtrage par Assignation (vérifie si un technicien est présent)
      const isAssigned = !!(t.assignedTo || t.technicianId || t.technicienId);
      const matchesAssignment = 
        filterAssignment === "Tous" || 
        (filterAssignment === "Assigné" && isAssigned) || 
        (filterAssignment === "Non assigné" && !isAssigned);

      return matchesStatus && matchesCategory && matchesAssignment;
    });
  }, [tickets, filterStatus, filterCategory, filterAssignment]);

  // Générer la liste des catégories uniques présentes dans les tickets
  const categories = useMemo(() => {
    const cats = tickets.map(t => t.category || t.categorie || "N/A");
    return ["Tous", ...new Set(cats)];
  }, [tickets]);

  const handleRowClick = (id) => navigate(`/${role}/tickets-service/${id}`);

  // Formattage de la date SLA
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Styles des badges
  const priorityStyle = {
    Critique: "bg-red-100 text-red-700 border border-red-200",
    Haute: "bg-orange-100 text-orange-700 border border-orange-200",
    Moyenne: "bg-blue-100 text-blue-700 border border-blue-200",
    Basse: "bg-gray-100 text-gray-600 border border-gray-200",
    // Fallback pour les valeurs en anglais si nécessaire
    critical: "bg-red-100 text-red-700 border border-red-200",
    high: "bg-orange-100 text-orange-700 border border-orange-200",
    medium: "bg-blue-100 text-blue-700 border border-blue-200",
    low: "bg-gray-100 text-gray-600 border border-gray-200",
  };
  
  const statusStyle = {
    Ouvert: "bg-blue-100 text-blue-700",
    "En cours": "bg-yellow-100 text-yellow-700",
    "En attente": "bg-purple-100 text-purple-700",
    Résolu: "bg-green-100 text-green-700",
    Fermé: "bg-gray-200 text-gray-600",
    // Fallback pour les valeurs techniques
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    resolved: "bg-green-100 text-green-700",
    closed: "bg-gray-200 text-gray-600",
  };

  if (loading) return <div className="p-6 text-gray-400 animate-pulse">Chargement des données...</div>;

  return (
    <div className="p-6 bg-slate-100 min-h-screen font-sans">
      
      {/* HEADER & TITRE */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Tickets du service {fullUser?.services?.name || "..."}
            </h1>
            
          </div>
          
          <button 
            onClick={fetchData} 
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-all text-gray-600"
            title="Actualiser la liste"
          >
             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
             </svg>
          </button>
        </div>

        {/* ── BARRE DE FILTRES (3 MENUS) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          
          {/* Statut */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Statut</label>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-gray-700 font-medium"
            >
              <option value="Tous">Tous les statuts</option>
              {Object.keys(statusStyle).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Catégorie */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Catégorie</label>
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-gray-700 font-medium"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Assignation */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Assignation</label>
            <select 
              value={filterAssignment}
              onChange={(e) => setFilterAssignment(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-gray-700 font-medium"
            >
              <option value="Tous">Tous les tickets</option>
              <option value="Assigné">Assignés</option>
              <option value="Non assigné">Non assignés</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLEAU DES TICKETS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4 text-left font-semibold">Titre</th>
              <th className="p-4 text-left font-semibold">Description</th>
              <th className="p-4 text-center font-semibold">Catégorie</th>
              <th className="p-4 text-center font-semibold">Priorité</th>
              <th className="p-4 text-center font-semibold">Statut</th>
              <th className="p-4 text-center font-semibold">Échéance SLA</th>
              <th className="p-4 text-center font-semibold">Employé</th>
              <th className="p-4 text-center font-semibold">Technicien</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((t) => (
              <tr 
                key={t.id} 
                onClick={() => handleRowClick(t.id)} 
                className="border-t border-gray-50 hover:bg-blue-50/50 cursor-pointer transition-colors group"
              >
                <td className="p-4 font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                  {t.title}
                </td>
                <td className="p-4 text-gray-500 max-w-[200px] truncate">
                  {t.description}
                </td>
                <td className="p-4 text-center">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {t.category || t.categorie || "N/A"}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${priorityStyle[t.priority] || "bg-gray-100"}`}>
                    {t.priority}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${statusStyle[t.status] || "bg-gray-100"}`}>
                    {t.status}
                  </span>
                </td>
                {/* COLONNE SLA AJOUTÉE ICI */}
                <td className="p-4 text-center font-medium text-gray-600">
                  {formatDate(t.sla || t.sla_due_date)}
                </td>
                <td className="p-4 text-center text-gray-700">
                  {t.employee?.name} {t.employee?.surname}
                </td>
                <td className="p-4 text-center">
                   {t.assignedTo ? (
                     <span className="text-gray-700 font-medium">{t.assignedTo}</span>
                   ) : (
                     <span className="text-gray-400 italic text-xs">Non assigné</span>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredTickets.length === 0 && (
          <div className="p-20 text-center text-gray-400 italic bg-white">
            Aucun ticket ne correspond aux filtres sélectionnés.
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsServicePage;