import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const sId = user.service_id;

  const [ticket, setTicket] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showList, setShowList] = useState(false);
  const [selectedTech, setSelectedTech] = useState(null);
  const [techActiveTickets, setTechActiveTickets] = useState({});

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    fetchTicket();
    fetchTechnicians();
  }, [id, sId]);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/tickets/${id}`);
      const data = await res.json();
      setTicket(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/tech/users/service/${sId}`);
      const data = await res.json();
      setTechnicians(data);

      // Fetch active tickets count for each technician
      const activeMap = {};
      await Promise.all(
        data.map(async (tech) => {
          try {
            const countRes = await fetch(
              `http://localhost:3001/api/manager/technician/${tech.id}/active-count`
            );
            if (countRes.ok) {
              const countData = await countRes.json();
              activeMap[tech.id] = countData.count ?? 0;
            } else {
              activeMap[tech.id] = 0;
            }
          } catch {
            activeMap[tech.id] = 0;
          }
        })
      );
      setTechActiveTickets(activeMap);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async () => {
    if (!selectedTech) return;
    const isUpdating = !!(ticket?.technician);
    try {
      const res = await fetch(`http://localhost:3001/api/tickets/${id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technicienId: selectedTech.id,
          action: isUpdating ? "updated" : "assigned",
          assigned_by: user.id,
        }),
      });

      if (res.ok) {
        setModalMessage(
          `Ticket ${isUpdating ? "réassigné à" : "assigné à"} ${selectedTech.name} ${selectedTech.surname}`
        );
        setShowModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/manager/tickets-service");
  };

 const calculateSLA = () => {
  if (!ticket?.sla_date_limite) return null;

  const PAUSED   = ["pending", "pending_supplier"];
  const TERMINAL = ["resolved", "closed", "rejected"];
  const now      = Date.now();
  const due      = new Date(ticket.sla_date_limite).getTime();
  const debut    = ticket.sla_date_debut ? new Date(ticket.sla_date_debut).getTime() : due - 24 * 3600000;
  const window   = due - debut;

  if (TERMINAL.includes(ticket.status)) {
    const closed   = ticket.closed_at ? new Date(ticket.closed_at).getTime() : due;
    const exceeded = closed > due;
    const delta    = Math.abs(closed - due);
    const h = Math.floor(delta / 3600000), m = Math.floor((delta % 3600000) / 60000);
    return { mode: "terminal", exceeded, pct: Math.min(100, Math.max(0, ((window - (due - closed)) / window) * 100)), text: exceeded ? `+${h}h ${m}m dépassé` : "Clôturé ✓" };
  }

  if (PAUSED.includes(ticket.status)) {
    const elapsed = ticket.sla_pause_elapsed_ms ? Number(ticket.sla_pause_elapsed_ms) : null;
    const frozen  = elapsed != null ? window - elapsed : Math.max(0, due - now);
    const h = Math.floor(frozen / 3600000), m = Math.floor((frozen % 3600000) / 60000);
    return { mode: "paused", pct: Math.min(100, ((window - frozen) / window) * 100), text: `⏸ ${h}h ${m}m figé` };
  }

  const remaining = due - now;
  const exceeded  = remaining <= 0;
  const abs       = Math.abs(remaining);
  const h = Math.floor(abs / 3600000), m = Math.floor((abs % 3600000) / 60000);
  return { mode: "active", exceeded, pct: Math.min(100, Math.max(0, (remaining / window) * 100)), text: exceeded ? `+${h}h ${m}m dépassé` : `${h}h ${m}m restantes` };
};
  if (loading) return <div className="p-20 text-center font-bold text-red-600">Chargement...</div>;

  const t = ticket;
  const employee = t?.employee || t?.users_tickets_created_byTousers;
  const assignedTech = t?.technician || null;
  const isAssigned = !!assignedTech;
  const sla = calculateSLA();

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] p-6 md:p-10 font-sans">

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
          <div className="bg-white p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] max-w-sm w-full text-center border-t-8 border-red-600 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-black mb-1 uppercase tracking-tight text-slate-900">{modalMessage}</h3>
            <p className="text-red-600 font-black mb-6 italic uppercase text-[10px] tracking-[0.2em]">Status : Open</p>
            <button onClick={handleCloseModal} className="w-full bg-black text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-600 transition shadow-lg">
              Confirm
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* --- COLONNE EMPLOYE --- */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sticky top-8">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl font-black mb-4">
                {employee?.name?.[0]}{employee?.surname?.[0]}
              </div>
              <h2 className="font-black text-slate-800 text-lg uppercase tracking-tighter">
                {employee?.name} {employee?.surname}
              </h2>
              <p className="text-red-600 text-[10px] font-black uppercase mt-1">Requérant</p>
            </div>
            <div className="space-y-4 border-t border-slate-50 pt-6">
              <ProfileItem label="Email" value={employee?.email} />
              <ProfileItem label="Département" value={employee?.department} />
              <ProfileItem label="Poste" value={employee?.job_title} />
              <ProfileItem label="Bureau" value={employee?.office} />
              <ProfileItem label="Contact" value={employee?.phone} />
            </div>
          </div>
        </div>

        {/* --- COLONNE TICKET --- */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{id}</span>
                <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">{t.title}</h1>
              </div>
              <span className="px-4 py-2 rounded-xl text-[10px] font-black uppercase border bg-blue-50 text-blue-600 border-blue-100">
                {t.status}
              </span>
            </div>

            <div className="mb-10">
              <h4 className="text-[10px] font-black text-red-600 uppercase mb-3 italic tracking-widest">Description de l'incident</h4>
              <p className="text-slate-600 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 italic leading-relaxed">
                "{t.description}"
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
              <SpecBox label="Priorité" value={t.priority} highlight />
              <SpecBox label="Impact" value={t.impact} />
              <SpecBox label="Urgence" value={t.urgency} />
              <SpecBox label="Catégorie" value={t.category} />
              <SpecBox label="Service" value={t.service} />
              <SpecBox label="Date" value={new Date(t.createdAt || t.created_at).toLocaleDateString()} />
            </div>

           {sla && (
  <div className="p-6 rounded-3xl border bg-slate-50 border-slate-100 mb-10">
    <div className="flex justify-between text-[10px] font-black uppercase mb-3 text-slate-500">
      <span className="flex items-center gap-2">
        Temps de résolution (SLA)
        {sla.mode === "paused" && (
          <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">En pause</span>
        )}
        {sla.mode === "terminal" && (
          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Clôturé</span>
        )}
      </span>
      <span className={
        sla.mode === "terminal" ? (sla.exceeded ? "text-red-500" : "text-emerald-500")
        : sla.mode === "paused" ? "text-purple-500"
        : sla.exceeded ? "text-red-500 animate-pulse" : ""
      }>
        {sla.text}
      </span>
    </div>
    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
      <div
        className={`h-full ${
          sla.mode === "terminal" ? (sla.exceeded ? "bg-red-400" : "bg-emerald-400")
          : sla.mode === "paused" ? "bg-purple-400"
          : sla.exceeded ? "bg-red-400" : "bg-emerald-400"
        }`}
        style={{ width: `${Math.round(100 - sla.pct)}%` }}
      />
    </div>
  </div>
)}

            {/* Expert assigné + bouton conditionnel */}
            <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Expert Assigné</p>
                {isAssigned ? (
                  <p className="font-bold text-slate-800">{assignedTech.name} {assignedTech.surname}</p>
                ) : (
                  <p className="font-bold text-orange-400 italic text-sm">Non assigné</p>
                )}
              </div>
              <button
                onClick={() => { setShowList(!showList); setSelectedTech(null); }}
                className={`w-full md:w-auto px-7 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition ${
                  showList
                    ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    : isAssigned
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-emerald-500 text-white hover:bg-emerald-600"
                }`}
              >
                {showList ? "Annuler" : isAssigned ? "Modifier l'expert" : "Assigner le ticket"}
              </button>
            </div>
          </div>

          {/* ── LISTE DÉROULANTE TECHNICIENS ── */}
          {showList && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

              {/* En-tête */}
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {isAssigned ? "Choisir un nouvel expert" : "Choisir un expert à assigner"}
                </p>
              </div>

              <ul className="divide-y divide-slate-50">
                {technicians.map((tech) => {
                  const isSelected = selectedTech?.id === tech.id;
                  const isCurrentlyAssigned = assignedTech?.id === tech.id;
                  const activeCount = techActiveTickets[tech.id] ?? 0;

                  return (
                    <li key={tech.id}>

                      {/* ── ROW ── */}
                      <div
                        onClick={() => setSelectedTech(isSelected ? null : tech)}
                        className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors
                          ${isSelected ? "bg-indigo-50/70" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0
                            ${isSelected ? "bg-indigo-100 text-indigo-500" : "bg-slate-100 text-slate-500"}`}>
                            {tech.name?.[0]}{tech.surname?.[0]}
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${isSelected ? "text-indigo-600" : "text-slate-700"}`}>
                              {tech.name} {tech.surname}
                              {isCurrentlyAssigned && (
                                <span className="ml-2 text-[8px] bg-blue-100 text-blue-500 px-1.5 py-0.5 rounded-full uppercase font-bold align-middle">
                                  Actuel
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400">{tech.job_title || "Technicien"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Badge tickets actifs */}
                          <span className={`text-[9px] font-semibold px-2.5 py-1 rounded-full
                            ${activeCount === 0
                              ? "bg-emerald-50 text-emerald-500"
                              : activeCount <= 3
                              ? "bg-amber-50 text-amber-500"
                              : "bg-red-50 text-red-400"
                            }`}>
                            {activeCount} actif{activeCount !== 1 ? "s" : ""}
                          </span>
                          {/* Chevron */}
                          <svg
                            className={`w-4 h-4 transition-transform duration-200 ${isSelected ? "rotate-180 text-indigo-300" : "text-slate-200"}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* ── DÉTAIL SOUS LA LIGNE ── */}
                      {isSelected && (
                        <div className="bg-indigo-50/40 border-t border-indigo-100/60 px-5 py-5">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">

                            {/* Infos */}
                            <div className="flex flex-wrap gap-x-8 gap-y-3">
                              <DetailField label="Email" value={tech.email} />
                              <DetailField label="Contact" value={tech.phone} />
                              <DetailField label="Bureau" value={tech.office} />
<DetailField
  value={`${activeCount} Tickets actif${activeCount !== 1 ? "s" : ""}`}
  valueClass={
    activeCount === 0
      ? "text-emerald-500"
      : activeCount <= 3
      ? "text-amber-500"
      : "text-red-400"
  }
/>
                            </div>

                            {/* Bouton confirmer */}
                            <button
                              onClick={handleAssign}
                              className="whitespace-nowrap bg-indigo-500 text-white px-7 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition shadow-sm"
                            >
                              {isAssigned ? "Confirmer la modification" : "Confirmer l'assignation"}
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

/* ── Small helper components ── */

const ProfileItem = ({ label, value }) => (
  <div className="border-b border-slate-50 pb-3 last:border-0">
    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className="text-xs font-bold text-slate-700">{value || "—"}</p>
  </div>
);

const SpecBox = ({ label, value, highlight }) => (
  <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
    <p className="text-[8px] font-black text-slate-400 uppercase mb-2">{label}</p>
    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${highlight ? "bg-red-50 text-red-500" : "text-slate-700 bg-slate-50"}`}>
      {value || "N/A"}
    </span>
  </div>
);

const DetailField = ({ label, value, valueClass = "text-slate-600" }) => (
  <div>
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className={`text-xs font-semibold ${valueClass}`}>{value || "N/A"}</p>
  </div>
);

export default TicketDetailPage;