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
      });
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
        // Refresh local state
        setTicket(prev => ({
          ...prev,
          status: updated.status,
          technician: { id: currentUser.id, name: currentUser.name, surname: currentUser.surname }
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTaking(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-sans">Chargement...</div>;

  const t = ticket;
  const employee = t.employee;

  // Logic to prevent clicking again
  const isAssigned = !!(t.technician?.id || t.technicienId);
  const isAssignedToMe = (t.technician?.id === currentUser?.id) || (t.technicienId === currentUser?.id);

  // SLA Calculation
  const slaDate = new Date(t.sla_due_date);
  const isOverSLA = new Date() > slaDate;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT CARD: EMPLOYEE INFO (DYNAMIC) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-4 mb-8 bg-blue-50/50 p-4 rounded-2xl">
              <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-indigo-200 shadow-lg">
                {employee?.name?.[0]}{employee?.surname?.[0]}
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-lg">{employee?.name} {employee?.surname}</h2>
                <p className="text-blue-500 text-xs font-bold uppercase tracking-tight">{employee?.role}</p>
              </div>
            </div>

            <div className="space-y-6">
              <ProfileItem label="EMAIL" value={employee?.email} />
              <ProfileItem label="DÉPARTEMENT" value={employee?.department} />
              <ProfileItem label="TITRE DU POSTE" value={employee?.job_title || "Non renseigné"} />
              <ProfileItem label="NUMÉRO" value={employee?.phone || "N/A"} />
              <ProfileItem label="BUREAU" value={employee?.office || "N/A"} />
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT: TICKET DETAILS */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h1 className="text-2xl font-black text-slate-800 mb-6">{t.title}</h1>
            
            <div className="mb-8">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</h4>
              <p className="text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm leading-relaxed">
                {t.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <SpecBox label="PRIORITÉ" value={t.priority} isBadge />
              <SpecBox label="CATÉGORIE" value={t.category} />
              <SpecBox label="SERVICE" value={t.service} />
              <SpecBox label="IMPACT" value={t.impact || "N/A"} />
              <SpecBox label="URGENCE" value={t.urgency || "N/A"} />
              <SpecBox label="TYPE" value={t.type || "N/A"} />
              <SpecBox label="ASSIGNÉ PAR" value="Auto / Manager" />
              <SpecBox label="CRÉÉ LE" value={new Date(t.createdAt).toLocaleDateString()} />
            </div>

            {/* SLA BAR */}
            <div className={`p-5 rounded-2xl border ${isOverSLA ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'} mb-8`}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className={isOverSLA ? 'text-red-500' : 'text-emerald-500'}>🕒</span> SLA
                </span>
                {isOverSLA && <span className="text-[10px] font-bold text-red-600 animate-pulse">⚠️ DÉPASSÉ</span>}
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full ${isOverSLA ? 'bg-red-500 w-full' : 'bg-emerald-500 w-1/3'}`}></div>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 font-medium">
                Limite : {new Date(t.sla_due_date).toLocaleString()}
              </div>
            </div>

            {/* ACTION BAR */}
            <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-slate-50 gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Statut :</span>
                <span className="bg-slate-100 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 border border-slate-200">
                  {t.status === 'open' ? 'Ouvert' : t.status === 'in_progress' ? 'En cours' : t.status}
                </span>
                {isAssignedToMe && (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                     Le ticket est pris en charge par toi
                  </span>
                )}
              </div>

              <button 
                onClick={handleTakeCharge}
                disabled={taking || isAssigned}
                className={`px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95
                  ${isAssigned 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border" 
                    : "bg-[#00C853] hover:bg-[#00963d] text-white shadow-emerald-200"}`}
              >
                {taking ? "Action..." : "PRENDRE EN CHARGE"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Sub-components
const ProfileItem = ({ label, value }) => (
  <div className="border-b border-slate-50 pb-4 last:border-0">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-sm font-bold text-slate-700">{value || "Non spécifié"}</p>
  </div>
);

const SpecBox = ({ label, value, isBadge }) => (
  <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
    {isBadge ? (
      <span className="bg-white border px-3 py-1 rounded-lg text-[10px] font-bold text-slate-600 shadow-sm">{value}</span>
    ) : (
      <p className="text-sm font-bold text-slate-800">{value || "N/A"}</p>
    )}
  </div>
);

export default TicketDetailPage;