import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MdArrowBack, MdPerson, MdEmail, MdBusiness, MdWork, MdPhone, MdLocationOn, MdTimer, MdCheckCircle, MdWarning } from "react-icons/md";
import { PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_CONFIG, IMPACT_CONFIG, URGENCY_CONFIG } from "../../../config/styles";
import Pill from "../../../components/common/Pill";

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("technicien");
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taking, setTaking] = useState(false);
  const [showModal, setShowModal] = useState(false);

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
        const refreshed = await fetch(`http://localhost:3001/api/tickets/${id}`);
        const data = await refreshed.json();
        setTicket(data);
        setShowModal(true);
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

  const tk = ticket;
  const statusStyle = STATUS_CONFIG[tk.status] || STATUS_CONFIG.open;
  const priorityStyle = PRIORITY_CONFIG[tk.priority] || PRIORITY_CONFIG.low;
  const employee = tk.employee || tk.users_tickets_created_byTousers;
  const isAssigned = !!(tk.technician?.id || tk.technicienId);
  const isAssignedToMe = (tk.technician?.id === currentUser?.id) || (tk.technicienId === currentUser?.id);

  const calculateSLA = () => {
    if (!tk.sla_date_limite) return null;
    const PAUSED   = ["pending", "pending_supplier"];
    const TERMINAL = ["resolved", "closed", "rejected"];
    const now      = Date.now();
    const due      = new Date(tk.sla_date_limite).getTime();
    const debut    = tk.sla_date_debut ? new Date(tk.sla_date_debut).getTime() : due - 24 * 3600000;
    const window   = due - debut;
    if (TERMINAL.includes(tk.status)) {
      const closed   = tk.closed_at ? new Date(tk.closed_at).getTime() : due;
      const exceeded = closed > due;
      const delta    = Math.abs(closed - due);
      const h = Math.floor(delta / 3600000), m = Math.floor((delta % 3600000) / 60000);
      return {
        mode: "terminal",
        exceeded,
        text: exceeded
          ? t("ticketDetail.sla.exceeded", { h, m })
          : t("ticketDetail.sla.closedOk"),
        pct: exceeded ? 100 : Math.min(100, ((window - (due - closed)) / window) * 100),
      };
    }
    if (PAUSED.includes(tk.status)) {
      const elapsed  = tk.sla_pause_elapsed_ms ? Number(tk.sla_pause_elapsed_ms) : null;
      const frozen   = elapsed != null ? window - elapsed : Math.max(0, due - now);
      const h = Math.floor(frozen / 3600000), m = Math.floor((frozen % 3600000) / 60000);
      return { mode: "paused", text: t("ticketDetail.sla.frozen", { h, m }), pct: Math.min(100, ((window - frozen) / window) * 100) };
    }
    const remaining = due - now;
    const exceeded  = remaining <= 0;
    const abs       = Math.abs(remaining);
    const h = Math.floor(abs / 3600000), m = Math.floor((abs % 3600000) / 60000);
    return {
      mode: "active",
      exceeded,
      text: exceeded
        ? t("ticketDetail.sla.exceeded", { h, m })
        : t("ticketDetail.sla.remaining", { h, m }),
      pct: Math.min(100, Math.max(0, (remaining / window) * 100)),
    };
  };

  const sla = calculateSLA();

  const slaColor = !sla ? "#9ca3af"
    : sla.mode === "terminal" ? (sla.exceeded ? "#dc2626" : "#16a34a")
    : sla.mode === "paused"   ? "#7c3aed"
    : sla.exceeded            ? "#dc2626"
    : sla.pct > 50            ? "#16a34a"
    : sla.pct > 20            ? "#d97706"
    : "#f97316";

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100%', padding: '40px 32px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.93); } to { opacity:1; transform:scale(1); } }
      `}</style>

      {/* ── MODAL CONFIRMATION ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,24,39,0.18)", backdropFilter: "blur(2px)" }}>
          <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 24px 60px rgba(0,0,0,0.13)", maxWidth: 400, width: "100%", overflow: "hidden", animation: "scaleIn 0.22s ease" }}>

            <div style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", padding: "28px 32px 24px", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <MdCheckCircle style={{ fontSize: 26, color: "#fff" }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 4px", lineHeight: 1.3 }}>
                {t("ticketDetail.modal.title")}
              </h3>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", margin: 0, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>
                #{id} · {t("ticketDetail.modal.status")}
              </p>
            </div>

            <div style={{ padding: "20px 24px 24px" }}>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px", textAlign: "center", lineHeight: 1.6 }}>
                {t("ticketDetail.modal.body")}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                <button
                  onClick={() => setShowModal(false)}
                  style={{ padding: "12px 0", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", fontFamily: "Inter, sans-serif", background: "#3b82f6", color: "#fff", boxShadow: "0 2px 8px rgba(59,130,246,0.25)", transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#2563eb"}
                  onMouseLeave={e => e.currentTarget.style.background = "#3b82f6"}
                >
                  {t("ticketDetail.modal.stayHere")}
                </button>

                <button
                  onClick={() => navigate(-1)}
                  style={{ padding: "12px 0", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "1.5px solid #e5e7eb", fontFamily: "Inter, sans-serif", background: "#fff", color: "#374151", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#d1d5db"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
                >
                  {t("ticketDetail.modal.backToList")}
                </button>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24, padding: 0, fontFamily: 'Inter, sans-serif' }}
      >
        <MdArrowBack style={{ fontSize: 16 }} /> {t("ticketDetail.back")}
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT COLUMN : EMPLOYEE PROFILE ── */}
        <div style={{ alignSelf: 'start', position: 'sticky', top: 0 }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '28px 24px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eff6ff', border: '2px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#3b82f6', margin: '0 auto 14px' }}>
                {employee?.name?.[0]}{employee?.surname?.[0]}
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>
                {employee?.name} {employee?.surname}
              </h2>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '4px 12px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {employee?.role || t("ticketDetail.profile.employee")}
              </span>
            </div>
            <div style={{ padding: '16px 24px' }}>
              {[
                { icon: <MdEmail style={{ fontSize: 15, color: '#9ca3af' }} />, label: t("ticketDetail.profile.email"),      value: employee?.email },
                { icon: <MdBusiness style={{ fontSize: 15, color: '#9ca3af' }} />, label: t("ticketDetail.profile.department"), value: employee?.department || 'Djezzy Staff' },
                { icon: <MdWork style={{ fontSize: 15, color: '#9ca3af' }} />, label: t("ticketDetail.profile.position"),   value: employee?.job_title },
                { icon: <MdPhone style={{ fontSize: 15, color: '#9ca3af' }} />, label: t("ticketDetail.profile.contact"),   value: employee?.phone },
                { icon: <MdLocationOn style={{ fontSize: 15, color: '#9ca3af' }} />, label: t("ticketDetail.profile.office"), value: employee?.office },
              ].map(({ icon, label, value }, i, arr) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <div style={{ marginTop: 2, flexShrink: 0 }}>{icon}</div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px 0' }}>{label}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{value || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN : TICKET DETAIL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

            {/* Ticket header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px 0' }}>
                  {t("ticketDetail.reference")}
                </p>
                <h1 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>#{id} — {tk.title}</h1>
              </div>
              <Pill config={STATUS_CONFIG} value={tk.status} />
            </div>

            {/* Description */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 0' }}>
                {t("ticketDetail.description")}
              </p>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 18px', fontSize: 14, color: '#374151', lineHeight: 1.7, fontStyle: 'italic' }}>
                {tk.description}
              </div>
            </div>

            {/* Specs */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px 0' }}>
                {t("ticketDetail.info")}
              </p>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9f6f2', borderBottom: '1px solid #e8e4de' }}>
                      {[
                        t("ticketDetail.cols.priority"),
                        t("ticketDetail.cols.category"),
                        t("ticketDetail.cols.service"),
                        t("ticketDetail.cols.impact"),
                        t("ticketDetail.cols.urgency"),
                        t("ticketDetail.cols.createdAt"),
                      ].map((col, i) => (
                        <th key={i} style={{ padding: '10px 16px', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', whiteSpace: 'nowrap' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '14px 16px' }}>
                        <Pill config={PRIORITY_CONFIG} value={tk.priority} />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <Pill config={CATEGORY_CONFIG} value={tk.category} />
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', fontWeight: 500 }}>
                        {tk.service?.name || tk.service || 'IT Support'}
                      </td>
                      <td><Pill config={IMPACT_CONFIG} value={tk.impact} /></td>
                      <td><Pill config={URGENCY_CONFIG} value={tk.urgency} /></td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', fontWeight: 500 }}>
                        {new Date(tk.createdAt || tk.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SLA */}
            {sla && (
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MdTimer style={{ fontSize: 15, color: slaColor }} />
                    {t("ticketDetail.sla.title")}
                    {sla.mode === "paused" && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', background: '#ede9fe', padding: '2px 8px', borderRadius: 99 }}>
                        {t("ticketDetail.sla.paused")}
                      </span>
                    )}
                    {sla.mode === "terminal" && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 99 }}>
                        {t("ticketDetail.sla.closed")}
                      </span>
                    )}
                  </p>
                  {sla.mode === "active" && sla.exceeded && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '3px 10px', borderRadius: 99, border: '1px solid #fecaca' }}>
                      {t("ticketDetail.sla.breachDetected")}
                    </span>
                  )}
                </div>
                <div style={{ background: '#f3f4f6', height: 6, borderRadius: 99, marginBottom: 12, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round(sla.pct)}%`, background: slaColor, height: '100%', borderRadius: 99, transition: 'width 1s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: slaColor, margin: 0 }}>{sla.text}</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, margin: 0 }}>
                    {t("ticketDetail.sla.limit")} : {tk.sla_date_limite ? new Date(tk.sla_date_limite).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                  </p>
                </div>
              </div>
            )}

            {/* ── REDIRECT NOTE ── */}
            {tk.redirect_note && (
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#7e22ce', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {t("ticketDetail.redirect.title")}
                </p>
                <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tk.service && (
                    <div style={{ fontSize: 13, color: '#374151' }}>
                      <span style={{ fontWeight: 700, color: '#6b21a8' }}>{t("ticketDetail.redirect.service")} : </span>
                      {tk.service?.name || tk.service}
                    </div>
                  )}
                  {tk.technician && (
                    <div style={{ fontSize: 13, color: '#374151' }}>
                      <span style={{ fontWeight: 700, color: '#6b21a8' }}>{t("ticketDetail.redirect.technician")} : </span>
                      {tk.technician.name} {tk.technician.surname}
                    </div>
                  )}
                  {tk.redirected_at && (
                    <div style={{ fontSize: 13, color: '#374151' }}>
                      <span style={{ fontWeight: 700, color: '#6b21a8' }}>{t("ticketDetail.redirect.redirectedAt")} : </span>
                      {new Date(tk.redirected_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: '#374151', borderTop: '1px solid #e9d5ff', paddingTop: 8, marginTop: 4 }}>
                    <span style={{ fontWeight: 700, color: '#6b21a8' }}>{t("ticketDetail.redirect.reason")} : </span>
                    {tk.redirect_note}
                  </div>
                </div>
              </div>
            )}

            {/* Footer : technician + button */}
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px 0' }}>
                  {t("ticketDetail.assignedTech")}
                </p>
                {isAssignedToMe ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MdCheckCircle style={{ fontSize: 16, color: '#16a34a' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{t("ticketDetail.managedByYou")}</span>
                  </div>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                    {tk.technician?.name ? `${tk.technician.name} ${tk.technician.surname}` : t("ticketDetail.waitingExpert")}
                  </span>
                )}
                {tk.assigned_at && (
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                    {t("ticketDetail.assignedOn")} : {new Date(tk.assigned_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
                {tk.closed_at && (
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                    {t("ticketDetail.closedOn")} : {new Date(tk.closed_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>

              <button
                onClick={handleTakeCharge}
                disabled={taking || isAssigned}
                style={{ padding: '11px 24px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: isAssigned ? 'not-allowed' : 'pointer', border: 'none', fontFamily: 'Inter, sans-serif', background: isAssigned ? '#f3f4f6' : '#3b82f6', color: isAssigned ? '#9ca3af' : '#fff', boxShadow: isAssigned ? 'none' : '0 2px 8px rgba(59,130,246,0.25)', transition: 'background 0.2s', opacity: taking ? 0.7 : 1 }}
                onMouseEnter={e => { if (!isAssigned) e.currentTarget.style.background = '#2563eb'; }}
                onMouseLeave={e => { if (!isAssigned) e.currentTarget.style.background = '#3b82f6'; }}
              >
                {taking
                  ? t("ticketDetail.btn.taking")
                  : isAssigned
                    ? t("ticketDetail.btn.alreadyAssigned")
                    : t("ticketDetail.btn.takeCharge")}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;