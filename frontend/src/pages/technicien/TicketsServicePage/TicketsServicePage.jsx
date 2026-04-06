import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ✅ Nouveau composant SlaBar pour l'affichage visuel
// ✅ SlaBar corrigé — barre proportionnelle à la vraie durée SLA
const SlaBar = ({ slaDueDate, slaDebut }) => {
  if (!slaDueDate) return <span className="text-gray-400 text-xs italic">N/A</span>;

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
  if (isExpired)    barColor = "bg-red-500";
  else if (hours < 2) barColor = "bg-red-400";
  else if (hours < 6) barColor = "bg-orange-400";

  return (
    <div className="flex flex-col gap-1 w-full max-w-[120px]">
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }} />
      </div>
      <span className={`text-[10px] font-bold uppercase whitespace-nowrap ${isExpired ? "text-red-600" : "text-gray-500"}`}>
        {isExpired ? `Dépassé de ${hours}h ${minutes}m` : `${hours}h ${minutes}m restantes`}
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

  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });
  const tooltipTimer = useRef(null);

  const fetchData = async () => {
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
  };

  useEffect(() => {
    if (serviceId) fetchData();
  }, [serviceId]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesStatus = filterStatus === "Tous" || t.status === filterStatus;
      const catValue = t.category || t.categorie || "N/A";
      const matchesCategory = filterCategory === "Tous" || catValue === filterCategory;

      const isAssigned = !!(t.assignedTo || t.assigned_to || t.users_tickets_assigned_toTousers);
      const matchesAssignment =
        filterAssignment === "Tous" ||
        (filterAssignment === "Assigné" && isAssigned) ||
        (filterAssignment === "Non assigné" && !isAssigned);

      return matchesStatus && matchesCategory && matchesAssignment;
    });
  }, [tickets, filterStatus, filterCategory, filterAssignment]);

  const handleRowClick = (id) => {
    navigate(`/${role}/tickets-service/${id}`);
  };

  const handleMouseEnter = (e) => {
    const { clientX, clientY } = e;
    tooltipTimer.current = setTimeout(() => {
      setTooltip({ visible: true, x: clientX, y: clientY });
    }, 300);
  };

  const handleMouseMove = (e) => {
    setTooltip((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
  };

  const handleMouseLeave = () => {
    clearTimeout(tooltipTimer.current);
    setTooltip({ visible: false, x: 0, y: 0 });
  };

  const priorityStyle = {
    Critique: "bg-red-100 text-red-700 border border-red-200",
    Haute: "bg-orange-100 text-orange-700 border border-orange-200",
    Moyenne: "bg-blue-100 text-blue-700 border border-blue-200",
    Basse: "bg-gray-100 text-gray-600 border border-gray-200",
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
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-3 text-gray-400">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Chargement des tickets…
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-100 min-h-screen font-sans">
      {tooltip.visible && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs shadow-xl transition-opacity duration-150"
          style={{ left: tooltip.x + 14, top: tooltip.y - 36 }}
        >
          Cliquer pour voir le détail de ce ticket
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {role === "manager" ? "Gestion des tickets" : "Tickets du service"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filteredTickets.length} ticket{filteredTickets.length !== 1 ? "s" : ""} affiché(s)
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition-all"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </button>
      </div>

      {/* ✅ FILTERS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Statut</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="Tous">Tous les statuts</option>
            {dbEnums.statuts?.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Catégorie</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="Tous">Toutes les catégories</option>
            {dbEnums.categories?.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Assignation</label>
          <select
            value={filterAssignment}
            onChange={(e) => setFilterAssignment(e.target.value)}
            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="Tous">Tous les tickets</option>
            <option value="Assigné">Assignés</option>
            <option value="Non assigné">Non assignés</option>
          </select>
        </div>
      </div>

      {/* ── TABLE ── */}
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
              const technician = t.assignedTo || t.users_tickets_assigned_toTousers?.name;

              return (
                <tr
                  key={t.id}
                  onClick={() => handleRowClick(t.id)}
                  onMouseEnter={handleMouseEnter}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  className="border-t border-gray-50 hover:bg-blue-50/60 cursor-pointer transition-colors duration-150 group"
                >
                  <td className="p-4 font-medium text-gray-800 group-hover:text-blue-700">
                    {t.title || "N/A"}
                  </td>

                  <td className="p-4 text-gray-500 max-w-[200px] truncate">
                    {t.description || "N/A"}
                  </td>

                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {t.category || t.categorie || "N/A"}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityStyle[t.priority] || "bg-gray-100 text-gray-500"}`}>
                      {t.priority || "N/A"}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle[t.status] || "bg-gray-100 text-gray-500"}`}>
                      {t.status || "N/A"}
                    </span>
                  </td>

                  {/* ✅ SLA AVEC BARRE VISUELLE */}
                  <td className="p-4 flex justify-center">
               <SlaBar slaDueDate={t.sla_date_limite} slaDebut={t.sla_date_debut} />
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
            <svg className="h-10 w-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium">Aucun ticket ne correspond à vos filtres</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsServicePage;
