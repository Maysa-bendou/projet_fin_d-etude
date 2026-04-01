import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taking, setTaking] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:3001/api/tickets/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTicket(data);
        setLoading(false);
      })
      .catch(err => console.error("Error fetching ticket:", err));
  }, [id]);

  const handleTakeCharge = async () => {
    setTaking(true);
    try {
      const response = await fetch(`http://localhost:3001/api/tickets/${id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          technicienId: currentUser.id, 
          action: "taken" 
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setTicket(prev => ({
          ...prev,
          status: updated.status || 'in_progress',
          technician: { id: currentUser.id, name: currentUser.name, surname: currentUser.surname }
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTaking(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const t = ticket;
  const employee = t.employee || t.users_tickets_created_byTousers;

  // Logic to check assignment
  const isAssigned = !!(t.technician?.id || t.technicienId);
  const isAssignedToMe = (t.technician?.id === currentUser?.id) || (t.technicienId === currentUser?.id);

  // --- SLA DYNAMIC CALCULATION ---
  const calculateSLA = () => {
    if (!t.sla_due_date) return { pct: 0, depasse: false, text: "N/A" };

    const now = Date.now();
    const due = new Date(t.sla_due_date).getTime();
    const total = 24 * 3600 * 1000; 
    const remaining = due - now;
    const depasse = remaining <= 0;
    
    const pct = Math.min(100, Math.max(0, (remaining / total) * 100));
    const hours = Math.floor(Math.abs(remaining) / 3600000);
    const minutes = Math.floor((Math.abs(remaining) % 3600000) / 60000);

    let text = depasse 
      ? `+${hours}h ${minutes}m dépassé` 
      : `${hours}h ${minutes}m restantes`;
    
    return { pct, depasse, text };
  };

  const sla = calculateSLA();

  const getBarColor = () => {
    if (sla.depasse) return "bg-red-500";
    if (sla.pct < 25) return "bg-orange-500";
    if (sla.pct < 60) return "bg-yellow-400";
    return "bg-emerald-500";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- LEFT COLUMN: EMPLOYEE PROFILE --- */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sticky top-8">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-100 mb-6">
                {employee?.name?.[0]}{employee?.surname?.[0]}
              </div>
              <h2 className="font-black text-slate-800 text-xl uppercase tracking-tighter">
                {employee?.name} {employee?.surname}
              </h2>
              <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mt-2 bg-blue-50 px-4 py-1 rounded-full">
                {employee?.role || "Employé"}
              </p>
            </div>

            <div className="space-y-6 border-t border-slate-50 pt-8">
              <ProfileItem label="Email Professionnel" value={employee?.email} />
              <ProfileItem label="Département" value={employee?.department || "Djezzy Staff"} />
              <ProfileItem label="Poste" value={employee?.job_title} />
              <ProfileItem label="Contact" value={employee?.phone} />
              <ProfileItem label="Localisation / Bureau" value={employee?.office} />
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: TICKET DETAILS --- */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-12">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-10">
               <div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Référence Ticket</span>
                 <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mt-1">#{id} | {t.title}</h1>
               </div>
               <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                 t.status === 'open' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
               }`}>
                 {t.status === 'open' ? 'Ouvert' : t.status === 'in_progress' ? 'En cours' : t.status}
               </span>
            </div>

            {/* Description */}
            <div className="mb-12">
              <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-4">Description de l'incident</h4>
              <div className="text-slate-600 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 text-base leading-relaxed italic">
                "{t.description}"
              </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
              <SpecBox label="Priorité" value={t.priority} highlight />
              <SpecBox label="Catégorie" value={t.category} />
              <SpecBox label="Service" value={t.service || "IT Support"} />
              <SpecBox label="Impact" value={t.impact} />
              <SpecBox label="Urgence" value={t.urgency} />
              <SpecBox label="Date Création" value={new Date(t.createdAt || t.created_at).toLocaleDateString()} />
            </div>

            {/* --- DYNAMIC SLA BAR SECTION --- */}
            <div className={`p-8 rounded-3xl border transition-all duration-500 ${sla.depasse ? 'bg-red-50 border-red-100 shadow-inner' : 'bg-slate-50/50 border-slate-100' } mb-12`}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className={sla.depasse ? 'text-red-500 animate-pulse' : 'text-emerald-500'}>🕒</span> 
                  Temps de résolution (SLA)
                </span>
                {sla.depasse && <span className="text-[10px] font-bold text-red-600 uppercase italic animate-pulse">Dépassement détecté</span>}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-4 shadow-inner">
                <div 
                  className={`h-full transition-all duration-1000 ease-in-out ${getBarColor()}`}
                  style={{ width: sla.depasse ? "100%" : `${100 - sla.pct}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className={`text-2xl font-black tracking-tighter ${sla.depasse ? 'text-red-600' : 'text-slate-800'}`}>
                    {sla.text}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">
                    Limite : {new Date(t.sla_due_date).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-slate-50 gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Technicien assigné</span>
                {isAssignedToMe ? (
                   <div className="flex items-center gap-2">
                     <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                     <span className="text-sm font-black text-emerald-600 uppercase tracking-tighter">Vous gérez ce ticket</span>
                   </div>
                ) : (
                   <span className="text-sm font-bold text-slate-700 uppercase">
                     {t.technician?.name ? `${t.technician.name} ${t.technician.surname}` : "En attente d'expert"}
                   </span>
                )}
              </div>

              <button 
                onClick={handleTakeCharge}
                disabled={taking || isAssigned}
                className={`w-full md:w-auto px-12 py-4 rounded-2xl font-black text-xs tracking-widest transition-all shadow-xl active:scale-95
                  ${isAssigned 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed grayscale" 
                    : "bg-red-600 hover:bg-black text-white shadow-red-100 uppercase italic"}`}
              >
                {taking ? "Traitement..." : isAssigned ? "Déjà Assigné" : "Prendre en charge l'incident"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// --- Reusable Sub-components ---

const ProfileItem = ({ label, value }) => (
  <div className="border-b border-slate-50 pb-4 last:border-0">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
    <p className="text-sm font-bold text-slate-800">{value || "Non renseigné"}</p>
  </div>
);

const SpecBox = ({ label, value, highlight }) => (
  <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
    <span className={`text-xs font-black uppercase tracking-tighter ${
      highlight ? 'text-red-600 bg-red-50 px-3 py-1 rounded-lg' : 'text-slate-800'
    }`}>
      {value || "N/A"}
    </span>
  </div>
);

export default TicketDetailPage;