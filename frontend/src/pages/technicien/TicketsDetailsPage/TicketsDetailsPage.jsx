import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_CONFIG, IMPACT_CONFIG, URGENCY_CONFIG } from "../../../config/styles";
import Pill from "../../../components/common/Pill";
import {
  STATUS_KEYS, PRIORITY_KEYS, CATEGORY_KEYS, URGENCY_KEYS, IMPACT_KEYS,
  translateKey, formatDate,
} from "../../../constants/ticketKeys";

const IC = "#b8995a"; // beige icon color

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
  const { t, i18n } = useTranslation(["technicien", "common"]);
  const currentLang = i18n.language;
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const ticketIds = location.state?.ticketIds || JSON.parse(localStorage.getItem("ticketIds") || "[]");
  const currentIndex = ticketIds.findIndex(tid => String(tid) === String(id));
  const prevId = currentIndex > 0 ? ticketIds[currentIndex - 1] : null;
  const nextId = currentIndex < ticketIds.length - 1 ? ticketIds[currentIndex + 1] : null;

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taking, setTaking] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:3001/api/tickets/${id}`)
      .then(res => res.json())
      .then(data => { setTicket(data); setLoading(false); })
      .catch(err => console.error("Error fetching ticket:", err));
  }, [id]);

  const handleTakeCharge = async () => {
    setShowConfirm(false);
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

const translateLegacyMsg = (msg) => {
  if (!msg) return "";

  // ── New format keys ───────────────────────────────────────────────────────
  if (msg === "technician_took_over" || msg.startsWith("technician_took_over:")) {
    const name = msg.includes(":") ? msg.split(":").slice(1).join(":").trim() : "";
    return t("history.technicianTookOver", { ns: "common", name: name || "—" });
  }
  if (msg === "ticket_assigned" || msg.startsWith("ticket_assigned:")) {
    const name = msg.includes(":") ? msg.split(":").slice(1).join(":").trim() : "";
    return t("history.ticketAssigned", { ns: "common", name: name || "—" });
  }
  if (msg === "confirmation_requested" || msg === "history.confirmationRequested") {
    return t("history.confirmationRequested", { ns: "common" });
  }
  if (msg === "employee_confirmed") {
    return t("history.employeeConfirmed", { ns: "common" });
  }
  if (msg === "employee_rejected") {
    return t("history.employeeRejected", { ns: "common" });
  }
  if (msg === "employee_reopened" || msg.startsWith("employee_reopened:")) {
    const name = msg.includes(":") ? msg.split(":").slice(1).join(":").trim() : "";
    return t("history.employeeReopened", { ns: "common", name: name || "—" });
  }
  if (msg === "ticket_closed" || msg.startsWith("ticket_closed:")) {
    const name = msg.includes(":") ? msg.split(":").slice(1).join(":").trim() : "";
    return t("history.ticketClosed", { ns: "common", name: name || "—" });
  }
  if (msg.startsWith("ticket_closed_with_note:")) {
    const note = msg.split(":").slice(1).join(":");
    return t("history.ticketClosedWithNote", { ns: "common", note });
  }
  if (msg.startsWith("ticket_redirected:")) {
    const parts = msg.split(":");
    return t("history.ticketRedirected", { ns: "common", by: parts[1]?.trim() || "—" });
  }
  if (msg.startsWith("internal_note:")) {
    const name = msg.split(":").slice(1).join(":").trim();
    return t("history.internalNote", { ns: "common", name: name || "—" });
  }
  if (msg.startsWith("solution_proposed:")) {
    const name = msg.split(":").slice(1).join(":").trim();
    return t("history.solutionProposed", { ns: "common", name: name || "—" });
  }
  if (msg.startsWith("status_changed:") || msg.startsWith("history.statusChanged:")) {
    const statusKey = msg.split(":")[1];
    const translatedStatus = t(`status.${statusKey}`, { ns: "common", defaultValue: statusKey });
    return t("history.statusChanged", { ns: "common", status: translatedStatus });
  }
  if (msg.startsWith("employee_updated:")) {
    const raw = msg.split(":").slice(1).join(":");
    const detail = raw.split("|").map(part => {
      const trimmed = part.trim();
      const subParts = trimmed.split(":");
      const key = subParts[0];
      const fromRaw = subParts[1];
      const toRaw   = subParts[2];
      const translateValue = (field, val) => {
        if (!val) return val;
        if (field === "impact_changed")  return t(`impact.${val}`,  { ns: "common", defaultValue: val });
        if (field === "urgency_changed") return t(`urgency.${val}`, { ns: "common", defaultValue: val });
        if (field === "status_changed")  return t(`status.${val}`,  { ns: "common", defaultValue: val });
        return val;
      };
      const from = translateValue(key, fromRaw);
      const to   = translateValue(key, toRaw);
      return t(`history.changes.${key}`, { ns: "common", from, to, defaultValue: trimmed });
    }).join(", ");
    return t("history.employeeUpdated", { ns: "common", detail });
  }

  // ── Legacy French strings (old DB rows) ───────────────────────────────────
  const LEGACY = {
    "Technicien a pris en charge le ticket":                      t("history.technicianTookOver",    { ns: "common", name: "" }),
    "Ticket assigné à un technicien":                             t("history.ticketAssigned",         { ns: "common", name: "" }),
    "Demande de confirmation de résolution envoyée à l'employé.": t("history.confirmationRequested", { ns: "common" }),
    "Ticket fermé manuellement par le technicien.":               t("history.ticketClosed",           { ns: "common", name: "" }),
    "Confirme resolu.":                                           t("history.employeeConfirmed",      { ns: "common" }),
    "Probleme persiste.":                                         t("history.employeeRejected",       { ns: "common" }),
  };
  const norm = (s) => s.replace(/[''`]/g, "'").trim();
  const legacy = Object.entries(LEGACY).find(([k]) => norm(k) === norm(msg));
  if (legacy) return legacy[1];

  return null;
};

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ width: 32, height: 32, border: "2px solid #e8e8e8", borderTopColor: "#1e3a8a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const tk = ticket;
  const employee = tk.employee || tk.users_tickets_created_byTousers;
  const isAssigned = !!(tk.technician?.id || tk.technicienId);
  const isAssignedToMe = (tk.technician?.id === currentUser?.id) || (tk.technicienId === currentUser?.id);

  const calculateSLA = () => {
    if (!tk.sla_date_limite) return null;
    const PAUSED   = ["pending", "pending_supplier"];
    const TERMINAL = ["resolved", "closed", "rejected"];
    const now    = Date.now();
    const due    = new Date(tk.sla_date_limite).getTime();
    const debut  = tk.sla_date_debut ? new Date(tk.sla_date_debut).getTime() : due - 24 * 3600000;
    const window = due - debut;
    if (TERMINAL.includes(tk.status)) {
      const closed   = tk.closed_at ? new Date(tk.closed_at).getTime() : due;
      const exceeded = closed > due;
      const delta    = Math.abs(closed - due);
      const h = Math.floor(delta / 3600000), m = Math.floor((delta % 3600000) / 60000);
      return { mode: "terminal", exceeded, text: exceeded ? t("ticketDetail.sla.exceeded", { h, m }) : t("ticketDetail.sla.closedOk"), pct: exceeded ? 100 : Math.min(100, Math.max(0, ((due - closed) / window) * 100)) };
    }
    if (PAUSED.includes(tk.status)) {
      const frozen = tk.sla_pause_elapsed_ms != null ? Number(tk.sla_pause_elapsed_ms) : Math.max(0, due - now);
      const h = Math.floor(frozen / 3600000), m = Math.floor((frozen % 3600000) / 60000);
      return { mode: "paused", text: t("ticketDetail.sla.frozen", { h, m }), pct: Math.min(100, (frozen / window) * 100) };
    }
    const remaining = due - now;
    const exceeded  = remaining <= 0;
    const abs = Math.abs(remaining);
    const h = Math.floor(abs / 3600000), m = Math.floor((abs % 3600000) / 60000);
    return {
      mode: "active", exceeded,
      text: exceeded ? t("ticketDetail.sla.exceeded", { h, m }) : t("ticketDetail.sla.remaining", { h, m }),
      pct: exceeded ? 100 : Math.min(100, Math.max(0, (remaining / window) * 100)),
    };
  };

  const sla = calculateSLA();
  const slaColor = !sla ? "#9ca3af"
    : sla.mode === "terminal" ? (sla.exceeded ? "#dc2626" : "#16a34a")
    : sla.mode === "paused"   ? "#7c3aed"
    : sla.exceeded            ? "#dc2626"
    : sla.pct > 50 ? "#16a34a"
    : sla.pct > 20 ? "#d97706"
    : "#f97316";

  const LevelBadge = ({ config, value, keyMap }) => {
    const cfg   = config?.[value];
    const label = keyMap ? translateKey(t, keyMap, value) : value;
    if (!cfg) return <span style={{ fontSize: 12, color: "#6b7280" }}>{label || "—"}</span>;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: cfg.color || "#374151" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.color || "#9ca3af", flexShrink: 0 }} />
        {label}
      </span>
    );
  };

  const modalStyle = {
    position: "fixed", inset: 0, zIndex: 50,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(0,0,0,0.18)", backdropFilter: "blur(3px)",
  };
  const modalBox = {
    background: "#fff", borderRadius: 14, border: "0.5px solid #e8e8e8",
    maxWidth: 380, width: "100%", overflow: "hidden",
  };
const attachmentComments = (tk.comments ?? []).filter(c => c.comment_type === "attachment");
const creationFiles = attachmentComments.flatMap(c => c.files ?? []);
  return (
    <div style={{ fontFamily: " sans-serif", minHeight: "100vh"}}>
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Success modal — unchanged logic */}
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
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>{t("ticketDetail.modal.title")}</h3>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                <span style={{ fontFamily: "monospace", background: "#f8f8f8", padding: "1px 6px", borderRadius: 4 }}>#{id}</span> · {t("ticketDetail.modal.status")}
              </p>
            </div>
            <div style={{ padding: "16px 20px 20px" }}>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px", textAlign: "center", lineHeight: 1.6 }}>{t("ticketDetail.modal.body")}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: "11px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "#1e3a8a", color: "#fff" }}>{t("ticketDetail.modal.stayHere")}</button>
                <button onClick={() => navigate(-1)} style={{ padding: "11px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "0.5px solid #e8e8e8", background: "#fff", color: "#374151" }}>{t("ticketDetail.modal.backToList")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal before taking charge */}
      {showConfirm && (
        <div style={modalStyle}>
          <div style={modalBox}>
            <div style={{ padding: "24px 24px 16px", textAlign: "center", borderBottom: "0.5px solid #f0f0f0" }}>
              <div style={{ width: 44, height: 44, background: "#eff6ff", border: "0.5px solid #bfdbfe", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <Icon name="user-check" size={20} color="#1e3a8a" />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>{t("confirmModal.title")}</h3>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.6 }}>{t("confirmModal.body")}</p>
            </div>
            <div style={{ padding: "16px 20px 20px", display: "flex", gap: 8 }}>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "0.5px solid #e8e8e8", background: "#fff", color: "#374151" }}>{t("confirmModal.cancel")}</button>
              <button onClick={handleTakeCharge} disabled={taking} style={{ flex: 1, padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "#1e3a8a", color: "#fff", opacity: taking ? 0.7 : 1 }}>{t("confirmModal.confirm")}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "20px 28px" }}>

        {/* Top nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <button onClick={() => navigate(`/${currentUser.role}/tickets-service`)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#a0a0a0", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", padding: 0 }}>
            <Icon name="arrow-left" size={15} color="#a0a0a0" /> {t("ticketDetail.back")}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => prevId && navigate(`/${currentUser.role}/tickets-service/${prevId}`, { state: { ticketIds } })} disabled={!prevId}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 7, border: "0.5px solid #e8e8e8", background: "#fff", cursor: !prevId ? "not-allowed" : "pointer", color: !prevId ? "#c4bdb3" : "#374151", fontSize: 12, fontWeight: 600 }}>
              <Icon name="chevron-left" size={13} color={!prevId ? "#c4bdb3" : "#374151"} /> {t("components.header.previous")}
            </button>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#a0a0a0" }}>#{id}</span>
            <button onClick={() => nextId && navigate(`/${currentUser.role}/tickets-service/${nextId}`, { state: { ticketIds } })} disabled={!nextId}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 7, border: "0.5px solid #e8e8e8", background: "#fff", cursor: !nextId ? "not-allowed" : "pointer", color: !nextId ? "#c4bdb3" : "#374151", fontSize: 12, fontWeight: 600 }}>
              {t("components.header.next")} <Icon name="chevron-right" size={13} color={!nextId ? "#c4bdb3" : "#374151"} />
            </button>
          </div>
        </div>

        {/* Option B: main content left, sidebar right */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 14, alignItems: "start" }}>

          {/* ── LEFT : ticket content ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Header */}
            <Card>
              <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 3px" }}>{t("ticketDetail.reference")}</p>
                  <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>#{id} — {tk.title}</h1>
                </div>
                <Pill config={STATUS_CONFIG} value={tk.status} label={translateKey(t, STATUS_KEYS, tk.status)} />
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
                  { icon: "flag-2",     label: t("ticketDetail.cols.priority"),  node: <Pill config={PRIORITY_CONFIG} value={tk.priority} label={translateKey(t, PRIORITY_KEYS, tk.priority)} /> },
                  { icon: "tag",        label: t("ticketDetail.cols.category"),  node: <Pill config={CATEGORY_CONFIG} value={tk.category} label={translateKey(t, CATEGORY_KEYS, tk.category)} /> },
                  { icon: "headset",    label: t("ticketDetail.cols.service"),   node: <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{tk.service?.name || tk.service || "—"}</span> },
                  { icon: "trending-up",label: t("ticketDetail.cols.impact"),   node: <LevelBadge config={IMPACT_CONFIG} value={tk.impact} keyMap={IMPACT_KEYS} /> },
                  { icon: "bolt",       label: t("ticketDetail.cols.urgency"),   node: <LevelBadge config={URGENCY_CONFIG} value={tk.urgency} keyMap={URGENCY_KEYS} /> },
                  { icon: "calendar",   label: t("ticketDetail.cols.createdAt"), node: <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{formatDate(t, tk.createdAt || tk.created_at, "long")}</span> },
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
                    {t("ticketDetail.sla.limit")} : {tk.sla_date_limite ? formatDate(t, tk.sla_date_limite, "long") : "N/A"}
                  </span>
                </div>
              </Card>
            )}

            {/* Redirect note */}
            {tk.redirect_note && (
              <Card style={{ padding: "14px 20px" }}>
                <SectionLabel style={{ color: "#7e22ce" }}><Icon name="corner-up-left" size={11} color="#7e22ce" style={{ marginRight: 5 }} />{t("ticketDetail.redirect.title")}</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {tk.service    && <div style={{ fontSize: 12, color: "#374151" }}><span style={{ fontWeight: 600, color: "#6b21a8" }}>{t("ticketDetail.redirect.service")} : </span>{tk.service?.name || tk.service}</div>}
                  {tk.technician && <div style={{ fontSize: 12, color: "#374151" }}><span style={{ fontWeight: 600, color: "#6b21a8" }}>{t("ticketDetail.redirect.technician")} : </span>{tk.technician.name} {tk.technician.surname}</div>}
                  {tk.redirected_at && <div style={{ fontSize: 12, color: "#374151" }}><span style={{ fontWeight: 600, color: "#6b21a8" }}>{t("ticketDetail.redirect.redirectedAt")} : </span>{formatDate(t, tk.redirected_at, "withTime")}</div>}
                  <div style={{ fontSize: 12, color: "#374151", borderTop: "0.5px solid #ede9fe", paddingTop: 5, marginTop: 2 }}>
                    <span style={{ fontWeight: 600, color: "#6b21a8" }}>{t("ticketDetail.redirect.reason")} : </span>{tk.redirect_note}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8,  top: 20 }}>

            {/* Employee profile */}
            <Card>
              <div style={{ padding: "10px 14px 12px", textAlign: "center", borderBottom: "0.5px solid #f0f0f0" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#fdf2f8", border: "0.5px solid #fbcfe8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#9d174d", margin: "0 auto 8px" }}>
                  {(employee?.name?.[0] || "").toUpperCase()}{(employee?.surname?.[0] || "").toUpperCase()}
                </div>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 5px" }}>{employee?.name} {employee?.surname}</h2>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#9d174d", background: "#fdf2f8", border: "0.5px solid #fbcfe8", padding: "2px 10px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {employee?.role || t("ticketDetail.profile.employee")}
                </span>
              </div>
              <div>
                <Row icon="mail"        label={t("ticketDetail.profile.email")}      value={employee?.email} />
                <Row icon="building"    label={t("ticketDetail.profile.department")} value={employee?.department} />
                <Row icon="briefcase"   label={t("ticketDetail.profile.position")}   value={employee?.job_title} />
                <Row icon="phone"       label={t("ticketDetail.profile.contact")}    value={employee?.phone} />
                <Row icon="map-pin"     label={t("ticketDetail.profile.office")}     value={employee?.office} />
              </div>
            </Card>

            {/* Technician + button */}
            <Card style={{ padding: "14px 16px" }}>
              <SectionLabel><Icon name="tool" size={11} color="#a0a0a0" style={{ marginRight: 5 }} />{t("ticketDetail.assignedTech")}</SectionLabel>

              {isAssignedToMe ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Icon name="circle-check" size={15} color="#16a34a" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>{t("ticketDetail.managedByYou")}</span>
                </div>
              ) : (
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", display: "block", marginBottom: 6 }}>
                  {tk.technician?.name ? `${tk.technician.name} ${tk.technician.surname}` : t("ticketDetail.waitingExpert")}
                </span>
              )}

              {(tk.technician?.id || tk.technicienId) && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                  {tk.assigned_action === "taken" ? (
                    <>
                      <Icon name="user" size={12} color="#3b82f6" />
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        {t("history.technicianTookOver", { ns: "common", name: tk.technician?.name ? `${tk.technician.name} ${tk.technician.surname}`.trim() : "" })}
                      </span>
                    </>
                  ) : (
                    ["assigned", "updated"].includes(tk.assigned_action) && (
                      <>
                        <Icon name="user-check" size={12} color="#7c3aed" />
                        <span style={{ fontSize: 11, color: "#64748b" }}>
                          {t("ticketDetail.assignedByManager")}{" "}
                          <strong style={{ color: "#0f172a" }}>
                            {tk.assigned_by_manager ? `${tk.assigned_by_manager.name} ${tk.assigned_by_manager.surname}` : t("ticketDetail.aManager")}
                          </strong>
                        </span>
                      </>
                    )
                  )}
                </div>
              )}

              {tk.assigned_at && <p style={{ fontSize: 11, color: "#a0a0a0", margin: "2px 0" }}>{t("ticketDetail.assignedOn")} : {formatDate(t, tk.assigned_at, "long")}</p>}
              {tk.closed_at   && <p style={{ fontSize: 11, color: "#a0a0a0", margin: "2px 0" }}>{t("ticketDetail.closedOn")} : {formatDate(t, tk.closed_at, "long")}</p>}

              <button
                onClick={() => !isAssigned && setShowConfirm(true)}
                disabled={taking || isAssigned}
                style={{ marginTop: 12, width: "100%", padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: isAssigned ? "not-allowed" : "pointer", border: "none", background: isAssigned ? "#f0f0f0" : "#1e3a8a", color: isAssigned ? "#a0a0a0" : "#fff", opacity: taking ? 0.7 : 1, transition: "background 0.15s" }}
                onMouseEnter={e => { if (!isAssigned) e.currentTarget.style.background = "#1e40af"; }}
                onMouseLeave={e => { if (!isAssigned) e.currentTarget.style.background = "#1e3a8a"; }}
              >
                {taking ? t("ticketDetail.btn.taking") : isAssigned ? t("ticketDetail.btn.alreadyAssigned") : t("ticketDetail.btn.takeCharge")}
              </button>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;