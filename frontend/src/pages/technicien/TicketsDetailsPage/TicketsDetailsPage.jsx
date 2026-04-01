import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const techId = user?.id;

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taking, setTaking] = useState(false);
  const [showToast, setShowToast] = useState(false); 
  // NEW STATE: specifically for the message below the button
  const [showStatusMessage, setShowStatusMessage] = useState(false);

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
  setShowToast(true);
  setShowStatusMessage(true);

  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const response = await fetch(`http://localhost:3001/api/tickets/${id}/assign`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ technicienId: user.id, action: "taken" }),
    });

    if (response.ok) {
      const updated = await response.json();
      setTicket((prev) => ({
        ...prev,
        status: updated.status,
        technician: { name: user.name, surname: user.surname }
      }));
      alert("Ticket pris en charge !");
    } else {
      const err = await response.text();
      console.error("Erreur API:", err);
    }
  } catch (err) {
    console.error(err);
  } finally {
    setTaking(false);
    setTimeout(() => setShowToast(false), 2000);
    setTimeout(() => setShowStatusMessage(false), 1500);
  }
};

if (loading) return <div className="p-10 text-center">Chargement...</div>;

  const t = ticket;
  const isTaken = t.status === "in_progress" || t.technician;

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans relative">
      
      {/* --- TEMPORARY STATUS TOAST --- */}
      {showToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-blue-600 text-white px-8 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-3 border-2 border-white">
            <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
            Statut Actuel : {t.status === 'open' ? 'OUVERT' : t.status}
          </div>
        </div>
      )}

      {/* Navigation */}
{/* Navigation */}
{/* Navigation Bar: Service/ID on Left, Retour on Right */}
<div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
  
  {/* LEFT SIDE: Dynamic Info */}
  <div className="flex items-center gap-4">
        {/* TICKET ID */}
    <span className="text-slate-700 font-bold text-sm uppercase">
      Ticket ID: #{t.id}
    </span>
    {/* SERVICE TAG */}
    <span className="bg-indigo-50 text-indigo-700 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-indigo-100">
      {t.service || "Général"}
    </span>
    
  </div>

  {/* RIGHT SIDE: Navigation Button */}
  <button 
    onClick={() => navigate(-1)} 
    className="text-slate-500 font-medium flex items-center gap-2 hover:text-indigo-600 transition-all group"
  >
    <span className="group-hover:translate-x-1 transition-transform">Retour</span>
  </button>
</div>

      <div className="max-w-5xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Ticket Content & Full Employee Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border p-8">
            <h1 className="text-3xl font-black text-slate-800 mb-4">{t.title}</h1>
            <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-600 leading-relaxed italic">
                "{t.description || "Aucune description."}"
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border p-8">
            <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-6">Informations de l'Employé</h3>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 text-3xl font-bold">
                {t.employee?.name?.[0]}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 flex-1">
                <EmployeeDetail label="Nom Complet" value={`${t.employee?.name} ${t.employee?.surname}`} />
                <EmployeeDetail label="Email Professionnel" value={t.employee?.email} />
                <EmployeeDetail label="Département" value={t.employee?.department} />
                <EmployeeDetail label="Poste / Job Title" value={t.employee?.job_title} />
                <EmployeeDetail label="Bureau" value={t.employee?.office} />
                <EmployeeDetail label="Téléphone" value={t.employee?.phone} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Sidebar Stats & Action */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
            <h2 className="text-lg font-bold mb-6">Spécifications</h2>
            <div className="space-y-4 mb-8">
              <StatItem label="Priorité" value={t.priority}  />
              <StatItem label="Impact" value={t.impact}  />
              <StatItem label="Urgence" value={t.urgency}  />
              <StatItem label="SLA Due" value={t.sla_due_date ? new Date(t.sla_due_date).toLocaleDateString() : "N/A"} />
            </div>

<div className="mt-8">
  <button 
    onClick={handleTakeCharge}
    disabled={taking || isTaken} 
    className={`w-full py-4 rounded-2xl font-black transition-all active:scale-95 shadow-lg text-white
      ${isTaken 
        ? "bg-emerald-600 cursor-not-allowed opacity-90" 
        : "bg-indigo-500 hover:bg-indigo-400 shadow-indigo-500/30"
      }`}
  >
    {taking ? (
      <span className="flex items-center justify-center gap-2">
        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
        Mise à jour...
      </span>
    ) : isTaken ? (
      <span className="flex items-center justify-center gap-2">
        Prendre en charge
      </span>
    ) : (
      "PRENDRE EN CHARGE"
    )}
  </button>

  {showStatusMessage && (
    <p className="text-center text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-bold animate-pulse">
      Statut : {t.status || "open"} 
    </p>
  )}
</div>
          </div>
        </div>

      </div>
    </div>
  );
};

const EmployeeDetail = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
    <p className="text-sm font-bold text-slate-700">{value || "Non spécifié"}</p>
  </div>
);

const StatItem = ({ label, value, icon }) => (
  <div className="flex justify-between items-center text-sm">
    <div className="flex items-center gap-2 text-slate-400 italic">
      <span>{icon}</span> {label}
    </div>
    <span className="font-bold capitalize">{value}</span>
  </div>
);

export default TicketDetailPage;