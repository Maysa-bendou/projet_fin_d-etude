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
  const [isUpdating, setIsUpdating] = useState(false);

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
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async () => {
    if (!selectedTech) return;
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
        setModalMessage(`Ticket assigned to ${selectedTech.name} ${selectedTech.surname}`);
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
  if (!ticket?.sla_date_limite) return { pct: 0, depasse: false, text: "N/A" };
  const now = Date.now();
  const due = new Date(ticket.sla_date_limite).getTime();
  const debut = ticket.sla_date_debut ? new Date(ticket.sla_date_debut).getTime() : due - 24 * 3600000;
  const remaining = due - now;
  const totalMs = due - debut;
  const depasse = remaining <= 0;
  const hours = Math.floor(Math.abs(remaining) / 3600000);
  const minutes = Math.floor((Math.abs(remaining) % 3600000) / 60000);
  return {
    depasse,
    text: depasse ? `+${hours}h ${minutes}m` : `${hours}h ${minutes}m`,
    pct: Math.min(100, Math.max(0, (remaining / totalMs) * 100)),
  };
};

  if (loading) return <div className="p-20 text-center font-bold text-red-600">Chargement...</div>;

  const t = ticket;
  const employee = t?.employee || t?.users_tickets_created_byTousers;
  const assignedTech = t?.technician || null;
  const isAssigned = !!assignedTech;
  const sla = calculateSLA();

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] p-6 md:p-10 font-sans">
      
      {/* MODAL (Invisible background) */}
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
              <SpecBox label="Date" value={new Date(t.createdAt).toLocaleDateString()} />
            </div>

            <div className="p-6 rounded-3xl border bg-slate-50 border-slate-100 mb-10">
              <div className="flex justify-between text-[10px] font-black uppercase mb-3 text-slate-500">
                <span>Temps de résolution (SLA)</span>
                <span className={sla.depasse ? 'text-red-600 animate-pulse' : ''}>{sla.text}</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className={`h-full ${sla.depasse ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${100 - sla.pct}%` }}></div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Expert Assigné</p>
                  <p className="font-bold text-slate-800">{assignedTech ? `${assignedTech.name} ${assignedTech.surname}` : "En attente"}</p>
                </div>
                <button
                  onClick={() => setShowList(!showList)}
                  className="w-full md:w-auto px-8 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition"
                >
                  {showList ? "Annuler" : "Modifier l'expert"}
                </button>
            </div>
          </div>

          {/* SECTION MODIFIER L'EXPERT AVEC AFFICHAGE HORIZONTAL */}
          {showList && (
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 animate-in slide-in-from-bottom-4 duration-300">
               <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Liste des techniciens disponibles</h4>
               
               {/* Grille de sélection des techniciens */}
               <div className="flex flex-wrap gap-3 mb-6">
                  {technicians.map(tech => (
                    <div 
                      key={tech.id} 
                      onClick={() => setSelectedTech(tech)}
                      className={`px-6 py-3 rounded-2xl cursor-pointer border-2 transition-all flex flex-col items-center ${selectedTech?.id === tech.id ? 'border-red-600 bg-red-50' : 'border-slate-50 hover:border-red-200 bg-slate-50/50'}`}
                    >
                      <p className="font-black uppercase text-[10px] text-slate-800">{tech.name} {tech.surname}</p>
                    </div>
                  ))}
               </div>

               {/* Affichage Horizontal des détails (remplace la boîte noire) */}
               {selectedTech && (
                 <div className="bg-slate-900 text-white p-6 rounded-2xl animate-in fade-in zoom-in duration-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      
                      {/* Infos Groupées */}
                      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 flex-1">
                        <div>
                          <p className="text-red-500 font-black text-[8px] uppercase tracking-widest mb-1">Expert Sélectionné</p>
                          <p className="text-sm font-black uppercase italic">{selectedTech.name} {selectedTech.surname}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-black text-[8px] uppercase tracking-widest mb-1">Email</p>
                          <p className="text-xs font-bold">{selectedTech.email}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-black text-[8px] uppercase tracking-widest mb-1">Contact</p>
                          <p className="text-xs font-bold">{selectedTech.phone || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-black text-[8px] uppercase tracking-widest mb-1">Bureau / Rôle</p>
                          <p className="text-xs font-bold">{selectedTech.office || "Local"} | {selectedTech.job_title}</p>
                        </div>
                      </div>

                      {/* Bouton de confirmation intégré */}
                      <button 
                        onClick={handleAssign} 
                        className="whitespace-nowrap bg-red-600 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-all shadow-lg"
                      >
                        Confirmer l'expert
                      </button>
                    </div>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfileItem = ({ label, value }) => (
  <div className="border-b border-slate-50 pb-3 last:border-0">
    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className="text-xs font-bold text-slate-700">{value || "—"}</p>
  </div>
);

const SpecBox = ({ label, value, highlight }) => (
  <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
    <p className="text-[8px] font-black text-slate-400 uppercase mb-2">{label}</p>
    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${highlight ? 'bg-red-50 text-red-600' : 'text-slate-800 bg-slate-50'}`}>
      {value || "N/A"}
    </span>
  </div>
);

export default TicketDetailPage;