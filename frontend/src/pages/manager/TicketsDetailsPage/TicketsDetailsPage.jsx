import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_CONFIG, IMPACT_CONFIG, URGENCY_CONFIG } from "../../../config/styles";
import Pill from "../../../components/common/Pill";

const IC = "#b8995a";

const Icon = ({ name, size = 15, color = IC, style = {} }) => (
  <i className={`ti ti-${name}`} style={{ fontSize: size, color, lineHeight: 1, ...style }} aria-hidden="true" />
);

const Row = ({ icon, label, value }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 16px", borderBottom: "0.5px solid #f0f0f0" }}>
    <div style={{ marginTop: 1, flexShrink: 0 }}><Icon name={icon} size={14} /></div>
    <div>
      <p style={{ fontSize: 10, fontWeight: 600, color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 1px" }}>{label}</p>
      <p style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a", margin: 0 }}>{value || "—"}</p>
    </div>
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 12, overflow: "hidden", ...style }}>
    {children}
  </div>
);

const SectionLabel = ({ children }) => (
  <p style={{ fontSize: 10, fontWeight: 700, color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 8px" }}>
    {children}
  </p>
);

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t }     = useTranslation(["manager", "common"]);
  const { t: tc } = useTranslation("common");

    const [, forceUpdate] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => forceUpdate(n => n + 1), 60000);
    return () => clearInterval(timer);
  }, []);
  
  const fmtDate = (str) => {
    if (!str) return "—";
    const d = new Date(str);
    if (isNaN(d)) return "—";
    const day   = String(d.getDate());
    const month = d.toLocaleString(tc("date.locale"), { month: "long" });
    const year  = d.getFullYear();
    return (tc("date.long") || "D MMMM YYYY").replace("MMMM", month).replace("D", day).replace("YYYY", year);
  };

  const fmtDateTime = (str) => {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return "—";
  const day   = String(d.getDate());
  const month = d.toLocaleString(tc("date.locale"), { month: "long" });
  const year  = d.getFullYear();
  const hours   = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const date = (tc("date.long") || "D MMMM YYYY").replace("MMMM", month).replace("D", day).replace("YYYY", year);
  return `${date} — ${hours}:${minutes}`;
};

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const sId = user.service_id;

  const ticketIds = location.state?.ticketIds || JSON.parse(localStorage.getItem("ticketIds") || "[]");
  const currentIndex = ticketIds.findIndex(tid => String(tid) === String(id));
  const prevId = currentIndex > 0 ? ticketIds[currentIndex - 1] : null;
  const nextId = currentIndex < ticketIds.length - 1 ? ticketIds[currentIndex + 1] : null;

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
    const res = await fetch(`http://localhost:3001/api/tickets/${id}/assign`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ technicienId: selectedTech.id, action: "assigned", assigned_by: user.id }),
    });
   if (res.ok) {
  setShowList(false);

  setModalMessage(
    `${t("ticketDetail.modal.title")} ${selectedTech.name} ${selectedTech.surname}`
  );

  setShowModal(true);
}
  };

  const handleCloseModal = () => { setShowModal(false); navigate("/manager/tickets-service"); };

  function workingMsBetween(from, to) {
  const WORK_START = 8, WORK_END = 16;
  const WORK_DAYS  = new Set([0, 1, 2, 3, 4]);
  let ms = 0;
  let current = new Date(from);
  const end = new Date(to);
  while (current < end) {
    const day = current.getDay();
    if (WORK_DAYS.has(day)) {
      const dayStart = new Date(current); dayStart.setHours(WORK_START, 0, 0, 0);
      const dayEnd   = new Date(current); dayEnd.setHours(WORK_END, 0, 0, 0);
      const sliceFrom = current < dayStart ? dayStart : current;
      const sliceTo   = end < dayEnd ? end : dayEnd;
      if (sliceTo > sliceFrom) ms += sliceTo.getTime() - sliceFrom.getTime();
    }
    current.setDate(current.getDate() + 1);
    current.setHours(WORK_START, 0, 0, 0);
  }
  return ms;
}

const calculateSLA = (tk) => {
  if (!tk?.sla_date_limite) return null;
  const PAUSED   = ["pending", "pending_supplier"];
  const TERMINAL = ["resolved", "closed", "rejected"];
  const now   = new Date();
  const due   = new Date(tk.sla_date_limite);
  const debut = new Date(tk.sla_date_debut ?? (due.getTime() - 24 * 3600000));
  const win   = Math.max(1, workingMsBetween(debut, due));

  if (TERMINAL.includes(tk.status)) {
    const closed   = tk.closed_at ? new Date(tk.closed_at) : due;
    const exceeded = closed > due;
    const delta    = Math.abs(closed.getTime() - due.getTime());
    const h = Math.floor(delta / 3600000), m = Math.floor((delta % 3600000) / 60000);
    const used = workingMsBetween(debut, closed);
    return { mode: "terminal", exceeded, text: exceeded ? t("ticketDetail.sla.exceeded", { h, m }) : t("ticketDetail.sla.closedOk"), pct: Math.min(100, Math.max(0, (used / win) * 100)) };
  }

  if (PAUSED.includes(tk.status)) {
    const elapsed = tk.sla_pause_elapsed_ms ? Number(tk.sla_pause_elapsed_ms) : null;
    const frozen  = elapsed != null ? elapsed : workingMsBetween(now, due);
    const h = Math.floor(frozen / 3600000), m = Math.floor((frozen % 3600000) / 60000);
    return { mode: "paused", text: t("ticketDetail.sla.frozen", { h, m }), pct: Math.min(100, (frozen / win) * 100) };
  }

  const remaining = due > now ? workingMsBetween(now, due) : 0;
  const exceeded  = now > due;
  const abs       = exceeded ? workingMsBetween(due, now) : remaining;
  const used      = win - remaining;
  const h = Math.floor(abs / 3600000), m = Math.floor((abs % 3600000) / 60000);
  return { mode: "active", exceeded, text: exceeded ? t("ticketDetail.sla.exceeded", { h, m }) : t("ticketDetail.sla.remaining", { h, m }), pct: exceeded ? 100 : Math.max(0, Math.min(100, (used / win) * 100)) };
};

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ width: 32, height: 32, border: "2px solid #e8e8e8", borderTopColor: "#1e3a8a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const tk = ticket;
  const employee    = tk.employee || tk.user_ticket_created_byTouser;
  const assignedTech = tk.technician || null;
  const isAssigned  = !!(assignedTech?.id);
  const isTerminal  = ["resolved", "closed", "rejected"].includes(tk.status);
  const sla         = calculateSLA(tk);

const slaColor = !sla ? "#9ca3af"
  : sla.mode === "terminal" ? (sla.exceeded ? "#dc2626" : "#16a34a")
  : sla.mode === "paused"   ? "#7c3aed"
  : sla.exceeded            ? "#dc2626"
  : sla.pct > 80            ? "#dc2626"
  : sla.pct > 50            ? "#d97706"
  : "#16a34a";

  const LevelBadge = ({ config, value, label }) => {
    const cfg = config?.[value];
    if (!cfg) return <span style={{ fontSize: 12, color: "#6b7280" }}>{label || value || "—"}</span>;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: cfg.color || "#374151" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.color || "#9ca3af", flexShrink: 0 }} />
        {label || value}
      </span>
    );
  };

  const modalStyle = { position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.18)", backdropFilter: "blur(3px)" };
  const modalBox   = { background: "#fff", borderRadius: 14, border: "0.5px solid #e8e8e8", maxWidth: 380, width: "100%", overflow: "hidden" };
const attachmentComments = (tk.message ?? []).filter(c => c.comment_type === "attachment");
const creationFiles = attachmentComments.flatMap(c => c.files ?? []);
  return (
    <div style={{ fontFamily: " sans-serif", minHeight: "100vh"}}>
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Modal */}
      {showModal && (
        <div style={modalStyle}>
          <div style={modalBox}>
            <div style={{ padding: "28px 28px 20px", textAlign: "center", borderBottom: "0.5px solid #f0f0f0", position: "relative" }}>
              <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <Icon name="x" size={16} color="#a0a0a0" />
              </button>
              <div style={{ width: 44, height: 44, background: "#f0fdf4", border: "0.5px solid #bbf7d0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <Icon name="check" size={20} color="#16a34a" />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>{modalMessage}</h3>
            </div>
            <div style={{ padding: "16px 20px 20px" }}>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px", textAlign: "center", lineHeight: 1.6 }}>{t("ticketDetail.modal.body")}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={handleCloseModal} style={{ padding: "11px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "#1e3a8a", color: "#fff" }}>{t("ticketDetail.modal.backToList")}</button>
                <button onClick={() => { setShowModal(false); setShowList(false); setSelectedTech(null); fetchTicket(); }} style={{ padding: "11px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "0.5px solid #e8e8e8", background: "#fff", color: "#374151" }}>{t("ticketDetail.modal.stayHere")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment modal */}
      {showList && (
        <div style={modalStyle}>
          <div style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #e8e8e8", width: "100%", maxWidth: 520, overflow: "hidden", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="users" size={15} color="#1e3a8a" />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{t("ticketDetail.assignedTech")}</span>
              </div>
              <button onClick={() => { setShowList(false); setSelectedTech(null); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <Icon name="x" size={16} color="#a0a0a0" />
              </button>
            </div>

            {/* Tech list */}
            <ul style={{ listStyle: "none", margin: 0, padding: 0, overflowY: "auto", flex: 1 }}>
              {technicians.map((tech, idx) => {
                const isSelected  = selectedTech?.id === tech.id;
                const isCurrent   = assignedTech?.id === tech.id;
                const activeCount = techActiveTickets[tech.id] ?? 0;
                const loadColor   = activeCount === 0 ? { color: "#16a34a", bg: "#f0fdf4" } : activeCount <= 3 ? { color: "#d97706", bg: "#fffbeb" } : { color: "#dc2626", bg: "#fef2f2" };
                return (
                  <li key={tech.id} style={{ borderBottom: idx < technicians.length - 1 ? "0.5px solid #f0f0f0" : "none" }}>
                    <div onClick={() => setSelectedTech(isSelected ? null : tech)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", cursor: "pointer", background: isSelected ? "#eff6ff" : "transparent", transition: "background 0.15s" }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#fafafa"; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? "#eff6ff" : "transparent"; }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: isSelected ? "#bfdbfe" : "#eff6ff", border: `1px solid ${isSelected ? "#93c5fd" : "#bfdbfe"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: isSelected ? "#1e3a8a" : "#1d4ed8", flexShrink: 0 }}>
                          {tech.name?.[0]}{tech.surname?.[0]}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: isSelected ? "#1d4ed8" : "#0f172a", margin: "0 0 2px", display: "flex", alignItems: "center", gap: 6 }}>
                            {tech.name} {tech.surname}
                            {isCurrent && <span style={{ fontSize: 9, fontWeight: 700, color: "#1d4ed8", background: "#eff6ff", border: "0.5px solid #bfdbfe", padding: "2px 7px", borderRadius: 99, textTransform: "uppercase" }}>{t("ticketDetail.btn.alreadyAssigned")}</span>}
                          </p>
                          <div style={{ display: "flex", gap: 12 }}>
                            <span style={{ fontSize: 11, color: "#a0a0a0" }}>{tech.job_title || "—"}</span>
                            {tech.email && <span style={{ fontSize: 11, color: "#a0a0a0" }}>{tech.email}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: loadColor.bg, color: loadColor.color }}>{activeCount} ticket{activeCount !== 1 ? "s" : ""}</span>
                        <Icon name="chevron-down" size={13} color={isSelected ? "#1d4ed8" : "#c4bdb3"} style={{ transform: isSelected ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                      </div>
                    </div>

                    {/* Expanded */}
                    {isSelected && (
                      <div style={{ background: "#eff6ff", borderTop: "0.5px solid #bfdbfe", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                          {[{ label: t("ticketDetail.profile.contact"), value: tech.phone }, { label: t("ticketDetail.profile.office"), value: tech.office }].map(({ label, value }) => (
                            <div key={label}>
                              <p style={{ fontSize: 9, fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>{label}</p>
                              <p style={{ fontSize: 12, fontWeight: 600, color: "#1e40af", margin: 0 }}>{value || "—"}</p>
                            </div>
                          ))}
                        </div>
                        <button onClick={handleAssign} style={{ padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "#1e3a8a", color: "#fff" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#1e40af"}
                          onMouseLeave={e => e.currentTarget.style.background = "#1e3a8a"}>
                          {t("ticketDetail.btn.assign")}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <div style={{ padding: "20px 28px" }}>

        {/* Top nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <button onClick={() => navigate("/manager/tickets-service")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#a0a0a0", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", padding: 0 }}>
            <Icon name="arrow-left" size={15} color="#a0a0a0" /> {t("ticketDetail.back")}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => prevId && navigate(`/manager/tickets-service/${prevId}`, { state: { ticketIds } })} disabled={!prevId}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 7, border: "0.5px solid #e8e8e8", background: "#fff", cursor: !prevId ? "not-allowed" : "pointer", color: !prevId ? "#c4bdb3" : "#374151", fontSize: 12, fontWeight: 600 }}>
              <Icon name="chevron-left" size={13} color={!prevId ? "#c4bdb3" : "#374151"} /> {t("components.header.previous")}
            </button>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#a0a0a0" }}>#{id}</span>
            <button onClick={() => nextId && navigate(`/manager/tickets-service/${nextId}`, { state: { ticketIds } })} disabled={!nextId}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 7, border: "0.5px solid #e8e8e8", background: "#fff", cursor: !nextId ? "not-allowed" : "pointer", color: !nextId ? "#c4bdb3" : "#374151", fontSize: 12, fontWeight: 600 }}>
              {t("components.header.next")} <Icon name="chevron-right" size={13} color={!nextId ? "#c4bdb3" : "#374151"} />
            </button>
          </div>
        </div>

        {/* Option B grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14, alignItems: "start" }}>

          {/* ── LEFT: ticket content ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Header + status */}
            <Card>
              <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 3px" }}>{t("ticketDetail.reference")}</p>
                  <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>#{id} — {tk.title}</h1>
                </div>
                <Pill config={STATUS_CONFIG} value={tk.status} label={t(`status.${tk.status}`, { ns: "common" })} />
              </div>
            </Card>

            {/* Description */}
            <Card style={{ padding: "16px 20px" }}>
              <SectionLabel><Icon name="align-left" size={11} color="#a0a0a0" style={{ marginRight: 5 }} />{t("ticketDetail.description")}</SectionLabel>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, margin: 0 }}>{tk.description}</p>
            </Card>
{creationFiles.length > 0 && (
  <Card style={{ padding: "14px 20px" }}>
    <SectionLabel>
      <Icon name="paperclip" size={11} color="#a0a0a0" style={{ marginRight: 5 }} />
      {t("ticketDetail.initialAttachments", { defaultValue: "Pièces jointes initiales" })}
    </SectionLabel>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {creationFiles.map((f, i) => (
        <a key={i}
          href={`http://localhost:3001/${f.filePath ?? f.file_path}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, padding: "4px 10px", borderRadius: 6,
            background: "#f8fafc", border: "0.5px solid #e2e8f0",
            color: "#475569", textDecoration: "none", fontWeight: 500
          }}>
          <Icon name="paperclip" size={10} color="#94a3b8" />
          {f.fileName ?? f.file_name}
        </a>
      ))}
    </div>
  </Card>
)}
            {/* Specs */}
            <Card style={{ padding: "16px 20px" }}>
              <SectionLabel><Icon name="layout-grid" size={11} color="#a0a0a0" style={{ marginRight: 5 }} />{t("ticketDetail.info")}</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {[
                  { icon: "flag-2",      label: t("ticketDetail.cols.priority"),  node: <Pill config={PRIORITY_CONFIG} value={tk.priority} label={t(`priority.${tk.priority}`, { ns: "common" })} /> },
                  { icon: "tag",         label: t("ticketDetail.cols.category"),  node: <Pill config={CATEGORY_CONFIG} value={tk.category} label={t(`category.${tk.category}`, { ns: "common" })} /> },
                  { icon: "trending-up", label: t("ticketDetail.cols.impact"),    node: <LevelBadge config={IMPACT_CONFIG}  value={tk.impact}   label={t(`impact.${tk.impact}`,   { ns: "common" })} /> },
                  { icon: "bolt",        label: t("ticketDetail.cols.urgency"),   node: <LevelBadge config={URGENCY_CONFIG} value={tk.urgency} label={t(`urgency.${tk.urgency}`, { ns: "common" })} /> },
                  { icon: "headset",     label: t("ticketDetail.cols.service"),   node: <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{tk.service?.name || tk.service || "—"}</span> },
                  { icon: "calendar",    label: t("ticketDetail.cols.createdAt"), node: <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{fmtDate(tk.createdAt || tk.created_at)}</span> },
                ].map(({ icon, label, node }, i) => (
                  <div key={i} style={{ border: "0.5px solid #ebebeb", borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Icon name={icon} size={12} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
                    </div>
                    {node}
                  </div>
                ))}
              </div>
            </Card>

            {/* SLA */}
            {sla && (
              <Card style={{ padding: "14px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="clock" size={14} color={slaColor} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("ticketDetail.sla.title")}</span>
                    {sla.mode === "paused"   && <span style={{ fontSize: 10, fontWeight: 600, color: "#7c3aed", background: "#ede9fe", padding: "2px 7px", borderRadius: 99 }}>{t("ticketDetail.sla.paused")}</span>}
                    {sla.mode === "terminal" && <span style={{ fontSize: 10, fontWeight: 600, color: "#64748b", background: "#f1f5f9", padding: "2px 7px", borderRadius: 99 }}>{t("ticketDetail.sla.closed")}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 80, background: "#ebebeb", height: 4, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${Math.round(sla.pct)}%`, background: slaColor, height: "100%", borderRadius: 99, transition: "width 1s ease" }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: slaColor, whiteSpace: "nowrap" }}>{sla.text}</span>
                  {sla.mode === "active" && sla.exceeded && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#dc2626", background: "#fef2f2", padding: "2px 8px", borderRadius: 99, border: "0.5px solid #fecaca" }}>{t("ticketDetail.sla.breachDetected")}</span>
                  )}
                  <span style={{ fontSize: 11, color: "#a0a0a0", whiteSpace: "nowrap" }}>
                    {t("ticketDetail.sla.limit")} : {tk.sla_date_limite ? fmtDate(tk.sla_date_limite) : "N/A"}
                  </span>
                </div>
              </Card>
            )}

            {/* Redirect note */}
            {tk.redirect_note && (
              <Card style={{ padding: "14px 20px" }}>
                <SectionLabel><Icon name="corner-up-left" size={11} color="#7e22ce" style={{ marginRight: 5 }} />{t("ticketDetail.redirect.title")}</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {tk.service    && <div style={{ fontSize: 12, color: "#374151" }}><span style={{ fontWeight: 600, color: "#6b21a8" }}>{t("ticketDetail.redirect.service")} : </span>{tk.service?.name || tk.service}</div>}
                  {tk.technician && <div style={{ fontSize: 12, color: "#374151" }}><span style={{ fontWeight: 600, color: "#6b21a8" }}>{t("ticketDetail.redirect.technician")} : </span>{tk.technician.name} {tk.technician.surname}</div>}
                  {tk.redirected_at && <div style={{ fontSize: 12, color: "#374151" }}><span style={{ fontWeight: 600, color: "#6b21a8" }}>{t("ticketDetail.redirect.redirectedAt")} : </span>{fmtDate(tk.redirected_at)}</div>}
                  <div style={{ fontSize: 12, color: "#374151", borderTop: "0.5px solid #ede9fe", paddingTop: 5, marginTop: 2 }}>
                    <span style={{ fontWeight: 600, color: "#6b21a8" }}>{t("ticketDetail.redirect.reason")} : </span>{tk.redirect_note}
                  </div>
                </div>
              </Card>
            )}


          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12,  top: 20, maxHeight: "calc(100vh - 60px)", overflowY: "auto" }}>

            {/* Employee profile */}
           <Card style={{ paddingBottom: 8 }}>
              <div style={{ padding: "10px 14px 12px", textAlign: "center", borderBottom: "0.5px solid #f0f0f0" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#fdf2f8", border: "0.5px solid #fbcfe8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#9d174d", margin: "0 auto 8px" }}>
                  {(employee?.name?.[0] || "").toUpperCase()}{(employee?.surname?.[0] || "").toUpperCase()}
                </div>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 5px" }}>{employee?.name} {employee?.surname}</h2>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#9d174d", background: "#fdf2f8", border: "0.5px solid #fbcfe8", padding: "2px 10px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {employee?.role || t("ticketDetail.profile.employee")}
                </span>
              </div>
              <div style={{ paddingBottom: 14 }}>
                <Row icon="mail"      label={t("ticketDetail.profile.email")}      value={employee?.email} />
                <Row icon="building"  label={t("ticketDetail.cols.service")}        value={employee?.department} />
                <Row icon="briefcase" label={t("ticketDetail.profile.position")}   value={employee?.job_title} />
                <Row icon="phone"     label={t("ticketDetail.profile.contact")}    value={employee?.phone} />
                <Row icon="map-pin"   label={t("ticketDetail.profile.office")}     value={employee?.office} />
              </div>
            </Card>

{/* Assigned tech + assign button */}
<Card style={{ padding: "14px 16px" }}>
  <SectionLabel><Icon name="tool" size={11} color="#a0a0a0" style={{ marginRight: 5 }} />{t("ticketDetail.assignedTech")}</SectionLabel>

  {isAssigned ? (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
      <Icon name="user" size={14} color="#1d4ed8" />
      <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{assignedTech.name} {assignedTech.surname}</span>
    </div>
  ) : (
    <span style={{ fontSize: 13, fontWeight: 600, color: "#1e3a8a", fontStyle: "italic", display: "block", marginBottom: 6 }}>{t("ticketsService.unassigned")}</span>
  )}

  {isAssigned && (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
      {tk.assigned_action === "taken" ? (
        <><Icon name="user" size={12} color="#3b82f6" /><span style={{ fontSize: 11, color: "#64748b" }}>{t("ticketDetail.takenByTech")}</span></>
      ) : (
        ["assigned", "updated"].includes(tk.assigned_action) && (
          <><Icon name="user-check" size={12} color="#7c3aed" />
          <span style={{ fontSize: 11, color: "#64748b" }}>
            {t("ticketDetail.assignedByManager")}
            <strong style={{ color: "#0f172a" }}>{tk.assigned_by_manager ? ` ${tk.assigned_by_manager.name} ${tk.assigned_by_manager.surname}` : t("ticketDetail.aManager")}</strong>
          </span></>
        )
      )}
    </div>
  )}

  {tk.assigned_at && <p style={{ fontSize: 11, color: "#a0a0a0", margin: "2px 0" }}>{t("ticketDetail.assignedOn")} : {fmtDateTime(tk.assigned_at)}</p>}
  {tk.closed_at   && <p style={{ fontSize: 11, color: "#a0a0a0", margin: "2px 0" }}>{t("ticketDetail.closedOn")} : {fmtDate(tk.closed_at)}</p>}

  {!isTerminal && (
    <button
      onClick={() => { setShowList(!showList); setSelectedTech(null); }}
      style={{ marginTop: 12, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: showList ? "#f0f0f0" : "#1e3a8a" , color: showList ? "#374151" : "#fff", transition: "background 0.15s" }}
onMouseEnter={e => { if (!showList) e.currentTarget.style.background = "#1e40af"; }}
onMouseLeave={e => { if (!showList) e.currentTarget.style.background = "#1e3a8a"; }}
   >
      <Icon name={showList ? "x" : isAssigned ? "user-edit" : "user-plus"} size={14} color={showList ? "#374151" : "#fff"} />
      {showList ? t("ticketDetail.btn.cancel") : isAssigned ? t("ticketDetail.btn.updateTech", { defaultValue: "Update Technician" }) : t("ticketDetail.btn.assignTicket")}
    </button>
  )}
</Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;