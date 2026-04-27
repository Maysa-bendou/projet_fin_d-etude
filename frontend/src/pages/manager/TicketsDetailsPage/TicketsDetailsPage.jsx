import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MdArrowBack, MdEmail, MdBusiness, MdWork, MdPhone,
  MdLocationOn, MdTimer, MdCheckCircle, MdPerson,
  MdExpandMore, MdSwapHoriz,
} from "react-icons/md";
import { PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_CONFIG, IMPACT_CONFIG, URGENCY_CONFIG } from "../../../config/styles";
import Pill from "../../../components/common/Pill";

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("manager");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const sId = user.service_id;

  const [ticket, setTicket] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(false);
  const [selectedTech, setSelectedTech] = useState(null);
  const [techActiveTickets, setTechActiveTickets] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => { fetchTicket(); fetchTechnicians(); }, [id, sId]);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/tickets/${id}`);
      setTicket(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/tickets/techniciens/service/${sId}`);
      const data = await res.json();
      setTechnicians(data);
      const activeMap = {};
      await Promise.all(data.map(async (tech) => {
        try {
          const r = await fetch(`http://localhost:3001/api/manager/technician/${tech.id}/active-count`);
          activeMap[tech.id] = r.ok ? (await r.json()).count ?? 0 : 0;
        } catch { activeMap[tech.id] = 0; }
      }));
      setTechActiveTickets(activeMap);
    } catch (err) { console.error(err); }
  };

  const handleAssign = async () => {
    if (!selectedTech) return;
    const isUpdating = !!(ticket?.technician?.id);
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
      const action = isUpdating
        ? t("ticketDetail.modal.reassigned")
        : t("ticketDetail.modal.assigned");
      setModalMessage(`${action} ${selectedTech.name} ${selectedTech.surname}`);
      setShowModal(true);
    }
  };

  const handleCloseModal = () => { setShowModal(false); navigate("/manager/tickets-service"); };

  const calculateSLA = (tk) => {
    if (!tk?.sla_date_limite) return null;
    const PAUSED   = ["pending", "pending_supplier"];
    const TERMINAL = ["resolved", "closed", "rejected"];
    const now = Date.now();
    const due = new Date(tk.sla_date_limite).getTime();
    const debut = tk.sla_date_debut ? new Date(tk.sla_date_debut).getTime() : due - 24 * 3600000;
    const window = due - debut;
    if (TERMINAL.includes(tk.status)) {
      const closed = tk.closed_at ? new Date(tk.closed_at).getTime() : due;
      const exceeded = closed > due;
      const delta = Math.abs(closed - due);
      const h = Math.floor(delta / 3600000), m = Math.floor((delta % 3600000) / 60000);
      return {
        mode: "terminal",
        exceeded,
        text: exceeded
          ? `+${h}h ${m}m ${t("ticketDetail.slaSection").replace(/\(.*\)/, "").trim()}`
          : t("ticketDetail.slaClosed") + " — respecté ✓",
        pct: exceeded ? 100 : Math.min(100, ((window - (due - closed)) / window) * 100),
      };
    }
    if (PAUSED.includes(tk.status)) {
      const elapsed = tk.sla_pause_elapsed_ms ? Number(tk.sla_pause_elapsed_ms) : null;
      const frozen = elapsed != null ? window - elapsed : Math.max(0, due - now);
      const h = Math.floor(frozen / 3600000), m = Math.floor((frozen % 3600000) / 60000);
      return { mode: "paused", text: `⏸ ${h}h ${m}m figé`, pct: Math.min(100, ((window - frozen) / window) * 100) };
    }
    const remaining = due - now;
    const exceeded = remaining <= 0;
    const abs = Math.abs(remaining);
    const h = Math.floor(abs / 3600000), m = Math.floor((abs % 3600000) / 60000);
    return {
      mode: "active",
      exceeded,
      text: exceeded ? `+${h}h ${m}m dépassé` : `${h}h ${m}m restantes`,
      pct: Math.min(100, Math.max(0, (remaining / window) * 100)),
    };
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "Inter, sans-serif" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTop: "3px solid #3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const tk = ticket;
  const employee = tk.employee || tk.users_tickets_created_byTousers;
  const assignedTech = tk.technician || null;
  const isAssigned = !!(assignedTech?.id);
  const TERMINAL = ["resolved", "closed", "rejected"];
  const isTerminal = TERMINAL.includes(tk.status);
  const sla = calculateSLA(tk);

  const slaColor = !sla ? "#9ca3af"
    : sla.mode === "terminal" ? (sla.exceeded ? "#dc2626" : "#16a34a")
    : sla.mode === "paused"   ? "#7c3aed"
    : sla.exceeded            ? "#dc2626"
    : sla.pct > 50            ? "#16a34a"
    : sla.pct > 20            ? "#d97706"
    : "#f97316";

  return (
    <div style={{ fontFamily: "Inter, sans-serif", minHeight: "100%", padding: "40px 32px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* MODAL */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,24,39,0.18)", backdropFilter: "blur(2px)" }}>
          <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 24px 60px rgba(0,0,0,0.13)", maxWidth: 400, width: "100%", overflow: "hidden", animation: "fadeIn 0.2s ease" }}>
            <div style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", padding: "28px 32px 24px", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <MdCheckCircle style={{ fontSize: 26, color: "#fff" }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 4px", lineHeight: 1.3 }}>{modalMessage}</h3>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", margin: 0, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>
                {t("ticketDetail.modal.confirmed")}
              </p>
            </div>
            <div style={{ padding: "20px 24px 24px" }}>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px", textAlign: "center", lineHeight: 1.6 }}>
                {t("ticketDetail.modal.whatNext")}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={handleCloseModal}
                  style={{ padding: "12px 0", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", fontFamily: "Inter, sans-serif", background: "#3b82f6", color: "#fff", boxShadow: "0 2px 8px rgba(59,130,246,0.25)" }}
                >
                  {t("ticketDetail.modal.backToList")}
                </button>
                <button
                  onClick={() => { setShowModal(false); setShowList(false); setSelectedTech(null); fetchTicket(); }}
                  style={{ padding: "12px 0", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "1.5px solid #e5e7eb", fontFamily: "Inter, sans-serif", background: "#fff", color: "#374151" }}
                >
                  {t("ticketDetail.modal.stayOnTicket")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BACK */}
      <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 24, padding: 0, fontFamily: "Inter, sans-serif" }}>
        <MdArrowBack style={{ fontSize: 16 }} /> {t("ticketDetail.backToTickets")}
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>

        {/* ── LEFT COLUMN: PROFILE ── */}
        <div style={{ alignSelf: "start", position: "sticky", top: 0 }}>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "28px 24px", borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#eff6ff", border: "2px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#3b82f6", margin: "0 auto 14px" }}>
                {employee?.name?.[0]}{employee?.surname?.[0]}
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>{employee?.name} {employee?.surname}</h2>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", background: "#eff6ff", padding: "4px 12px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {employee?.role || t("ticketDetail.modal.employee")}
              </span>
            </div>
            <div style={{ padding: "16px 24px" }}>
              {[
                { icon: <MdEmail style={{ fontSize: 15, color: "#9ca3af" }} />,       label: t("ticketDetail.techFields.email"),   value: employee?.email },
                { icon: <MdBusiness style={{ fontSize: 15, color: "#9ca3af" }} />,    label: t("ticketDetail.cols.service"),       value: employee?.department },
                { icon: <MdWork style={{ fontSize: 15, color: "#9ca3af" }} />,        label: t("ticketDetail.cols.priority").replace("Priority","").replace("Priorité","") || "Poste", value: employee?.job_title },
                { icon: <MdPhone style={{ fontSize: 15, color: "#9ca3af" }} />,       label: t("ticketDetail.techFields.contact"), value: employee?.phone },
                { icon: <MdLocationOn style={{ fontSize: 15, color: "#9ca3af" }} />,  label: t("ticketDetail.techFields.office"),  value: employee?.office },
              ].map(({ icon, label, value }, i, arr) => (
                <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <div style={{ marginTop: 2, flexShrink: 0 }}>{icon}</div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>{label}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>{value || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* MAIN CARD */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>

            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>
                  {t("ticketDetail.ticketRef")}
                </p>
                <h1 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }}>#{id} — {tk.title}</h1>
              </div>
              <Pill config={STATUS_CONFIG} value={tk.status} />
            </div>

            {/* Description */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>
                {t("ticketDetail.incidentDesc")}
              </p>
              <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 18px", fontSize: 14, color: "#374151", lineHeight: 1.7, fontStyle: "italic" }}>
                {tk.description}
              </div>
            </div>

            {/* Specs table */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>
                {t("ticketDetail.ticketInfo")}
              </p>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f9f6f2", borderBottom: "1px solid #e8e4de" }}>
                      {[
                        t("ticketDetail.cols.priority"),
                        t("ticketDetail.cols.category"),
                        t("ticketDetail.cols.service"),
                        t("ticketDetail.cols.impact"),
                        t("ticketDetail.cols.urgency"),
                        t("ticketDetail.cols.createdAt"),
                      ].map((col, i) => (
                        <th key={i} style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left", whiteSpace: "nowrap" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: "14px 16px" }}><Pill config={PRIORITY_CONFIG} value={tk.priority} /></td>
                      <td style={{ padding: "14px 16px" }}><Pill config={CATEGORY_CONFIG} value={tk.category} /></td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151", fontWeight: 500 }}>{tk.service || "IT Support"}</td>
                      <td style={{ padding: "14px 16px" }}><Pill config={IMPACT_CONFIG} value={tk.impact} /></td>
                      <td style={{ padding: "14px 16px" }}><Pill config={URGENCY_CONFIG} value={tk.urgency} /></td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151", fontWeight: 500 }}>
                        {new Date(tk.createdAt || tk.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SLA */}
            {sla && (
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                    <MdTimer style={{ fontSize: 15, color: slaColor }} />
                    {t("ticketDetail.slaSection")}
                    {sla.mode === "paused" && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", background: "#ede9fe", padding: "2px 8px", borderRadius: 99 }}>
                        {t("ticketDetail.slaPaused")}
                      </span>
                    )}
                    {sla.mode === "terminal" && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", background: "#f3f4f6", padding: "2px 8px", borderRadius: 99 }}>
                        {t("ticketDetail.slaClosed")}
                      </span>
                    )}
                  </p>
                  {sla.mode === "active" && sla.exceeded && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", background: "#fef2f2", padding: "3px 10px", borderRadius: 99, border: "1px solid #fecaca" }}>
                      {t("ticketDetail.slaOverrun")}
                    </span>
                  )}
                </div>
                <div style={{ background: "#f3f4f6", height: 6, borderRadius: 99, marginBottom: 12, overflow: "hidden" }}>
                  <div style={{ width: `${Math.round(sla.pct)}%`, background: slaColor, height: "100%", borderRadius: 99, transition: "width 1s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: slaColor, margin: 0 }}>{sla.text}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, margin: 0 }}>
                    {t("ticketDetail.slaLimit")} : {tk.sla_date_limite
                      ? new Date(tk.sla_date_limite).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
                      : "N/A"}
                  </p>
                </div>
              </div>
            )}

            {/* Redirect note */}
            {tk.redirect_note && (
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#7e22ce", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
                  {t("ticketDetail.redirected")}
                </p>
                <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 12, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {tk.service && (
                    <div style={{ fontSize: 13, color: "#374151" }}>
                      <span style={{ fontWeight: 700, color: "#6b21a8" }}>{t("ticketDetail.redirectService")} : </span>
                      {tk.service}
                    </div>
                  )}
                  {tk.technician && (
                    <div style={{ fontSize: 13, color: "#374151" }}>
                      <span style={{ fontWeight: 700, color: "#6b21a8" }}>{t("ticketDetail.redirectTechnician")} : </span>
                      {tk.technician.name} {tk.technician.surname}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: "#374151", borderTop: "1px solid #e9d5ff", paddingTop: 8, marginTop: 4 }}>
                    <span style={{ fontWeight: 700, color: "#6b21a8" }}>{t("ticketDetail.redirectReason")} : </span>
                    {tk.redirect_note}
                  </div>
                  {tk.redirect_note && tk.redirected_at && (
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
                      <span style={{ fontWeight: 700, color: "#a855f7" }}>{t("ticketDetail.redirectedAt")} : </span>
                      {new Date(tk.redirected_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      {" "}{t("ticketDetail.redirectedAtTime")}{" "}
                      {new Date(tk.redirected_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer: assigned technician + dates + button */}
            <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
                  {t("ticketDetail.assignedTech")}
                </p>
                {isAssigned ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <MdPerson style={{ fontSize: 16, color: "#3b82f6" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{assignedTech.name} {assignedTech.surname}</span>
                  </div>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b", fontStyle: "italic" }}>
                    {t("ticketDetail.notAssigned")}
                  </span>
                )}
                {tk.assigned_at && (
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "6px 0 0" }}>
                    {t("ticketDetail.assignedOn")} {new Date(tk.assigned_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
                {tk.closed_at && (
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>
                    {t("ticketDetail.closedOn")} {new Date(tk.closed_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
              </div>
              <button
                onClick={() => { if (!isTerminal) { setShowList(!showList); setSelectedTech(null); } }}
                disabled={isTerminal}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "11px 22px", borderRadius: 12, fontSize: 13, fontWeight: 700,
                  cursor: isTerminal ? "not-allowed" : "pointer", border: "none", fontFamily: "Inter, sans-serif",
                  background: isTerminal ? "#f3f4f6" : showList ? "#f3f4f6" : isAssigned ? "#fff7ed" : "#3b82f6",
                  color: isTerminal ? "#9ca3af" : showList ? "#6b7280" : isAssigned ? "#ea580c" : "#fff",
                  boxShadow: isTerminal || showList || isAssigned ? "none" : "0 2px 8px rgba(59,130,246,0.25)",
                  outline: isAssigned && !showList && !isTerminal ? "1.5px solid #ea580c" : "none",
                  transition: "all 0.2s",
                  opacity: isTerminal ? 0.6 : 1,
                }}
              >
                <MdSwapHoriz style={{ fontSize: 17 }} />
                {isTerminal
                  ? t("ticketDetail.ticketClosed")
                  : showList
                    ? t("ticketDetail.cancelBtn")
                    : isAssigned
                      ? t("ticketDetail.reassignBtn")
                      : t("ticketDetail.assignBtn")}
              </button>
            </div>
          </div>

          {/* ASSIGNMENT PANEL */}
          {showList && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", animation: "fadeIn 0.2s ease" }}>

              {/* Panel header */}
              <div style={{ padding: "16px 24px", background: "#f8fafc", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10 }}>
                <MdPerson style={{ fontSize: 16, color: "#3b82f6" }} />
                <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                  {isAssigned ? t("ticketDetail.panelChooseNew") : t("ticketDetail.panelChoose")}
                </p>
              </div>

              {/* Technician list */}
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {technicians.map((tech, idx) => {
                  const isSelected = selectedTech?.id === tech.id;
                  const isCurrent  = assignedTech?.id === tech.id;
                  const activeCount = techActiveTickets[tech.id] ?? 0;
                  const loadColor = activeCount === 0
                    ? { color: "#16a34a", bg: "#f0fdf4" }
                    : activeCount <= 3
                      ? { color: "#d97706", bg: "#fffbeb" }
                      : { color: "#dc2626", bg: "#fef2f2" };

                  return (
                    <li key={tech.id} style={{ borderBottom: idx < technicians.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                      {/* Row */}
                      <div
                        onClick={() => setSelectedTech(isSelected ? null : tech)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "14px 24px", cursor: "pointer",
                          background: isSelected ? "#eff6ff" : "transparent",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f9fafb"; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 38, height: 38, borderRadius: "50%", background: isSelected ? "#dbeafe" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: isSelected ? "#3b82f6" : "#6b7280", flexShrink: 0 }}>
                            {tech.name?.[0]}{tech.surname?.[0]}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: isSelected ? "#1d4ed8" : "#111827", margin: "0 0 2px", display: "flex", alignItems: "center", gap: 6 }}>
                              {tech.name} {tech.surname}
                              {isCurrent && (
                                <span style={{ fontSize: 9, fontWeight: 700, color: "#3b82f6", background: "#eff6ff", padding: "2px 7px", borderRadius: 99, textTransform: "uppercase" }}>
                                  {t("ticketDetail.currentBadge")}
                                </span>
                              )}
                            </p>
                            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                              {tech.job_title || t("ticketDetail.techRole")}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 99, background: loadColor.bg, color: loadColor.color }}>
                            {t("ticketDetail.activeTickets", { count: activeCount, plural: activeCount !== 1 ? "s" : "" })}
                          </span>
                          <MdExpandMore style={{ fontSize: 18, color: isSelected ? "#3b82f6" : "#d1d5db", transform: isSelected ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isSelected && (
                        <div style={{ background: "#eff6ff", borderTop: "1px solid #dbeafe", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", animation: "fadeIn 0.15s ease" }}>
                          <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                            {[
                              { label: t("ticketDetail.techFields.email"),   value: tech.email },
                              { label: t("ticketDetail.techFields.contact"), value: tech.phone },
                              { label: t("ticketDetail.techFields.office"),  value: tech.office },
                            ].map(({ label, value }) => (
                              <div key={label}>
                                <p style={{ fontSize: 9, fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>{label}</p>
                                <p style={{ fontSize: 12, fontWeight: 600, color: "#1e40af", margin: 0 }}>{value || "—"}</p>
                              </div>
                            ))}
                            <div>
                              <p style={{ fontSize: 9, fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>
                                {t("ticketDetail.techFields.workload")}
                              </p>
                              <p style={{ fontSize: 12, fontWeight: 700, color: loadColor.color, margin: 0 }}>
                                {t("ticketDetail.activeTickets", { count: activeCount, plural: activeCount !== 1 ? "s" : "" })}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleAssign}
                            style={{ padding: "11px 24px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", fontFamily: "Inter, sans-serif", background: "#3b82f6", color: "#fff", boxShadow: "0 2px 8px rgba(59,130,246,0.3)", whiteSpace: "nowrap", transition: "background 0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#2563eb"}
                            onMouseLeave={e => e.currentTarget.style.background = "#3b82f6"}
                          >
                            {isAssigned ? t("ticketDetail.confirmReassign") : t("ticketDetail.confirmAssign")}
                          </button>
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

export default TicketDetailPage;