import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

const TicketsServicePage = () => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role || "";
  const serviceId = user?.serviceId || user?.service_id || null;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Tooltip state
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });
  const tooltipTimer = useRef(null);

// Inside TicketsServicePage.js
useEffect(() => {
  fetch("http://localhost:3001/api/tickets")
    .then((res) => res.json())
    .then((data) => {
      // DYNAMIC FILTER: Only show tickets belonging to the tech's service
      const filtered = data.filter((t) => t.serviceId === serviceId);
      setTickets(filtered);
      setLoading(false);
    });
}, [serviceId]);

  // ✅ Search filter
  const filteredTickets = useMemo(() => {
    return tickets.filter(
      (t) =>
        (t.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.description || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [tickets, search]);

  // ✅ Navigate to detail on row click
  const handleRowClick = (id) => {
    navigate(`/${role}/tickets-service/${id}`);
  };

  // ✅ Tooltip handlers
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

  const handleTakeCharge = async () => {
  setTaking(true);

  setTimeout(async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/tickets/${id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicienId: techId }),
      });

      if (response.ok) {
        setTicket((prev) => ({
          ...prev,
          status: "in_progress",
          technician: { name: user.name, surname: user.surname },
        }));

        // ✅ Redirect after successful assign
        setTimeout(() => {
          navigate("/tickets/assigned");   // 👈 adjust path to match your router
        }, 800); // small delay so user sees the button feedback
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setTaking(false);
    }
  }, 1500);
};

  // ✅ Priority badge styles
  const priorityStyle = {
    Critique: "bg-red-100 text-red-700 border border-red-200",
    Haute: "bg-orange-100 text-orange-700 border border-orange-200",
    Moyenne: "bg-blue-100 text-blue-700 border border-blue-200",
    Basse: "bg-gray-100 text-gray-600 border border-gray-200",
  };

  // ✅ Status badge styles
  const statusStyle = {
    Ouvert: "bg-blue-100 text-blue-700",
    "En cours": "bg-yellow-100 text-yellow-700",
    "En attente": "bg-purple-100 text-purple-700",
    Résolu: "bg-green-100 text-green-700",
    Fermé: "bg-gray-200 text-gray-600",
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

      {/* ── Tooltip ── */}
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
            {filteredTickets.length} ticket{filteredTickets.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher par titre ou description…"
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                {/* Title */}
                <td className="p-4 font-medium text-gray-800 group-hover:text-blue-700 transition-colors">
                  {t.title || "N/A"}
                </td>

                {/* Description */}
                <td className="p-4 text-gray-500 max-w-[200px] truncate">
                  {t.description || "N/A"}
                </td>

                {/* Category */}
                <td className="p-4 text-center">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {t.category || t.categorie || "N/A"}
                  </span>
                </td>

                {/* Priority */}
                <td className="p-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityStyle[t.priority] || "bg-gray-100 text-gray-500"}`}>
                    {t.priority || "N/A"}
                  </span>
                </td>

                {/* Status */}
                <td className="p-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle[t.status] || "bg-gray-100 text-gray-500"}`}>
                    {t.status || "N/A"}
                  </span>
                </td>

{/* Employee */}
<td className="p-4 text-center">
  <div className="flex flex-col items-center">
    <span className="text-gray-700">
      {t.employee?.name ? `${t.employee.name} ${t.employee.surname || ""}` : "N/A"}
    </span>

  </div>
</td>

                {/* Technician */}
                <td className="p-4 text-center">
                  {t.assignedTo ? (
                    <span className="text-gray-700">{t.assignedTo}</span>
                  ) : (
                    <span className="text-gray-400 italic text-xs">Non assigné</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty state */}
        {filteredTickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <svg className="h-10 w-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">Aucun ticket trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsServicePage;
