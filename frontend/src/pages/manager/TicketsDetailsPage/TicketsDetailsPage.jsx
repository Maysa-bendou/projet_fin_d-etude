import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MdArrowBack, MdEmail, MdBusiness, MdWork, MdPhone,
  MdLocationOn, MdTimer, MdCheckCircle, MdPerson,
  MdExpandMore, MdSwapHoriz, MdFlag, MdCategory,
  MdSupportAgent, MdFlashOn, MdTrendingUp, MdCalendarToday,
} from "react-icons/md";
import {
  PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_CONFIG,
  IMPACT_CONFIG, URGENCY_CONFIG,
} from "../../../config/styles";
import Pill from "../../../components/common/Pill";

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation("manager");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const sId = user.service_id;

  /* ── prev / next navigation — same pattern as technician ── */
  const ticketIds =
    location.state?.ticketIds ||
    JSON.parse(localStorage.getItem("ticketIds") || "[]");
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

  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/manager/tickets-service");
  };

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
        mode: "terminal", exceeded,
        text: exceeded ? t("ticketDetail.sla.exceeded", { h, m }) : t("ticketDetail.sla.closedOk"),
        pct: exceeded ? 100 : Math.min(100, ((window - (due - closed)) / window) * 100),
      };
    }
    if (PAUSED.includes(tk.status)) {
      const elapsed = tk.sla_pause_elapsed_ms ? Number(tk.sla_pause_elapsed_ms) : null;
      const frozen = elapsed != null ? window - elapsed : Math.max(0, due - now);
      const h = Math.floor(frozen / 3600000), m = Math.floor((frozen % 3600000) / 60000);
      return { mode: "paused", text: t("ticketDetail.sla.frozen", { h, m }), pct: Math.min(100, ((window - frozen) / window) * 100) };
    }
    const remaining = due - now;
    const exceeded = remaining <= 0;
    const abs = Math.abs(remaining);
    const h = Math.floor(abs / 3600000), m = Math.floor((abs % 3600000) / 60000);
    return {
      mode: "active", exceeded,
      text: exceeded ? t("ticketDetail.sla.exceeded", { h, m }) : t("ticketDetail.sla.remaining", { h, m }),
      pct: Math.min(100, Math.max(0, (remaining / window) * 100)),
    };
  };

  /* ── loading ── */
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f9f6f2" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div className="w-9 h-9 border-4 border-slate-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
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

  const LevelBadge = ({ config, value }) => {
    const cfg = config?.[value];
    if (!cfg) return <span style={{ fontSize: 13, color: "#6b7280" }}>{value || "—"}</span>;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: cfg.color || "#374151" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color || "#9ca3af", flexShrink: 0 }} />
        {value}
      </span>
    );
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", minHeight: "100vh" }}>
      <style>{`
        @keyframes scaleIn { from { opacity:0; transform:scale(0.93); } to { opacity:1; transform:scale(1); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* ── MODAL ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.25)", backdropFilter: "blur(2px)" }}>
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #d9d4cc", boxShadow: "0 24px 60px rgba(0,0,0,0.12)", maxWidth: 400, width: "100%", overflow: "hidden", animation: "scaleIn 0.22s ease" }}>
            <div style={{ background: "#fff", borderBottom: "1px solid #e8e2d9", padding: "28px 32px 24px", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, background: "#fff", border: "2px solid #d9d4cc", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 22, color: "#1e3a8a" }}>✓</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>{modalMessage}</h3>
              <p style={{ fontSize: 10, color: "#94a3b8", margin: 0, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>
                <span style={{ fontFamily: "monospace", background: "#f8fafc", padding: "2px 8px", borderRadius: 6, color: "#475569" }}>#{id}</span> · {t("ticketDetail.modal.confirmed")}
              </p>
            </div>
            <div style={{ padding: "20px 24px 24px" }}>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px", textAlign: "center", lineHeight: 1.6 }}>{t("ticketDetail.modal.whatNext")}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={handleCloseModal} style={{ padding: "12px 0", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", background: "#1e3a8a", color: "#fff" }}>
                  {t("ticketDetail.modal.backToList")}
                </button>
                <button
                  onClick={() => { setShowModal(false); setShowList(false); setSelectedTech(null); fetchTicket(); }}
                  style={{ padding: "12px 0", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "1.5px solid #d9d4cc", background: "#fff", color: "#374151" }}
                >
                  {t("ticketDetail.modal.stayOnTicket")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BODY ── */}
      <div style={{ padding: "20px 28px" }}>

        {/* BACK + PREV / NEXT — same as technician */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <button
            onClick={() => navigate("/manager/tickets-service")}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: 0 }}
          >
            <MdArrowBack style={{ fontSize: 16 }} /> {t("ticketDetail.backToTickets")}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => prevId && navigate(`/manager/tickets-service/${prevId}`, { state: { ticketIds } })}
              disabled={!prevId}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, border: "1px solid #d9d4cc", background: "#fff", cursor: !prevId ? "not-allowed" : "pointer", color: !prevId ? "#c4bdb3" : "#374151", fontSize: 12, fontWeight: 700 }}
            >
              <MdArrowBack style={{ fontSize: 14 }} /> {t("components.header.previous")}
            </button>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", padding: "0 4px" }}>#{id}</span>
            <button
              onClick={() => nextId && navigate(`/manager/tickets-service/${nextId}`, { state: { ticketIds } })}
              disabled={!nextId}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, border: "1px solid #d9d4cc", background: "#fff", cursor: !nextId ? "not-allowed" : "pointer", color: !nextId ? "#c4bdb3" : "#374151", fontSize: 12, fontWeight: 700 }}
            >
              {t("components.header.next")} <MdArrowBack style={{ fontSize: 14, transform: "rotate(180deg)" }} />
            </button>
          </div>
        </div>

        {/* TWO-COLUMN GRID — left column fixed, right column scrolls independently */}
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, alignItems: "start" }}>   {/* ── LEFT : EMPLOYEE — fixed, never grows with right column ── */}
         <div
  style={{
    background: "#fff",
    border: "1px solid #d9d4cc",
    borderRadius: 16,
    overflow: "hidden",
    alignSelf: "start",
    minHeight: "520px"
  }}
> {/* Avatar header */}
            <div style={{ background: "#fff", padding: "20px 20px 16px", textAlign: "center", borderBottom: "1px solid #e8e2d9" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #fce7f3, #fecaca)", border: "2px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "#9d174d", margin: "0 auto 10px" }}>
                {(employee?.name?.[0] || "").toUpperCase()}{(employee?.surname?.[0] || "").toUpperCase()}
              </div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>{employee?.name} {employee?.surname}</h2>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#9d174d", background: "#fce7f3", border: "1px solid #fecaca", padding: "3px 10px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {employee?.role || t("ticketDetail.modal.employee")}
              </span>
            </div>

            {/* Fields */}
            <div style={{ padding: "4px 0" }}>
              {[
                { icon: <MdEmail      style={{ fontSize: 14, color: "#94a3b8" }} />, label: t("ticketDetail.techFields.email"),   value: employee?.email },
                { icon: <MdBusiness   style={{ fontSize: 14, color: "#94a3b8" }} />, label: t("ticketDetail.cols.service"),       value: employee?.department },
                { icon: <MdWork       style={{ fontSize: 14, color: "#94a3b8" }} />, label: "Poste",                              value: employee?.job_title },
                { icon: <MdPhone      style={{ fontSize: 14, color: "#94a3b8" }} />, label: t("ticketDetail.techFields.contact"), value: employee?.phone },
                { icon: <MdLocationOn style={{ fontSize: 14, color: "#94a3b8" }} />, label: t("ticketDetail.techFields.office"),  value: employee?.office },
              ].map(({ icon, label, value }, i, arr) => (
                <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 18px", borderBottom: i < arr.length - 1 ? "1px solid #f0ebe3" : "none" }}>
                  <div style={{ marginTop: 2, flexShrink: 0 }}>{icon}</div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 1px" }}>{label}</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", margin: 0 }}>{value || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT COLUMN — ticket card + assignment panel stacked ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* MAIN TICKET CARD */}
            
            <div style={{ background: "#fff", border: "1px solid #d9d4cc", borderRadius: 16, overflow: "hidden" }}>

              {/* Ticket header */}
              <div style={{ padding: "16px 22px", borderBottom: "1px solid #e8e2d9", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 3px" }}>{t("ticketDetail.ticketRef")}</p>
                  <h1 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>#{id} — {tk.title}</h1>
                </div>
                <Pill config={STATUS_CONFIG} value={tk.status} />
              </div>

              {/* Description */}
              <div style={{ padding: "14px 22px", borderBottom: "1px solid #e8e2d9" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>{t("ticketDetail.incidentDesc")}</p>
                <div style={{ background: "#faf9f7", border: "1px solid #e8e2d9", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "#475569", lineHeight: 1.65, fontStyle: "italic" }}>
                  {tk.description}
                </div>
              </div>

              {/* SPECS — 3 per row */}
              <div style={{ padding: "14px 22px", borderBottom: "1px solid #e8e2d9" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>{t("ticketDetail.ticketInfo")}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {[
                    { icon: <MdFlag style={{ fontSize: 13 }} />,          label: t("ticketDetail.cols.priority"),  node: <Pill config={PRIORITY_CONFIG} value={tk.priority} /> },
                    { icon: <MdCategory style={{ fontSize: 13 }} />,      label: t("ticketDetail.cols.category"),  node: <Pill config={CATEGORY_CONFIG} value={tk.category} /> },
                    { icon: <MdSupportAgent style={{ fontSize: 13 }} />,  label: t("ticketDetail.cols.service"),   node: <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{tk.service?.name || tk.service || "—"}</span> },
                    { icon: <MdTrendingUp style={{ fontSize: 13 }} />,    label: t("ticketDetail.cols.impact"),    node: <LevelBadge config={IMPACT_CONFIG}  value={tk.impact} /> },
                    { icon: <MdFlashOn style={{ fontSize: 13 }} />,       label: t("ticketDetail.cols.urgency"),   node: <LevelBadge config={URGENCY_CONFIG} value={tk.urgency} /> },
                    { icon: <MdCalendarToday style={{ fontSize: 13 }} />, label: t("ticketDetail.cols.createdAt"), node: <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{new Date(tk.createdAt || tk.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span> },
                  ].map(({ icon, label, node }, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 5, background: "#faf9f7", border: "1px solid #e8e2d9", borderRadius: 10, padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ color: "#94a3b8" }}>{icon}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
                      </div>
                      {node}
                    </div>
                  ))}
                </div>
              </div>

              {/* SLA */}
              {sla && (
                <div style={{ padding: "12px 22px", borderBottom: "1px solid #e8e2d9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <MdTimer style={{ fontSize: 14, color: slaColor }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("ticketDetail.slaSection")}</span>
                      {sla.mode === "paused" && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", background: "#ede9fe", padding: "2px 7px", borderRadius: 99 }}>{t("ticketDetail.slaPaused")}</span>
                      )}
                      {sla.mode === "terminal" && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "2px 7px", borderRadius: 99 }}>{t("ticketDetail.slaClosed")}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 80, background: "#e8e2d9", height: 5, borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${Math.round(sla.pct)}%`, background: slaColor, height: "100%", borderRadius: 99, transition: "width 1s ease" }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: slaColor, whiteSpace: "nowrap" }}>{sla.text}</span>
                    {sla.mode === "active" && sla.exceeded && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", background: "#fef2f2", padding: "2px 8px", borderRadius: 99, border: "1px solid #fecaca" }}>{t("ticketDetail.slaOverrun")}</span>
                    )}
                    <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
                      {t("ticketDetail.slaLimit")} : {tk.sla_date_limite ? new Date(tk.sla_date_limite).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                    </span>
                  </div>
                </div>
              )}

              {/* Redirect note */}
              {tk.redirect_note && (
                <div style={{ padding: "14px 22px", borderBottom: "1px solid #e8e2d9" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#7e22ce", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>{t("ticketDetail.redirected")}</p>
                  <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 10, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {tk.service    && <div style={{ fontSize: 12, color: "#374151" }}><span style={{ fontWeight: 700, color: "#6b21a8" }}>{t("ticketDetail.redirectService")} : </span>{tk.service?.name || tk.service}</div>}
                    {tk.technician && <div style={{ fontSize: 12, color: "#374151" }}><span style={{ fontWeight: 700, color: "#6b21a8" }}>{t("ticketDetail.redirectTechnician")} : </span>{tk.technician.name} {tk.technician.surname}</div>}
                    {tk.redirected_at && (
                      <div style={{ fontSize: 12, color: "#374151" }}>
                        <span style={{ fontWeight: 700, color: "#6b21a8" }}>{t("ticketDetail.redirectedAt")} : </span>
                        {new Date(tk.redirected_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: "#374151", borderTop: "1px solid #e9d5ff", paddingTop: 6, marginTop: 2 }}>
                      <span style={{ fontWeight: 700, color: "#6b21a8" }}>{t("ticketDetail.redirectReason")} : </span>{tk.redirect_note}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer: assigned tech info + assign button */}
              <div style={{ padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 5px" }}>{t("ticketDetail.assignedTech")}</p>

                  {isAssigned ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <MdPerson style={{ fontSize: 15, color: "#1d4ed8" }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{assignedTech.name} {assignedTech.surname}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#d97706", fontStyle: "italic" }}>{t("ticketDetail.notAssigned")}</span>
                  )}

                  {/* ── WHO ASSIGNED — same as technician view ── */}
                  {isAssigned && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, margin: "5px 0 0" }}>
                      {tk.assigned_action === "taken" ? (
                        <>
                          <MdPerson style={{ fontSize: 13, color: "#3b82f6" }} />
                          <span style={{ fontSize: 11, color: "#64748b" }}>
                            Pris en charge par le technicien
                          </span>
                        </>
                      ) : (
                        ["assigned", "updated"].includes(tk.assigned_action) && (
                          <>
                            <MdSupportAgent style={{ fontSize: 13, color: "#7c3aed" }} />
                            <span style={{ fontSize: 11, color: "#64748b" }}>
                              Assigné par{" "}
                              <strong style={{ color: "#0f172a" }}>
                                {tk.assigned_by_manager
                                  ? `${tk.assigned_by_manager.name} ${tk.assigned_by_manager.surname}`
                                  : "un manager"}
                              </strong>
                            </span>
                          </>
                        )
                      )}
                    </div>
                  )}

                  {tk.assigned_at && <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>{t("ticketDetail.assignedOn")} : {new Date(tk.assigned_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</p>}
                  {tk.closed_at   && <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>{t("ticketDetail.closedOn")} : {new Date(tk.closed_at).toLocaleDateString(undefined,   { day: "numeric", month: "short", year: "numeric" })}</p>}
                </div>

                <button
                  onClick={() => { if (!isTerminal) { setShowList(!showList); setSelectedTech(null); } }}
                  disabled={isTerminal}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                    cursor: isTerminal ? "not-allowed" : "pointer", border: "none",
                    background: isTerminal ? "#e8e2d9"
  : showList ? "#e8e2d9"
  : isAssigned ? "#fff7ed"
  : "#1e3a8a",

color: isTerminal ? "#94a3b8"
  : showList ? "#6b7280"
  : isAssigned ? "#ea580c"
  : "#fff", outline: isAssigned && !showList && !isTerminal ? "1.5px solid #ea580c" : "none",
                    opacity: isTerminal ? 0.6 : 1,
                  }}
                  onMouseEnter={e => { if (!isTerminal && !showList) e.currentTarget.style.background = isAssigned ? "#ffedd5" : "#1e40af"; }}
                  onMouseLeave={e => { if (!isTerminal && !showList) e.currentTarget.style.background = isAssigned ? "#fff7ed" : "#1e3a8a"; }}
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

            {/* ── ASSIGNMENT PANEL — only in right column, never affects left ── */}
            {showList && (
              <div style={{ background: "#fff", border: "1px solid #d9d4cc", borderRadius: 16, overflow: "hidden", animation: "fadeIn 0.2s ease" }}>

                {/* Panel header */}
                <div style={{ padding: "12px 22px", background: "#faf9f7", borderBottom: "1px solid #e8e2d9", display: "flex", alignItems: "center", gap: 10 }}>
                  <MdPerson style={{ fontSize: 14, color: "#94a3b8" }} />
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                    {isAssigned ? t("ticketDetail.panelChooseNew") : t("ticketDetail.panelChoose")}
                  </p>
                </div>

                {/* Technician list */}
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {technicians.map((tech, idx) => {
                    const isSelected  = selectedTech?.id === tech.id;
                    const isCurrent   = assignedTech?.id === tech.id;
                    const activeCount = techActiveTickets[tech.id] ?? 0;
                    const loadColor   = activeCount === 0
                      ? { color: "#16a34a", bg: "#f0fdf4" }
                      : activeCount <= 3
                        ? { color: "#d97706", bg: "#fffbeb" }
                        : { color: "#dc2626", bg: "#fef2f2" };

                    return (
                      <li key={tech.id} style={{ borderBottom: idx < technicians.length - 1 ? "1px solid #f0ebe3" : "none" }}>
                        <div
                          onClick={() => setSelectedTech(isSelected ? null : tech)}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "12px 22px", cursor: "pointer",
                            background: isSelected ? "#eff6ff" : "transparent",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#faf9f7"; }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: "50%",
                              background: isSelected ? "#bfdbfe" : "#eff6ff",
                              border: `1.5px solid ${isSelected ? "#93c5fd" : "#bfdbfe"}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 11, fontWeight: 800,
                              color: isSelected ? "#1e3a8a" : "#1d4ed8",
                              flexShrink: 0,
                            }}>
                              {tech.name?.[0]}{tech.surname?.[0]}
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: isSelected ? "#1d4ed8" : "#0f172a", margin: "0 0 2px", display: "flex", alignItems: "center", gap: 6 }}>
                                {tech.name} {tech.surname}
                                {isCurrent && (
                                  <span style={{ fontSize: 9, fontWeight: 700, color: "#1d4ed8", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "2px 7px", borderRadius: 99, textTransform: "uppercase" }}>
                                    {t("ticketDetail.currentBadge")}
                                  </span>
                                )}
                              </p>
                              <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                                {tech.job_title || t("ticketDetail.techRole")}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: loadColor.bg, color: loadColor.color }}>
                              {t("ticketDetail.activeTickets", { count: activeCount, plural: activeCount !== 1 ? "s" : "" })}
                            </span>
                            <MdExpandMore style={{ fontSize: 16, color: isSelected ? "#1d4ed8" : "#c4bdb3", transform: isSelected ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {isSelected && (
                          <div style={{ background: "#eff6ff", borderTop: "1px solid #bfdbfe", padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", animation: "fadeIn 0.15s ease" }}>
                            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                              {[
                                { label: t("ticketDetail.techFields.email"),    value: tech.email },
                                { label: t("ticketDetail.techFields.contact"),  value: tech.phone },
                                { label: t("ticketDetail.techFields.office"),   value: tech.office },
                                { label: t("ticketDetail.techFields.workload"), value: null, custom: (
                                  <p style={{ fontSize: 12, fontWeight: 700, color: loadColor.color, margin: 0 }}>
                                    {t("ticketDetail.activeTickets", { count: activeCount, plural: activeCount !== 1 ? "s" : "" })}
                                  </p>
                                )},
                              ].map(({ label, value, custom }) => (
                                <div key={label}>
                                  <p style={{ fontSize: 9, fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>{label}</p>
                                  {custom || <p style={{ fontSize: 12, fontWeight: 600, color: "#1e40af", margin: 0 }}>{value || "—"}</p>}
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={handleAssign}
                              style={{ padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", background: "#1e3a8a", color: "#fff", whiteSpace: "nowrap" }}
                              onMouseEnter={e => e.currentTarget.style.background = "#1e40af"}
                              onMouseLeave={e => e.currentTarget.style.background = "#1e3a8a"}
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

          </div>{/* end right column */}
        </div>{/* end grid */}
      </div>{/* end body */}
    </div>
  );
};

export default TicketDetailPage;