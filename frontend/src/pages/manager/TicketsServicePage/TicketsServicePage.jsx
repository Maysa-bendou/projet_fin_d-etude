import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ── COMPOSANT SLA BAR (Logique dynamique) ──
const SlaBar = ({ slaDueDate }) => {
  if (!slaDueDate) return <span className="text-gray-400 text-xs italic">N/A</span>;

  const now = new Date().getTime();
  const due = new Date(slaDueDate).getTime();
  const diffMs = due - now;
  const isExpired = diffMs <= 0;

  // Fenêtre de 24h pour le calcul du pourcentage visuel
  const totalWindow = 24 * 60 * 60 * 1000; 
  const percentage = isExpired ? 100 : Math.max(0, Math.min(100, ((totalWindow - diffMs) / totalWindow) * 100));

  const absDiff = Math.abs(diffMs);
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

  let barColor = "bg-green-500";
  if (isExpired) barColor = "bg-red-500";
  else if (hours < 2) barColor = "bg-red-400";
  else if (hours < 6) barColor = "bg-orange-400";

  return (
    <div className="flex flex-col gap-1 w-full max-w-[120px]">
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${barColor}`}
          style={{ width: `${isExpired ? 100 : percentage}%` }}
        ></div>
      </div>
      <span className={`text-[10px] font-bold uppercase whitespace-nowrap ${isExpired ? "text-red-600" : "text-gray-500"}`}>
        {isExpired ? `Dépassé de ${hours}h ${minutes}m` : `${hours}h ${minutes}m restantes`}
      </span>
    </div>
  );
};

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
  const [dbEnums, setDbEnums] = useState({ statuts: [], categories: [] });

  // États des filtres
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [filterCategory, setFilterCategory] = useState("Tous");
  const [filterAssignment, setFilterAssignment] = useState("Tous");

  // Mapping pour l'affichage FR
  const statusFR = { open: "Ouvert", in_progress: "En cours", pending: "En attente", resolved: "Résolu", closed: "Fermé" };
  const categoryFR = { hardware: "Hardware", software: "Logiciels", network: "Réseau", access: "Accès", security: "Sécurité" };

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      // 1. Récupérer les Enums (Statuts et Catégories) depuis la DB
      const enumRes = await fetch("http://localhost:3001/api/tech/enums");
      if (enumRes.ok) {
        const enumData = await enumRes.json();
        setDbEnums({
          statuts: enumData.statuts.map(s => statusFR[s] || s),
          categories: enumData.categories.map(c => categoryFR[c] || c)
        });
      }

      // 2. Récupérer le profil
      const profileRes = await fetch("http://localhost:3001/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setFullUser(profileData);
      }

      // 3. Récupérer tous les tickets
      const ticketsRes = await fetch("http://localhost:3001/api/tickets");
      const ticketsData = await ticketsRes.json();
      
      const serviceTickets = ticketsData.filter((t) => (t.serviceId || t.service_id) === serviceId);
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
      const currentStatus = statusFR[t.status] || t.status;
      const currentCat = categoryFR[t.category] || t.category || "N/A";

      const matchesStatus = filterStatus === "Tous" || currentStatus === filterStatus;
      const matchesCategory = filterCategory === "Tous" || currentCat === filterCategory;

      const isAssigned = !!(t.assignedTo || t.assigned_to || t.users_tickets_assigned_toTousers);
      const matchesAssignment = 
        filterAssignment === "Tous" || 
        (filterAssignment === "Assigné" && isAssigned) || 
        (filterAssignment === "Non assigné" && !isAssigned);

      return matchesStatus && matchesCategory && matchesAssignment;
    });
  }, [tickets, filterStatus, filterCategory, filterAssignment]);

  const handleRowClick = (id) => navigate(`/${role}/tickets-service/${id}`);

  // Styles des badges
  const priorityStyle = {
    Critique: "bg-red-100 text-red-700 border border-red-200",
    Haute: "bg-orange-100 text-orange-700 border border-orange-200",
    Moyenne: "bg-blue-100 text-blue-700 border border-blue-200",
    Basse: "bg-gray-100 text-gray-600 border border-gray-200",
    critical: "bg-red-100 text-red-700 border border-red-200",
    high: "bg-orange-100 text-orange-700 border border-orange-200",
  };
  
  const statusStyle = {
    Ouvert: "bg-blue-100 text-blue-700",
    "En cours": "bg-yellow-100 text-yellow-700",
    "En attente": "bg-purple-100 text-purple-700",
    Résolu: "bg-green-100 text-green-700",
    Fermé: "bg-gray-200 text-gray-600",
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
  };

  if (loading) return <div className="p-6 text-gray-400 animate-pulse">Chargement des données...</div>;

  return (
    <div className="p-6 bg-slate-100 min-h-screen font-sans">
      
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

        {/* BARRE DE FILTRES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Statut</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm outline-none"
            >
              <option value="Tous">Tous les statuts</option>
              {dbEnums.statuts.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Catégorie</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm outline-none"
            >
              <option value="Tous">Toutes les catégories</option>
              {dbEnums.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Assignation</label>
            <select
              value={filterAssignment}
              onChange={(e) => setFilterAssignment(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm outline-none"
            >
              <option value="Tous">Tous les tickets</option>
              <option value="Assigné">Assignés</option>
              <option value="Non assigné">Non assignés</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLEAU */}
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
            {filteredTickets.map((t) => {
              const employee = t.employee || t.users_tickets_created_byTousers;
              const technician = t.assignedTo || t.assigned_to || t.users_tickets_assigned_toTousers?.name;

              return (
                <tr
                  key={t.id}
                  onClick={() => handleRowClick(t.id)}
                  className="border-t border-gray-50 hover:bg-blue-50/60 cursor-pointer transition-all group"
                >
                  <td className="p-4 font-medium text-gray-800 group-hover:text-blue-700">{t.title || "N/A"}</td>
                  <td className="p-4 text-gray-500 max-w-[200px] truncate">{t.description || "N/A"}</td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {categoryFR[t.category] || t.category || "N/A"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityStyle[t.priority] || "bg-gray-100"}`}>
                      {t.priority || "N/A"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle[t.status] || "bg-gray-100"}`}>
                      {statusFR[t.status] || t.status || "N/A"}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center">
                    <SlaBar slaDueDate={t.sla_due_date || t.sla} />
                  </td>
                  <td className="p-4 text-center text-gray-700">
                    {employee?.name ? `${employee.name} ${employee.surname || ""}` : "N/A"}
                  </td>
                  <td className="p-4 text-center">
                    {technician ? (
                      <span className="text-gray-700 font-medium">{technician}</span>
                    ) : (
                      <span className="text-orange-400 italic text-xs font-medium">Non assigné</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredTickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <p className="text-sm font-medium">Aucun ticket trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsServicePage;