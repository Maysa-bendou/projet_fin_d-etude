import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// ── COMPOSANT SLA BAR (Maintenu selon ta logique, style ajusté) ──
const SlaBar = ({ slaDueDate, slaDebut }) => {
  if (!slaDueDate) return <span className="text-slate-400 text-[10px] italic">En attente</span>;

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
  else if (hours < 2) barColor = "bg-orange-500";

  return (
    <div className="flex flex-col gap-1 w-full max-w-[100px]">
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div className={`h-full transition-all duration-500 ${barColor}`} style={{ width: `${percentage}%` }} />
      </div>
      <span className={`text-[10px] font-medium ${isExpired ? "text-red-500" : "text-slate-400"}`}>
        {isExpired ? `Expiré` : `${hours}h ${minutes}m`}
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
  const [fullUser, setFullUser] = useState(null);
  const [dbEnums, setDbEnums] = useState({ statuts: [], categories: [] });

  const [filterStatus, setFilterStatus] = useState("Tous");
  const [filterCategory, setFilterCategory] = useState("Tous");
  const [filterAssignment, setFilterAssignment] = useState("Tous");

  const statusFR = { open: "Ouvert", in_progress: "En cours", pending: "En attente", resolved: "Résolu", closed: "Fermé" };
  const categoryFR = { hardware: "hardware", software: "software", network: "network", access: "access", security: "security" };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [enumRes, profileRes, ticketsRes] = await Promise.all([
        fetch("http://localhost:3001/api/tech/enums"),
        fetch("http://localhost:3001/api/profile", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:3001/api/tickets")
      ]);

      if (enumRes.ok) {
        const enumData = await enumRes.json();
        setDbEnums({
          statuts: enumData.statuts.map(s => statusFR[s] || s),
          categories: enumData.categories.map(c => categoryFR[c] || c)
        });
      }
      if (profileRes.ok) setFullUser(await profileRes.json());
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        setTickets(ticketsData.filter((t) => (t.serviceId || t.service_id) === serviceId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (serviceId) fetchData(); }, [serviceId]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const curStatus = statusFR[t.status] || t.status;
      const curCat = categoryFR[t.category] || t.category || "N/A";
      const matchesStatus = filterStatus === "Tous" || curStatus === filterStatus;
      const matchesCategory = filterCategory === "Tous" || curCat === filterCategory;
      const isAssigned = !!(t.assignedTo || t.assigned_to || t.users_tickets_assigned_toTousers);
      const matchesAssignment = filterAssignment === "Tous" || (filterAssignment === "Assigné" && isAssigned) || (filterAssignment === "Non assigné" && !isAssigned);
      return matchesStatus && matchesCategory && matchesAssignment;
    });
  }, [tickets, filterStatus, filterCategory, filterAssignment]);

  if (loading) return <div className="p-8 text-sm font-medium text-slate-400 animate-pulse">Chargement des données...</div>;

  return (
    <div className="p-6 font-sans">
      
      {/* HEADER SECTION */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0f172a] mb-1">Mes Tickets</h1>
        <p className="text-sm text-slate-500">Suivez et gérez l'état de vos demandes de support.</p>
      </div>

      {/* FILTRES SECTION - Style identique à la capture 2 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          {[ 
            { label: "STATUT", value: filterStatus, setter: setFilterStatus, options: ["Tous", ...dbEnums.statuts] },
            { label: "CATÉGORIE", value: filterCategory, setter: setFilterCategory, options: ["Tous", ...dbEnums.categories] },
            { label: "ASSIGNATION", value: filterAssignment, setter: setFilterAssignment, options: ["Tous", "Assigné", "Non assigné"] }
          ].map((f, i) => (
            <div key={i} className="flex flex-col gap-2 min-w-[200px]">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{f.label}</label>
              <select
                value={f.value}
                onChange={(e) => f.setter(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:border-blue-400 transition-all cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
              >
                {f.options.map((opt) => <option key={opt} value={opt}>{opt === "Tous" ? `Tous les ${f.label.toLowerCase()}s` : opt}</option>)}
              </select>
            </div>
          ))}
          <button 
            onClick={() => { setFilterStatus("Tous"); setFilterCategory("Tous"); setFilterAssignment("Tous"); }}
            className="px-6 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 transition-all"
          >
            Réinitialiser
          </button>
          <div className="ml-auto text-sm font-bold text-slate-900">
            {filteredTickets.length} <span className="text-slate-400 font-normal">tickets</span>
          </div>
        </div>
      </div>

      {/* TABLE SECTION - Style "Capture 1 & 2" */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#fcfaf9] border-b border-slate-100">
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Titre</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Priorité</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Statut</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">SLA</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Assigné à</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredTickets.map((t) => {
              const technician = t.assignedTo || t.assigned_to || t.users_tickets_assigned_toTousers?.name;
              
              // Logique de couleur pour les priorités (exactement comme la capture)
              const getPriorityStyle = (p) => {
                const prio = p?.toLowerCase();
                if (prio === 'haute' || prio === 'high' || prio === 'critique') 
                  return "bg-[#fff1f1] text-[#f87171] border-[#fee2e2]";
                if (prio === 'moyenne' || prio === 'normale' || prio === 'medium') 
                  return "bg-[#fffbeb] text-[#fbbf24] border-[#fef3c7]";
                return "bg-[#f0fdf4] text-[#4ade80] border-[#dcfce7]";
              };

              return (
                <tr key={t.id} onClick={() => navigate(`/${role}/tickets-service/${t.id}`)} className="hover:bg-slate-50/50 cursor-pointer transition-colors group">
                  <td className="px-6 py-5 text-sm text-slate-400 font-medium">#{t.id}</td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-[#0f172a] text-[14px]">{t.title || "N/A"}</div>
                    <div className="text-[12px] text-slate-400 truncate max-w-[200px]">{t.description}</div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-3 py-1 rounded-md text-[11px] font-bold border ${getPriorityStyle(t.priority)}`}>
                      {t.priority || "Normale"}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-4 py-1 rounded-full text-[11px] font-bold border ${
                      t.status === 'open' || t.status === 'Ouvert' ? 'bg-[#eff6ff] text-[#3b82f6] border-[#dbeafe]' : 
                      'bg-[#f5f3ff] text-[#8b5cf6] border-[#ede9fe]'
                    }`}>
                      {statusFR[t.status] || t.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <SlaBar slaDueDate={t.sla_date_limite} slaDebut={t.sla_date_debut} />
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-semibold text-slate-700">{technician || "Non assigné"}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredTickets.length === 0 && (
          <div className="py-20 text-center bg-white">
            <p className="text-slate-400 text-sm">Aucun ticket ne correspond à vos filtres.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsServicePage;