import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MdArrowBack, MdPerson, MdEmail, MdBusiness, MdWork, MdPhone, MdLocationOn, MdTimer, MdCheckCircle, MdWarning } from "react-icons/md";

const PRIORITY_STYLE = {
  critical: { label: "Critique", color: "#A32D2D", bg: "#FCEBEB" },
  high:     { label: "Haute",    color: "#854F0B", bg: "#FAEEDA" },
  medium:   { label: "Moyenne",  color: "#185FA5", bg: "#E6F1FB" },
  low:      { label: "Basse",    color: "#3B6D11", bg: "#EAF3DE" },
};

const STATUS_STYLE = {
  open:             { label: "Ouvert",              color: "#185FA5", bg: "#E6F1FB" },
  in_progress:      { label: "En cours",            color: "#854F0B", bg: "#FAEEDA" },
  pending:          { label: "En attente",          color: "#6b7280", bg: "#f3f4f6" },
  pending_supplier: { label: "Attente fournisseur", color: "#0F6E56", bg: "#E1F5EE" },
  resolved:         { label: "Résolu",              color: "#3B6D11", bg: "#EAF3DE" },
  closed:           { label: "Fermé",               color: "#3B6D11", bg: "#EAF3DE" },
  rejected:         { label: "Rejeté",              color: "#A32D2D", bg: "#FCEBEB" },
};

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taking, setTaking] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:3001/api/tickets/${id}`)
      .then(res => res.json())
      .then(data => { setTicket(data); setLoading(false); })
      .catch(err => console.error("Error fetching ticket:", err));
  }, [id]);

  const handleTakeCharge = async () => {
    setTaking(true);
    try {
      const response = await fetch(`http://localhost:3001/api/tickets/${id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicienId: currentUser.id, action: "taken" }),
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const t = ticket;
  const employee = t.employee || t.users_tickets_created_byTousers;
  const isAssigned = !!(t.technician?.id || t.technicienId);
  const isAssignedToMe = (t.technician?.id === currentUser?.id) || (t.technicienId === currentUser?.id);

  const calculateSLA = () => {
    if (!t.sla_date_limite) return { pct: 0, depasse: false, text: "N/A" };
    const now = Date.now();
    const due = new Date(t.sla_date_limite).getTime();
    const debut = t.sla_date_debut ? new Date(t.sla_date_debut).getTime() : due - 24 * 3600000;
    const remaining = due - now;
    const totalMs = due - debut;
    const depasse = remaining <= 0;
    const hours = Math.floor(Math.abs(remaining) / 3600000);
    const minutes = Math.floor((Math.abs(remaining) % 3600000) / 60000);
    return {
      depasse,
      text: depasse ? `+${hours}h ${minutes}m dépassé` : `${hours}h ${minutes}m restantes`,
      pct: Math.min(100, Math.max(0, (remaining / totalMs) * 100)),
    };
  };

  const sla = calculateSLA();
  const slaColor = sla.depasse ? '#dc2626' : sla.pct < 25 ? '#f97316' : sla.pct < 60 ? '#d97706' : '#16a34a';
  const statusStyle = STATUS_STYLE[t.status] || { label: t.status, color: '#6b7280', bg: '#f3f4f6' };
  const priorityStyle = PRIORITY_STYLE[t.priority] || { label: t.priority, color: '#6b7280', bg: '#f3f4f6' };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', padding: '40px 32px' }}>

      {/* BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9ca3af', fontSize: 12, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          marginBottom: 24, padding: 0, fontFamily: 'Inter, sans-serif'
        }}
      >
        <MdArrowBack style={{ fontSize: 16 }} /> Retour aux tickets
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── COLONNE GAUCHE : PROFIL EMPLOYÉ ── */}
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          position: 'sticky', top: 24
        }}>
          {/* Header profil */}
          <div style={{ padding: '28px 24px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#eff6ff', border: '2px solid #dbeafe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: '#3b82f6',
              margin: '0 auto 14px'
            }}>
              {employee?.name?.[0]}{employee?.surname?.[0]}
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>
              {employee?.name} {employee?.surname}
            </h2>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#3b82f6',
              background: '#eff6ff', padding: '4px 12px',
              borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.08em'
            }}>
              {employee?.role || "Employé"}
            </span>
          </div>

          {/* Infos profil */}
          <div style={{ padding: '16px 24px' }}>
            {[
              { icon: <MdEmail style={{ fontSize: 15, color: '#9ca3af' }} />, label: 'Email', value: employee?.email },
              { icon: <MdBusiness style={{ fontSize: 15, color: '#9ca3af' }} />, label: 'Département', value: employee?.department || 'Djezzy Staff' },
              { icon: <MdWork style={{ fontSize: 15, color: '#9ca3af' }} />, label: 'Poste', value: employee?.job_title },
              { icon: <MdPhone style={{ fontSize: 15, color: '#9ca3af' }} />, label: 'Contact', value: employee?.phone },
              { icon: <MdLocationOn style={{ fontSize: 15, color: '#9ca3af' }} />, label: 'Bureau', value: employee?.office },
            ].map(({ icon, label, value }, i, arr) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 0',
                borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none'
              }}>
                <div style={{ marginTop: 2, flexShrink: 0 }}>{icon}</div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px 0' }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{value || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── COLONNE DROITE : DÉTAIL TICKET ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* CARD PRINCIPALE */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

            {/* Header ticket */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px 0' }}>
                  Référence Ticket
                </p>
                <h1 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>
                  #{id} — {t.title}
                </h1>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 99,
                background: statusStyle.bg, color: statusStyle.color,
                whiteSpace: 'nowrap', border: `1px solid ${statusStyle.color}30`
              }}>
                {statusStyle.label}
              </span>
            </div>

            {/* Description */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 0' }}>
                Description de l'incident
              </p>
              <div style={{
                background: '#f9fafb', border: '1px solid #e5e7eb',
                borderRadius: 12, padding: '14px 18px',
                fontSize: 14, color: '#374151', lineHeight: 1.7,
                fontStyle: 'italic'
              }}>
                "{t.description}"
              </div>
            </div>

            {/* Specs — inner card avec tableau beige */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px 0' }}>
                Informations du ticket
              </p>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9f6f2', borderBottom: '1px solid #e8e4de' }}>
                      {['Priorité', 'Catégorie', 'Service', 'Impact', 'Urgence', 'Date Création'].map((col, i) => (
                        <th key={i} style={{ padding: '10px 16px', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', whiteSpace: 'nowrap' }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: priorityStyle.bg, color: priorityStyle.color }}>
                          {priorityStyle.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', fontWeight: 500 }}>{t.category || '—'}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', fontWeight: 500 }}>{t.service || 'IT Support'}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', fontWeight: 500 }}>{t.impact || '—'}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', fontWeight: 500 }}>{t.urgency || '—'}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', fontWeight: 500 }}>
                        {new Date(t.createdAt || t.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SLA */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MdTimer style={{ fontSize: 15, color: slaColor }} />
                  Temps de résolution (SLA)
                </p>
                {sla.depasse && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '3px 10px', borderRadius: 99, border: '1px solid #fecaca' }}>
                    Dépassement détecté
                  </span>
                )}
              </div>

              <div style={{ background: '#f3f4f6', height: 6, borderRadius: 99, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{
                  width: sla.depasse ? '100%' : `${100 - sla.pct}%`,
                  background: slaColor, height: '100%', borderRadius: 99,
                  transition: 'width 1s ease'
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: slaColor, margin: 0 }}>{sla.text}</p>
                <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, margin: 0 }}>
                  Limite : {t.sla_date_limite ? new Date(t.sla_date_limite).toLocaleString('fr-DZ') : 'N/A'}
                </p>
              </div>
            </div>

            {/* Footer : technicien + bouton */}
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px 0' }}>
                  Technicien assigné
                </p>
                {isAssignedToMe ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MdCheckCircle style={{ fontSize: 16, color: '#16a34a' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>Vous gérez ce ticket</span>
                  </div>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                    {t.technician?.name ? `${t.technician.name} ${t.technician.surname}` : "En attente d'expert"}
                  </span>
                )}
              </div>

              <button
                onClick={handleTakeCharge}
                disabled={taking || isAssigned}
                style={{
                  padding: '11px 24px', borderRadius: 12,
                  fontSize: 13, fontWeight: 700, cursor: isAssigned ? 'not-allowed' : 'pointer',
                  border: 'none', fontFamily: 'Inter, sans-serif',
                  background: isAssigned ? '#f3f4f6' : '#3b82f6',
                  color: isAssigned ? '#9ca3af' : '#fff',
                  boxShadow: isAssigned ? 'none' : '0 2px 8px rgba(59,130,246,0.25)',
                  transition: 'background 0.2s',
                  opacity: taking ? 0.7 : 1
                }}
                onMouseEnter={e => { if (!isAssigned) e.currentTarget.style.background = '#2563eb'; }}
                onMouseLeave={e => { if (!isAssigned) e.currentTarget.style.background = '#3b82f6'; }}
              >
                {taking ? "Traitement..." : isAssigned ? "Déjà Assigné" : "Prendre en charge"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;
