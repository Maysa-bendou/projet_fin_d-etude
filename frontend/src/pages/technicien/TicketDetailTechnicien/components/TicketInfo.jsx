import { useState } from "react";
import { Forward, Clock, Lock, Circle, XCircle, CheckCircle } from "lucide-react";
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

function MiniTooltip({ user, children }) {
  const [show, setShow] = useState(false);
  if (!user) return children;
  return (
    <div style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
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
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "6px solid #0f172a",
          }} />
        </div>
      )}
    </div>
  );
}

function getSLAInfo(slaDateLimite, slaDateDebut, statut, closedAt, slaPauseElapsed) {
  if (!slaDateLimite) return null;
  const PAUSED   = ["pending", "pending_supplier"];
  const TERMINAL = ["resolved", "closed", "rejected"];
  const due   = new Date(slaDateLimite).getTime();
  const debut = slaDateDebut ? new Date(slaDateDebut).getTime() : due - 24 * 3600000;
  const win   = due - debut;
  const now   = Date.now();
  if (TERMINAL.includes(statut)) {
    const closed = closedAt ? new Date(closedAt).getTime() : due;
    const exceeded = closed > due;
    const delta = Math.abs(closed - due);
    const used = exceeded ? win + delta : win - (due - closed);
    return { mode: "terminal", exceeded, diffH: Math.floor(delta / 3600000), diffM: Math.floor((delta % 3600000) / 60000), pct: Math.min(100, Math.max(0, (used / win) * 100)), deadline: new Date(slaDateLimite) };
  }
  if (PAUSED.includes(statut)) {
  const frozen  = slaPauseElapsed != null ? slaPauseElapsed : Math.max(0, due - now); // ← remove "win -"
  const elapsed = win - frozen;
  return { mode: "paused", diffH: Math.floor(frozen / 3600000), diffM: Math.floor((frozen % 3600000) / 60000), pct: Math.min(100, Math.max(0, (elapsed / win) * 100)), deadline: new Date(slaDateLimite) };
}
  const remaining = due - now;
  const exceeded  = remaining <= 0;
  const abs = Math.abs(remaining);
  return { mode: "active", exceeded, diffH: Math.floor(abs / 3600000), diffM: Math.floor((abs % 3600000) / 60000), pct: Math.max(0, Math.min(100, (remaining / win) * 100)), deadline: new Date(slaDateLimite) };
}

const S = {
  cardEmp:    { background: "#fff", border: "1px solid #d9d4cc", borderRadius: 16, overflow: "hidden" },
  cardTicket: { background: "#fff", border: "1px solid #d9d4cc", borderRadius: 16, overflow: "visible" },
  label:      { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 },
  cell:       { background: "#faf9f7", border: "1px solid #e8e2d9", borderRadius: 10, padding: "10px 14px" },
  divider:    { borderBottom: "1px solid #e8e2d9" },
};

export default function TicketInfo({ ticket, status, savingStatus, isClosed, handleStatusChange, currentUser }) {
  const { t }       = useTranslation("technicien");
  const { t: tC }   = useTranslation("common");
  const emp = ticket.employee ?? {};
  const ini = `${emp.name?.[0] ?? "?"}${emp.surname?.[0] ?? ""}`.toUpperCase();
const dateLocale = tC("date.locale") || "fr-FR"; // "fr-FR" or "en-US" from common.json
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString(dateLocale, { day: "2-digit", month: "short", year: "numeric" }) : "N/A";
const closedAt = ticket.closedAt ?? ticket.closed_at ?? null;
const sla = getSLAInfo(ticket.sla_date_limite, ticket.sla_date_debut, status, closedAt, ticket.sla_pause_elapsed_ms ?? null);

  const slaColor = !sla ? "#9ca3af"
    : sla.mode === "terminal" ? (sla.exceeded ? "#dc2626" : "#16a34a")
    : sla.mode === "paused"   ? "#7c3aed"
    : sla.exceeded            ? "#dc2626"
    : sla.pct > 50            ? "#16a34a"
    : sla.pct > 20            ? "#d97706"
    : "#f97316";

  const empFields = [
    { icon: MdEmail,       label: "Email",                                      value: emp.email },
    { icon: MdBusiness,    label: t("components.ticketInfo.fields.department"), value: emp.department },
    { icon: MdWork,        label: t("components.ticketInfo.fields.jobTitle"),   value: emp.job_title },
    { icon: MdPhone,       label: t("components.ticketInfo.fields.phone"),      value: emp.phone },
    { icon: MdMeetingRoom, label: t("components.ticketInfo.fields.office"),     value: emp.office },
  ];

  const assignedByNode = (() => {
    if (ticket.assigned_action === "taken") {
      return (
        <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", display: "inline-flex", alignItems: "center", gap: 5 }}>
          <CheckCircle size={13} color="#16a34a" />
          {t("ticketDetail.managedByYou")}
        </span>
      );
    }
    if (["assigned", "updated"].includes(ticket.assigned_action) && ticket.assigned_by_manager) {
      const mgr = ticket.assigned_by_manager;
      return (
        <MiniTooltip user={{ name: mgr.name, surname: mgr.surname, email: mgr.email, department: mgr.department, job_title: mgr.job_title ?? mgr.jobTitle ?? mgr.poste }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", cursor: "default", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <MdSupportAgent style={{ fontSize: 14, color: "#7c3aed" }} />
            {mgr.name} {mgr.surname}
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
            <MdSupportAgent style={{ fontSize: 14, color: "#7c3aed" }} />
            {ticket.assignedBy.label}
          </span>
        </MiniTooltip>
      );
    }
    return <span style={{ color: "#6b7280", fontSize: 12 }}>—</span>;
  })();

console.log("impact raw:", ticket.impact);
console.log("translated:", tC(`impact.${ticket.impact}`));
console.log("all common keys:", tC("impact", { returnObjects: true }));

  const specCells = [
    { icon: MdFlag,         label: t("ticketDetail.cols.priority"),              node: <Pill config={PRIORITY_CONFIG} value={ticket.priority} label={tC(`priority.${ticket.priority}`, { defaultValue: ticket.priority })} /> },
    { icon: MdCategory,     label: t("ticketDetail.cols.category"),              node: <Pill config={CATEGORY_CONFIG} value={ticket.category} label={tC(`category.${ticket.category}`, { defaultValue: ticket.category })} /> },
    { icon: MdSupportAgent, label: t("ticketDetail.cols.service"),               value: ticket.service ?? "N/A" },
    { icon: MdTrendingUp,   label: t("ticketDetail.cols.impact"),              node: <Pill config={IMPACT_CONFIG}  value={ticket.impact}   label={tC(`impact.${ticket.impact}`,   { defaultValue: ticket.impact })} /> },
    { icon: MdFlashOn,      label: t("ticketDetail.cols.urgency"),               node: <Pill config={URGENCY_CONFIG} value={ticket.urgency}  label={tC(`urgency.${ticket.urgency}`, { defaultValue: ticket.urgency })} /> },
    { icon: MdCalendarToday, label: t("components.ticketInfo.fields.createdOn"),  value: fmtDate(ticket.createdAt) },
    { icon: MdCalendarToday, label: t("components.ticketInfo.fields.assignedOn"), value: fmtDate(ticket.assignedAt) },
    { icon: ticket.assigned_action === "taken" ? MdPerson : MdSupportAgent,       label: t("components.ticketInfo.fields.assignedBy"), node: assignedByNode },
    ...(isClosed && closedAt ? [{ icon: XCircle, label: t("components.ticketInfo.fields.closedOn"), value: fmtDate(closedAt) }] : []),
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, alignItems: "stretch" }}>

      {/* ── EMPLOYEE ── */}
      <div style={S.cardEmp}>
        <div style={{ background: "#fff", padding: "20px 20px 16px", textAlign: "center", ...S.divider }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "linear-gradient(135deg,#fce7f3,#fecaca)",
            border: "2px solid #fecaca",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, fontWeight: 800, color: "#9d174d",
            margin: "0 auto 10px",
          }}>
            {ini}
          </div>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
            {emp.name} {emp.surname}
          </h2>
          <span style={{
            fontSize: 10, fontWeight: 700, color: "#9d174d",
            background: "#fce7f3", border: "1px solid #fecaca",
            padding: "3px 10px", borderRadius: 99,
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            {emp.job_title ?? emp.role ?? "N/A"}
          </span>
        </div>
        <div style={{ padding: "4px 0" }}>
          {empFields.map(({ icon: Icon, label, value }, i, arr) => (
            <div key={label} style={{
              display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 18px",
              ...(i < arr.length - 1 ? { borderBottom: "1px solid #f0ebe3" } : {}),
            }}>
              <Icon style={{ fontSize: 14, color: "#94a3b8", marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ ...S.label, marginBottom: 1 }}>{label}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", margin: 0 }}>{value || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* ── END EMPLOYEE ── */}

      {/* ── TICKET ── */}
      <div style={S.cardTicket}>

        <div style={{ padding: "16px 22px", ...S.divider, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div>
            <p style={{ ...S.label, marginBottom: 3 }}>#{ticket.id}</p>
            <h1 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>{ticket.title}</h1>
          </div>
          <Pill config={STATUS_CONFIG} value={status} label={tC(`status.${status}`, { defaultValue: status })} />
        </div>

        {ticket.redirect_note && (
          <div style={{ padding: "14px 22px", ...S.divider }}>
            <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 10, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#7e22ce" }}>
                <Forward size={13} /> {t("components.ticketInfo.redirect.title")}
              </div>
              <p style={{ fontSize: 12, color: "#6b21a8", margin: 0, paddingLeft: 19 }}>
                {ticket.redirectInfo?.reason ?? ticket.redirect_note}
              </p>
              {ticket.redirectInfo && (
                <div style={{ display: "flex", gap: 12, paddingLeft: 19, flexWrap: "wrap" }}>
                  {ticket.redirectInfo.by   && <span style={{ fontSize: 10, color: "#a855f7" }}>{t("components.ticketInfo.redirect.by")} <strong style={{ color: "#7e22ce" }}>{ticket.redirectInfo.by}</strong></span>}
                  {ticket.redirectInfo.from && <span style={{ fontSize: 10, color: "#a855f7" }}>{t("components.ticketInfo.redirect.previousTech")} <strong style={{ color: "#7e22ce" }}>{ticket.redirectInfo.from}</strong></span>}
                  {ticket.redirectInfo.date && <span style={{ fontSize: 10, color: "#a855f7" }}>{new Date(ticket.redirectInfo.date).toLocaleDateString(dateLocale, { day: "2-digit", month: "short" })}</span>}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ padding: "14px 22px", ...S.divider }}>
          <p style={{ ...S.label, marginBottom: 8 }}>{t("ticketDetail.description")}</p>
          <div style={{ background: "#faf9f7", border: "1px solid #e8e2d9", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "#475569", lineHeight: 1.65, fontStyle: "italic" }}>
            {ticket.description ?? t("components.ticketInfo.noDescription")}
          </div>
        </div>

        <div style={{ padding: "14px 22px", ...S.divider }}>
          <p style={{ ...S.label, marginBottom: 10 }}>{t("ticketDetail.info")}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {specCells.map(({ icon: Icon, label, value, node }, i) => (
              <div key={i} style={{ ...S.cell, overflow: "visible", position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                  <Icon style={{ fontSize: 13, color: "#94a3b8" }} />
                  <span style={{ ...S.label }}>{label}</span>
                </div>
                {node ?? <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{value}</span>}
              </div>
            ))}
          </div>
        </div>

        {sla && (
          <div style={{ padding: "12px 22px", ...S.divider }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <MdTimer style={{ fontSize: 14, color: slaColor }} />
                <span style={{ ...S.label }}>SLA</span>
                {sla.mode === "paused"   && <span style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", background: "#ede9fe", padding: "2px 7px", borderRadius: 99 }}>{t("components.ticketInfo.sla.onHold")}</span>}
                {sla.mode === "terminal" && <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "2px 7px", borderRadius: 99 }}>{t("components.ticketInfo.sla.closed")}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 80, background: "#e8e2d9", height: 5, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${Math.round(sla.pct)}%`, background: slaColor, height: "100%", borderRadius: 99, transition: "width 1s ease" }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: slaColor, whiteSpace: "nowrap" }}>
                {(() => {
                  const isFr = tC("date.locale") === "fr-FR";
                  const { diffH: h, diffM: m } = sla;
                  if (sla.mode === "terminal")
                    return sla.exceeded
                      ? (isFr ? `Dépassé de ${h}h ${m}m` : `Exceeded by ${h}h ${m}m`)
                      : (isFr ? "Respecté ✓" : "Respected ✓");
                  if (sla.mode === "paused")
                    return isFr ? `⏸ ${h}h ${m}m figé` : `⏸ ${h}h ${m}m frozen`;
                  return sla.exceeded
                    ? (isFr ? `⚠ Dépassé de ${h}h ${m}m` : `⚠ Exceeded by ${h}h ${m}m`)
                    : (isFr ? `${h}h ${m}m restants`      : `${h}h ${m}m remaining`);
                })()}
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
                {t("components.ticketInfo.sla.deadline")}{" "}
                {sla.deadline.toLocaleDateString(dateLocale, { day: "2-digit", month: "short", year: "numeric" })}
                {" "}{t("components.ticketInfo.sla.at")}{" "}
                {sla.deadline.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        )}

        <div style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ ...S.label, display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={11} /> {t("components.ticketInfo.status.label")}
          </span>
          {isClosed ? (
            <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}>
              <Lock size={12} /> {t("components.ticketInfo.status.locked")}
            </span>
          ) : (
            <select
              value={status}
              onChange={e => handleStatusChange(e.target.value)}
              style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: "1px solid #d9d4cc", background: "#faf9f7", color: "#374151", cursor: "pointer", outline: "none" }}
            >
              {Object.entries(STATUS_KEYS).map(([val]) => (
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

      </div>
      {/* ── END TICKET ── */}

    </div>
  );
}