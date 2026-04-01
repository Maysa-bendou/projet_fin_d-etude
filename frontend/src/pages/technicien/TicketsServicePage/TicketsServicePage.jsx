import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

const TicketsServicePage = () => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role || "";
  const serviceId = user?.serviceId || user?.service_id || null;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ New Filter States
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [filterCategory, setFilterCategory] = useState("Tous");
  const [filterAssignment, setFilterAssignment] = useState("Tous");

  // Tooltip state
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });
  const tooltipTimer = useRef(null);

  const fetchData = () => {
    setLoading(true);
    fetch("http://localhost:3001/api/tickets")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((t) => t.serviceId === serviceId);
        setTickets(filtered);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching tickets:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (serviceId) fetchData();
  }, [serviceId]);

  // ✅ Extract unique categories for the dropdown
  const categories = useMemo(() => {
    const cats = tickets.map((t) => t.category || t.categorie || "N/A");
    return ["Tous", ...new Set(cats)];
  }, [tickets]);

  // ✅ Logic for Category, Status, and Assignment filtering
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesStatus = filterStatus === "Tous" || t.status === filterStatus;
      
      const catValue = t.category || t.categorie || "N/A";
      const matchesCategory = filterCategory === "Tous" || catValue === filterCategory;

      const isAssigned = !!(t.assignedTo || t.technicienId);
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

        {/* ✅ REFRESH BUTTON */}
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
        {/* Status Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Statut</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="Tous">Tous les statuts</option>
            {Object.keys(statusStyle).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Catégorie</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Assignment Filter */}
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
            {filteredTickets.map((t) => (
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

                {/* ✅ SLA COLUMN */}
                <td className="p-4 text-center">
                  <span className="text-gray-600 font-medium">
                    {t.sla || t.sla_due_date ? new Date(t.sla || t.sla_due_date).toLocaleDateString('fr-FR') : "N/A"}
                  </span>
                </td>

                <td className="p-4 text-center text-gray-700">
                  {t.employee?.name ? `${t.employee.name} ${t.employee.surname || ""}` : "N/A"}
                </td>

                <td className="p-4 text-center">
                  {t.assignedTo ? (
                    <span className="text-gray-700 font-medium">{t.assignedTo}</span>
                  ) : (
                    <span className="text-orange-400 italic text-xs font-medium">Non assigné</span>
                  )}
                </td>
              </tr>
            ))}
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
