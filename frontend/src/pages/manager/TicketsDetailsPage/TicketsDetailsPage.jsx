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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/tech/users/service/${sId}`);
      const data = await res.json();
      setTechnicians(data);
    } catch (err) { console.error(err); }
  };

  const handleAssign = async () => {
    if (!selectedTech) return;
    try {
      const res = await fetch(`http://localhost:3001/api/tickets/${id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technicienId: selectedTech.id,
          action: "assigned",
          assigned_by: user.id,
        }),
      });

      if (res.ok) {
        setModalMessage(`Assigné à ${selectedTech.name} ${selectedTech.surname}`);
        setShowModal(true);
      }
    } catch (err) { console.error(err); }
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
      text: depasse ? `EXPIRÉ (+${hours}h)` : `${hours}h ${minutes}m rest.`,
      pct: Math.min(100, Math.max(0, ((totalMs - remaining) / totalMs) * 100)),
    };
  };

  if (loading) return <div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest text-xs">Chargement...</div>;

  const t = ticket;
  const employee = t?.employee || t?.users_tickets_created_byTousers;
  const assignedTech = t?.technician || t?.users_tickets_assigned_toTousers;
  const sla = calculateSLA();

  return (
    <div className="min-h-screen bg-[#f9f6f2] p-8 font-sans text-slate-700">
      
      {/* MODAL DESIGN "BULLE" */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[32px] shadow-xl max-w-sm w-full text-center border border-[#e5e1da]">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
               </svg>
            </div>
            <h3 className="text-sm font-black mb-1 uppercase tracking-tight text-slate-900">{modalMessage}</h3>
            <p className="text-slate-400 font-bold mb-6 uppercase text-[9px] tracking-widest">Mise à jour réussie</p>
            <button onClick={() => navigate("/manager/tickets-service")} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition shadow-lg">
              Continuer
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- COLONNE INFOS REQUÉRANT --- */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[32px] border border-[#e5e1da] p-8 shadow-sm">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-20 h-20 bg-[#f9f6f2] border border-[#e5e1da] rounded-full flex items-center justify-center text-slate-400 text-2xl font-black mb-4">
                {employee?.name?.[0]}{employee?.surname?.[0]}
              </div>
              <h2 className="font-black text-slate-900 text-lg uppercase tracking-tight">
                {employee?.name} {employee?.surname}
              </h2>
              <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase px-3 py-1 rounded-lg mt-2 tracking-widest border border-blue-100">Employé</span>
            </div>
            <div className="space-y-4 border-t border-[#f1efed] pt-6">
              <ProfileItem label="Email Professionnel" value={employee?.email} />
              <ProfileItem label="Département" value={employee?.department || "Support"} />
              <ProfileItem label="Poste Actuel" value={employee?.job_title} />
              <ProfileItem label="Contact" value={employee?.phone} />
            </div>
          </div>
        </div>

        {/* --- COLONNE DÉTAILS TICKET --- */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[32px] border border-[#e5e1da] p-8 md:p-10 shadow-sm">
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">TICKET #{id}</span>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mt-1">{t.title}</h1>
              </div>
              <span className="px-4 py-2 rounded-xl text-[10px] font-black uppercase border bg-[#f9f6f2] text-slate-500 border-[#e5e1da]">
                {t.status || 'Ouvert'}
              </span>
            </div>

            <div className="mb-10">
              <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Description du problème</h4>
              <p className="text-slate-600 bg-[#fcfafb] p-6 rounded-[24px] border border-[#f1efed] leading-relaxed font-medium">
                {t.description}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
              <SpecBox label="Priorité" value={t.priority} isPriority />
              <SpecBox label="Catégorie" value={t.category} />
              <SpecBox label="Urgence" value={t.urgency || "Moyenne"} />
              <SpecBox label="Impact" value={t.impact || "Service"} />
              <SpecBox label="Service" value={t.service || "IT"} />
              <SpecBox label="Création" value={new Date(t.createdAt).toLocaleDateString()} />
            </div>

            {/* SLA DESIGN ÉPURÉ */}
            <div className="p-6 rounded-[24px] border border-[#eeebe7] bg-[#fcfafb] mb-10">
              <div className="flex justify-between text-[10px] font-black uppercase mb-3 tracking-widest">
                <span className="text-slate-400">Délai de résolution (SLA)</span>
                <span className={sla.depasse ? 'text-red-500' : 'text-blue-600'}>{sla.text}</span>
              </div>
              <div className="w-full bg-[#eeebe7] h-1.5 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${sla.depasse ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${sla.pct}%` }}></div>
              </div>
            </div>

            {/* INTERVENANT SECTION */}
            <div className="pt-8 border-t border-[#f1efed] flex flex-col md:flex-row gap-6 items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Technicien Responsable</p>
                  <p className="font-black text-slate-900 uppercase">{assignedTech ? `${assignedTech.name} ${assignedTech.surname}` : "Non Assigné"}</p>
                </div>
                <button
                  onClick={() => setShowList(!showList)}
                  className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md"
                >
                  {showList ? "Fermer" : "Modifier l'affectation"}
                </button>
            </div>
          </div>

          {/* LISTE TECHNICIENS DESIGN CARTE BEIGE */}
          {showList && (
            <div className="bg-white p-8 rounded-[32px] border border-[#e5e1da] shadow-lg animate-in fade-in slide-in-from-top-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">Choisir un nouvel expert</h4>
               
               <div className="flex flex-wrap gap-3 mb-8">
                  {technicians.map(tech => (
                    <div 
                      key={tech.id} 
                      onClick={() => setSelectedTech(tech)}
                      className={`px-5 py-3 rounded-2xl cursor-pointer border-2 transition-all ${
                        selectedTech?.id === tech.id 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-[#f1efed] hover:border-slate-300 bg-[#fcfafb]'
                      }`}
                    >
                      <p className="font-black uppercase text-[10px] text-slate-800">{tech.name} {tech.surname}</p>
                    </div>
                  ))}
               </div>

               {selectedTech && (
                 <div className="bg-[#f9f6f2] border border-[#e5e1da] p-6 rounded-[24px]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Expert sélectionné</p>
                          <p className="text-xs font-black uppercase text-slate-900">{selectedTech.name} {selectedTech.surname}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Rôle</p>
                          <p className="text-xs font-bold text-slate-600">{selectedTech.job_title || "Technicien"}</p>
                        </div>
                      </div>

                      <button 
                        onClick={handleAssign} 
                        className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 transition-all shadow-lg"
                      >
                        Confirmer l'affectation
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
  <div className="border-b border-[#fcfafb] pb-3 last:border-0">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-xs font-bold text-slate-800">{value || "—"}</p>
  </div>
);

const SpecBox = ({ label, value, isPriority }) => (
  <div className="bg-[#fcfafb] border border-[#f1efed] p-5 rounded-[20px]">
    <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">{label}</p>
    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
      isPriority && (value === 'Critique' || value === 'critical') 
      ? 'bg-red-50 text-red-500' 
      : 'text-slate-900 bg-[#f1efed]'
    }`}>
      {value || "N/A"}
    </span>
  </div>
);

export default TicketDetailPage;