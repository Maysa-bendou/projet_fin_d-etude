import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import RefreshButton from "../../../components/common/RefreshButton";

const SlaBar = ({ slaDueDate, slaDebut }) => {
  if (!slaDueDate) return <span className="text-gray-400 text-[10px] italic">N/A</span>;

  const now = Date.now();
  const due = new Date(slaDueDate).getTime();
  const debut = slaDebut ? new Date(slaDebut).getTime() : due - 24 * 3600000;
  const diffMs = due - now;
  const totalMs = due - debut;
  const isExpired = diffMs <= 0;
  const percentage = isExpired ? 100 : Math.max(0, Math.min(100, ((totalMs - diffMs) / totalMs) * 100));

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
        <div className={`h-full transition-all duration-500 ${barColor}`} style={{ width: `${percentage}%` }} />
      </div>
      <span className={`text-[9px] font-black uppercase whitespace-nowrap ${isExpired ? "text-red-600" : "text-gray-500"}`}>
        {isExpired ? `Dépassé de ${hours}h` : `${hours}h ${minutes}m`}
      </span>
    </div>
  );
};

const TicketsServicePage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role || "";
  const serviceId = user?.serviceId || user?.service_id || null;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbEnums, setDbEnums] = useState({ statuts: [], categories: [] });
  
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [filterCategory, setFilterCategory] = useState("Tous");
  const [filterAssignment, setFilterAssignment] = useState("Tous");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const enumRes = await fetch("http://localhost:3001/api/tech/enums");
      const enumData = await enumRes.json();
      setDbEnums(enumData);

      const res = await fetch("http://localhost:3001/api/tickets");
      const data = await res.json();
      const filtered = data.filter((t) => (t.serviceId || t.service_id) === serviceId);
      setTickets(filtered);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    if (serviceId) fetchData();
  }, [serviceId, fetchData]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesStatus = filterStatus === "Tous" || t.status === filterStatus;
      const catValue = t.category || t.categorie || "N/A";
      const matchesCategory = filterCategory === "Tous" || catValue === filterCategory;
      const isAssigned = !!(t.assignedTo || t.assigned_to || t.users_tickets_assigned_toTousers);
      const matchesAssignment = filterAssignment === "Tous" || (filterAssignment === "Assigné" && isAssigned) || (filterAssignment === "Non assigné" && !isAssigned);
      return matchesStatus && matchesCategory && matchesAssignment;
    });
  }, [tickets, filterStatus, filterCategory, filterAssignment]);

  const priorityStyle = {
    Critique: "bg-[#fff1f1] text-[#df2020] border border-[#fee2e2]",
    Haute: "bg-[#fff1f1] text-[#df2020] border border-[#fee2e2]",
    Moyenne: "bg-[#fff9eb] text-[#d99706] border border-[#fef0c7]",
    Basse: "bg-[#eefdf3] text-[#11a75c] border border-[#d1f7e0]",
    critical: "bg-[#fff1f1] text-[#df2020] border border-[#fee2e2]",
    high: "bg-[#fff1f1] text-[#df2020] border border-[#fee2e2]",
    medium: "bg-[#fff9eb] text-[#d99706] border border-[#fef0c7]",
    low: "bg-[#eefdf3] text-[#11a75c] border border-[#d1f7e0]",
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

  if (loading) return <div className="p-8 text-gray-400 font-bold uppercase text-xs tracking-widest">Chargement...</div>;

  return (
    <div className="p-8 min-h-screen bg-[#f9f6f2] font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">
            {role === "manager" ? "Gestion des tickets" : "Tickets du service"}
          </h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {filteredTickets.length} ticket(s) trouvé(s)
          </p>
        </div>
        <RefreshButton onRefresh={fetchData} />
      </div>

      {/* CARRÉ BLANC PRINCIPAL */}
      <div className="bg-white rounded-[32px] border-2 border-[#d9d4cc] shadow-sm p-8">
        
        <h2 className="text-xl font-bold text-slate-800 mb-6">Filtres et recherche</h2>

        {/* BARRE DE FILTRES STYLE IMAGE 3 & 11 */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex flex-col gap-1 min-w-[200px]">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#fcfafb] border border-gray-200 rounded-xl py-2.5 px-4 text-sm outline-none text-gray-600 focus:ring-2 focus:ring-blue-50"
            >
              <option value="Tous">Tous les statuts</option>
              {dbEnums.statuts?.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1 min-w-[200px]">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#fcfafb] border border-gray-200 rounded-xl py-2.5 px-4 text-sm outline-none text-gray-600 focus:ring-2 focus:ring-blue-50"
            >
              <option value="Tous">Toutes les catégories</option>
              {dbEnums.categories?.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1 min-w-[200px]">
            <select
              value={filterAssignment}
              onChange={(e) => setFilterAssignment(e.target.value)}
              className="bg-[#fcfafb] border border-gray-200 rounded-xl py-2.5 px-4 text-sm outline-none text-gray-600 focus:ring-2 focus:ring-blue-50"
            >
              <option value="Tous">Toutes les assignations</option>
              <option value="Assigné">Assignés</option>
              <option value="Non assigné">Non assignés</option>
            </select>
          </div>

          <button 
            onClick={() => { setFilterStatus("Tous"); setFilterCategory("Tous"); setFilterAssignment("Tous"); }}
            className="text-red-600 font-bold px-4 py-2.5 hover:bg-red-50 rounded-xl transition-colors text-sm"
          >
            Réinitialiser
          </button>
        </div>

        {/* TABLEAU STYLISÉ BEIGE */}
        <div className="overflow-hidden border-2 border-[#eeebe7] rounded-[24px] bg-[#f9f6f2]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-black text-[#94a3b8] uppercase tracking-[0.15em] bg-[#f9f6f2] border-b border-[#eeebe7]">
                <th className="px-6 py-4">Titre / ID</th>
                <th className="px-6 py-4">Catégorie</th>
                <th className="px-6 py-4">Priorité</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Échéance SLA</th>
                <th className="px-6 py-4">Employé</th>
                <th className="px-6 py-4 text-right">Technicien</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eeebe7] bg-white">
              {filteredTickets.map((t) => {
                const employee = t.employee || t.users_tickets_created_byTousers;
                const technician = t.assignedTo || t.users_tickets_assigned_toTousers?.name;

                return (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/${role}/tickets-service/${t.id}`)}
                    className="hover:bg-[#f3f0ec] cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <p className="text-xs font-black text-slate-300 mb-0.5">#{t.id}</p>
                      <p className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors truncate max-w-[180px]">
                        {t.title || "N/A"}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black uppercase text-slate-400">
                        {t.category || t.categorie || "N/A"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${priorityStyle[t.priority] || "bg-gray-100 text-gray-500"}`}>
                        {t.priority || "N/A"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase ${statusStyle[t.status] || "bg-gray-100 text-gray-500"}`}>
                        {t.status || "N/A"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <SlaBar slaDueDate={t.sla_date_limite} slaDebut={t.sla_date_debut} />
                    </td>

                    <td className="px-6 py-5 text-sm font-medium text-slate-500">
                      {employee?.name ? `${employee.name}` : "N/A"}
                    </td>

                    <td className="px-6 py-5 text-right">
                      {technician ? (
                        <span className="text-sm font-bold text-slate-700">{technician}</span>
                      ) : (
                        <span className="text-[10px] font-black uppercase text-orange-400 italic">Non assigné</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredTickets.length === 0 && (
            <div className="bg-white py-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
              Aucun ticket trouvé
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketsServicePage;