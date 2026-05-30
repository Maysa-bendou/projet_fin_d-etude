import { useState, useEffect } from "react";
import { Forward, Lock, Circle, XCircle, CheckCircle } from "lucide-react";
import {
  MdTimer, MdFlag, MdCategory, MdSupportAgent, MdFlashOn, MdTrendingUp,
  MdCalendarToday, MdMeetingRoom, MdEmail, MdBusiness, MdWork, MdPhone, MdPerson,
} from "react-icons/md";
import { useTranslation } from "react-i18next";
import Pill from "../../../../components/common/Pill";
import {
  PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_CONFIG, IMPACT_CONFIG, URGENCY_CONFIG,
} from "../../../../config/styles";
import { STATUS_KEYS } from "./constants";
import Actuality from "./Actuality";

// ── Tabler icon helper (matches TicketDetailPage) ──────────────────────────
const Icon = ({ name, size = 15, color = "#b8995a", style = {} }) => (
  <i className={`ti ti-${name}`} style={{ fontSize: size, color, lineHeight: 1, ...style }} aria-hidden="true" />
);

// ── Layout primitives (matches TicketDetailPage) ───────────────────────────
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

const Row = ({ icon, label, value }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 16px", borderBottom: "0.5px solid #f0f0f0" }}>
    <div style={{ marginTop: 1, flexShrink: 0 }}><Icon name={icon} size={14} /></div>
    <div>
      <p style={{ fontSize: 10, fontWeight: 600, color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 1px" }}>{label}</p>
      <p style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a", margin: 0 }}>{value || "—"}</p>
    </div>
  </div>
);

// ── MiniTooltip — kept from original ──────────────────────────────────────
function MiniTooltip({ user, children }) {
  const [show, setShow] = useState(false);
  if (!user) return children;
  return (
    <div style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          background: "#0f172a", color: "#fff", borderRadius: 10, padding: "10px 14px",
          fontSize: 11, whiteSpace: "nowrap", zIndex: 9999, boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          display: "flex", flexDirection: "column", gap: 3, pointerEvents: "none",
        }}>
          <span style={{ fontWeight: 700, fontSize: 12 }}>{user.name} {user.surname}</span>
          {user.email      && <span style={{ color: "#94a3b8" }}>{user.email}</span>}
          {user.department && <span style={{ color: "#94a3b8" }}>{user.department}</span>}
          {user.job_title  && <span style={{ color: "#cbd5e1" }}>{user.job_title}</span>}
          <div style={{
            position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
            borderTop: "6px solid #0f172a",
          }} />
        </div>
      )}
    </div>
  );
}

// ── Working-hours helpers (Sun–Thu, 08:00–16:00) ───────────────────────────
function workingMsBetween(from, to) {
  const WORK_START = 8;
  const WORK_END   = 16;
  const WORK_DAYS  = new Set([0, 1, 2, 3, 4]); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu
  let ms = 0;
  let current = new Date(from);
  const end = new Date(to);
  while (current < end) {
    const day = current.getDay();
    if (WORK_DAYS.has(day)) {
      const dayStart = new Date(current); dayStart.setHours(WORK_START, 0, 0, 0);
      const dayEnd   = new Date(current); dayEnd.setHours(WORK_END,   0, 0, 0);
      const sliceFrom = current < dayStart ? dayStart : current;
      const sliceTo   = end     < dayEnd   ? end      : dayEnd;
      if (sliceTo > sliceFrom) ms += sliceTo.getTime() - sliceFrom.getTime();
    }
    current.setDate(current.getDate() + 1);
    current.setHours(WORK_START, 0, 0, 0);
  }
  return ms;
}

// ── SLA calculation ────────────────────────────────────────────────────────
function getSLAInfo(slaDateLimite, slaDateDebut, statut, closedAt, slaPauseElapsed) {
  if (!slaDateLimite) return null;
  const PAUSED   = ["pending", "pending_supplier"];
  const TERMINAL = ["resolved", "closed ", "rejected"];
  const due   = new Date(slaDateLimite);
  const debut = new Date(slaDateDebut ?? (new Date(slaDateLimite).getTime() - 24 * 3600000));
  const now   = new Date();
  const win   = workingMsBetween(debut, due);
  if (TERMINAL.includes(statut)) {
    const closed   = closedAt ? new Date(closedAt) : due;
    const exceeded = closed > due;
    const delta    = Math.abs(closed.getTime() - due.getTime());
    const used     = workingMsBetween(debut, closed);
    return { mode: "terminal", exceeded, diffH: Math.floor(delta / 3600000), diffM: Math.floor((delta % 3600000) / 60000), pct: Math.min(100, Math.max(0, (used / win) * 100)), deadline: due };
  }
  
  if (PAUSED.includes(statut)) {
    const frozen = slaPauseElapsed != null ? slaPauseElapsed : workingMsBetween(now, due);
    return { mode: "paused", diffH: Math.floor(frozen / 3600000), diffM: Math.floor((frozen % 3600000) / 60000), pct: Math.min(100, Math.max(0, (frozen / win) * 100)), deadline: due };
  }

const remaining = due > now ? workingMsBetween(now, due) : 0;
  const exceeded  = now > due;
  const abs       = exceeded ? workingMsBetween(due, now) : remaining;
  const used      = win - remaining;
  return {
    mode: "active", exceeded,
    diffH: Math.floor(abs / 3600000), diffM: Math.floor((abs % 3600000) / 60000),
    pct: exceeded ? 100 : Math.max(0, Math.min(100, (used / win) * 100)),
    deadline: due,
  };
}
// ── Main ───────────────────────────────────────────────────────────────────
export default function TicketInfo({ ticket, status, savingStatus, isClosed, handleStatusChange, currentUser, actuality }) {
  const { t }     = useTranslation("technicien");
  const { t: tC } = useTranslation("common");

  const [, forceUpdate] = useState(0);
useEffect(() => {
  const timer = setInterval(() => forceUpdate(n => n + 1), 60000);
  return () => clearInterval(timer);
}, []);

  const emp        = ticket.employee ?? {};
  const ini        = `${emp.name?.[0] ?? "?"}${emp.surname?.[0] ?? ""}`.toUpperCase();
  const dateLocale = tC("date.locale") || "fr-FR";
  const fmtDate    = (d) => d ? new Date(d).toLocaleDateString(dateLocale, { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const closedAt   = ticket.closedAt ?? ticket.closed_at ?? null;
  const sla        = getSLAInfo(ticket.sla_date_limite, ticket.sla_date_debut, status, closedAt, ticket.sla_pause_elapsed_ms ?? null);


  console.log("🕐 sla_date_debut reçu:", ticket.sla_date_debut);
console.log("🕐 sla_date_limite reçu:", ticket.sla_date_limite);
console.log("🕐 sla result:", sla);


  const slaColor = !sla ? "#9ca3af"
    : sla.mode === "terminal" ? (sla.exceeded ? "#dc2626" : "#16a34a")
    : sla.mode === "paused"   ? "#7c3aed"
    : sla.exceeded            ? "#dc2626"
    : sla.pct > 50            ? "#16a34a"
    : sla.pct > 20            ? "#d97706"
    : "#f97316";

  // ── assignedBy node — kept from original ────────────────────────────────
  const assignedByNode = (() => {
    if (ticket.assigned_action === "taken") {
      return (
        <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", display: "inline-flex", alignItems: "center", gap: 5 }}>
          <CheckCircle size={13} color="#16a34a" /> {t("ticketDetail.managedByYou")}
        </span>
      );
    }
if (["assigned", "updated"].includes(ticket.assigned_action) && (ticket.assigned_by_manager || ticket.assignedBy?.type === "manager")) {
  const mgr = ticket.assigned_by_manager ?? ticket.assignedBy;
      return (
        <MiniTooltip user={{ name: mgr.name, surname: mgr.surname, email: mgr.email, department: mgr.department, job_title: mgr.job_title ?? mgr.jobTitle ?? mgr.poste }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", cursor: "default", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <MdSupportAgent style={{ fontSize: 14, color: "#7c3aed" }} /> {mgr.name} {mgr.surname}
          </span>
        </MiniTooltip>
      );
    }
    if (ticket.assignedBy?.type === "auto") {
      return <span style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5", fontStyle: "italic" }}>{t("components.ticketInfo.directAssignment")}</span>;
    }
    if (ticket.assignedBy?.label) {
      return (
        <MiniTooltip user={ticket.assignedBy}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", cursor: "default", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <MdSupportAgent style={{ fontSize: 14, color: "#7c3aed" }} /> {ticket.assignedBy.label}
          </span>
        </MiniTooltip>
      );
    }
    return <span style={{ color: "#6b7280", fontSize: 12 }}>—</span>;
  })();

  // ── Initial attachments (from ticket creation) ───────────────────────────
  const attachments = (ticket.ticket_attachments ?? []).filter(a => !a.comment_id);

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" rel="stylesheet" />

    <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 14, alignItems: "start" }}>
     {/* ── RIGHT: Ticket detail ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Title + status */}
          <Card>
            <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 3px" }}>#{ticket.id}</p>
                <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>{ticket.title}</h1>
              </div>
              <Pill config={STATUS_CONFIG} value={status} label={tC(`status.${status}`, { defaultValue: status })} />
            </div>
          </Card>

          {/* Redirect note — kept from original */}
      {ticket.redirect_note && (
  <Card style={{ padding: "14px 20px" }}>
    <SectionLabel>
      <Icon name="corner-up-left" size={11} color="#7e22ce" style={{ marginRight: 5 }} />
      {t("components.ticketInfo.redirect.title")}
    </SectionLabel>
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {ticket.redirectInfo?.by && (
        <div style={{ fontSize: 12, color: "#374151" }}>
          <span style={{ fontWeight: 600, color: "#6b21a8" }}>
            {t("components.ticketInfo.redirect.by")} :{" "}
          </span>
          {ticket.redirectInfo.by}
        </div>
      )}
      {ticket.service && (
        <div style={{ fontSize: 12, color: "#374151" }}>
          <span style={{ fontWeight: 600, color: "#6b21a8" }}>
            {t("ticketDetail.redirect.service")} :{" "}
          </span>
          {ticket.service}
        </div>
      )}
      {ticket.redirectInfo?.redirectedAt && (
        <div style={{ fontSize: 12, color: "#374151" }}>
          <span style={{ fontWeight: 600, color: "#6b21a8" }}>
            {t("ticketDetail.redirect.redirectedAt")} :{" "}
          </span>
          {new Date(ticket.redirectInfo.redirectedAt).toLocaleString(dateLocale)}
        </div>
      )}
      <div style={{
        fontSize: 12,
        color: "#374151",
        borderTop: "0.5px solid #ede9fe",
        paddingTop: 5,
        marginTop: 2
      }}>
        <span style={{ fontWeight: 600, color: "#6b21a8" }}>
          {t("ticketDetail.redirect.reason")} :{" "}
        </span>
        {ticket.redirectInfo?.reason ?? ticket.redirect_note}
      </div>
    </div>
  </Card>
)}
          {/* Description */}
          <Card style={{ padding: "16px 20px" }}>
            <SectionLabel><Icon name="align-left" size={11} style={{ marginRight: 5 }} />{t("ticketDetail.description")}</SectionLabel>
            <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, margin: 0 }}>
              {ticket.description ?? t("components.ticketInfo.noDescription")}
            </p>
          </Card>

          {/* Specs grid */}
          <Card style={{ padding: "16px 20px" }}>
            <SectionLabel><Icon name="layout-grid" size={11} style={{ marginRight: 5 }} />{t("ticketDetail.info")}</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {[
                { icon: "flag-2",      label: t("ticketDetail.cols.priority"),                    node: <Pill config={PRIORITY_CONFIG} value={ticket.priority} label={tC(`priority.${ticket.priority}`, { defaultValue: ticket.priority })} /> },
                { icon: "tag",         label: t("ticketDetail.cols.category"),                    node: <Pill config={CATEGORY_CONFIG} value={ticket.category} label={tC(`category.${ticket.category}`, { defaultValue: ticket.category })} /> },
                { icon: "headset",     label: t("ticketDetail.cols.service"),                     node: <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{ticket.service ?? "—"}</span> },
                { icon: "trending-up", label: t("ticketDetail.cols.impact"),                      node: <Pill config={IMPACT_CONFIG}  value={ticket.impact}   label={tC(`impact.${ticket.impact}`,   { defaultValue: ticket.impact })} /> },
                { icon: "bolt",        label: t("ticketDetail.cols.urgency"),                     node: <Pill config={URGENCY_CONFIG} value={ticket.urgency}  label={tC(`urgency.${ticket.urgency}`, { defaultValue: ticket.urgency })} /> },
                { icon: "calendar",    label: t("components.ticketInfo.fields.createdOn"),        node: <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{fmtDate(ticket.createdAt)}</span> },
                { icon: "calendar-check", label: t("components.ticketInfo.fields.assignedOn"),   node: <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{fmtDate(ticket.assignedAt)}</span> },
                { icon: "user-check",  label: t("components.ticketInfo.fields.assignedBy"),      node: assignedByNode },
                ...(isClosed && closedAt ? [{ icon: "lock", label: t("components.ticketInfo.fields.closedOn"), node: <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{fmtDate(closedAt)}</span> }] : []),
              ].map(({ icon, label, node }, i) => (
                <div key={i} style={{ border: "0.5px solid #ebebeb", borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6, position: "relative", overflow: "visible" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Icon name={icon} size={12} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
                  </div>
                  {node}
                </div>
              ))}
            </div>
          </Card>

          {/* Initial attachments */}
          {attachments.length > 0 && (
            <Card style={{ padding: "14px 20px" }}>
              <SectionLabel><Icon name="paperclip" size={11} style={{ marginRight: 5 }} />{t("ticketDetail.initialAttachments", { defaultValue: "Pièces jointes initiales" })}</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {attachments.map((f, i) => (
                  <a key={i} href={`http://localhost:3001/${f.filePath ?? f.file_path}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "#f8fafc", border: "0.5px solid #e2e8f0", color: "#475569", textDecoration: "none", fontWeight: 500 }}>
                    <Icon name="paperclip" size={10} color="#94a3b8" /> {f.fileName ?? f.file_name}
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* SLA */}
          {sla && (
            <Card style={{ padding: "14px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="clock" size={14} color={slaColor} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.08em" }}>SLA</span>
                  {sla.mode === "paused"   && <span style={{ fontSize: 10, fontWeight: 600, color: "#7c3aed", background: "#ede9fe", padding: "2px 7px", borderRadius: 99 }}>{t("components.ticketInfo.sla.onHold")}</span>}
                  {sla.mode === "terminal" && <span style={{ fontSize: 10, fontWeight: 600, color: "#64748b", background: "#f1f5f9", padding: "2px 7px", borderRadius: 99 }}>{t("components.ticketInfo.sla.closed")}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 80, background: "#ebebeb", height: 4, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${Math.round(sla.pct)}%`, background: slaColor, height: "100%", borderRadius: 99, transition: "width 1s ease" }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: slaColor, whiteSpace: "nowrap" }}>
                  {(() => {
                    const { diffH: h, diffM: m } = sla;
                    if (sla.mode === "terminal") return sla.exceeded ? t("components.ticketInfo.sla.exceededBy", { h, m }) : t("components.ticketInfo.sla.respected");
                    if (sla.mode === "paused")   return t("components.ticketInfo.sla.frozen", { h, m });
                    return sla.exceeded ? t("components.ticketInfo.sla.alertExceeded", { h, m }) : t("components.ticketInfo.sla.remaining", { h, m });
                  })()}
                </span>
                <span style={{ fontSize: 11, color: "#a0a0a0", whiteSpace: "nowrap" }}>
                  {t("components.ticketInfo.sla.deadline")}{" "}
{sla.deadline.toLocaleDateString(dateLocale, { timeZone: "Africa/Algiers", day: "2-digit", month: "short", year: "numeric" })}
{" "}{t("components.ticketInfo.sla.at")}{" "}
{sla.deadline.toLocaleTimeString(dateLocale, { timeZone: "Africa/Algiers", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </Card>
          )}

          {/* Status selector — kept from original */}
          <Card style={{ padding: "14px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Icon name="adjustments-horizontal" size={13} color="#a0a0a0" />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {t("components.ticketInfo.status.label")}
                </span>
              </div>
              {isClosed ? (
                <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}>
                  <Lock size={12} /> {t("components.ticketInfo.status.locked")}
                </span>
              ) : (
                <select
                  value={status}
                  onChange={e => handleStatusChange(e.target.value)}
                  style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: "0.5px solid #e8e8e8", background: "#fafafa", color: "#374151", cursor: "pointer", outline: "none" }}
                >
                  {Object.entries(STATUS_KEYS)
  .filter(([val]) => val !== "closed")
  .map(([val]) => (
    <option key={val} value={val}>{tC(`status.${val}`, { defaultValue: val })}</option>
  ))}
                </select>
              )}
              {savingStatus && (
                <span style={{ fontSize: 10, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
                  <Circle size={8} className="animate-spin" /> {t("components.ticketInfo.status.saving")}
                </span>
              )}
            </div>
          </Card>

        </div>
  {/* ── LEFT: Employee card ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Card>
            <div style={{ padding: "16px 14px 14px", textAlign: "center", borderBottom: "0.5px solid #f0f0f0" }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "#fdf2f8", border: "0.5px solid #fbcfe8",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 700, color: "#9d174d", margin: "0 auto 10px",
              }}>
                {ini}
              </div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
                {emp.name} {emp.surname}
              </h2>
              <span style={{
                fontSize: 10, fontWeight: 600, color: "#9d174d",
                background: "#fdf2f8", border: "0.5px solid #fbcfe8",
                padding: "2px 10px", borderRadius: 99,
                textTransform: "uppercase", letterSpacing: "0.07em",
              }}>
                {emp.job_title ?? emp.role ?? "N/A"}
              </span>
            </div>
            <div>
              <Row icon="mail"        label={t("components.ticketInfo.fields.department").slice(0,1) === "D" ? "Email" : "Email"} value={emp.email} />
              <Row icon="building"    label={t("components.ticketInfo.fields.department")} value={emp.department} />
              <Row icon="briefcase"   label={t("components.ticketInfo.fields.jobTitle")}   value={emp.job_title} />
              <Row icon="phone"       label={t("components.ticketInfo.fields.phone")}      value={emp.phone} />
              <Row icon="map-pin"     label={t("components.ticketInfo.fields.office")}     value={emp.office} />
            </div>
          </Card>
          {/* Actuality */}
          <Actuality actuality={actuality} />
        </div>

     
      </div>
    </>
  );
}