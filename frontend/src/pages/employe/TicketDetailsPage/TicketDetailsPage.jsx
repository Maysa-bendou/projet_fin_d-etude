import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DOMPurify from "dompurify";
import {
  HiOutlineArrowLeft, HiOutlineArrowRight,
  HiOutlineUser, HiOutlineClock, HiOutlineTag,
  HiOutlinePencilSquare, HiOutlineCheck, HiOutlineXMark,
  HiOutlinePaperClip, HiOutlinePaperAirplane, HiOutlineArrowPath,
  HiOutlineLockClosed, HiOutlineExclamationTriangle, HiOutlineCheckCircle,
  HiOutlineInformationCircle, HiOutlineBolt, HiOutlineWrenchScrewdriver,
  HiOutlineCalendarDays,
} from "react-icons/hi2";
import Pill from "../../../components/common/Pill";
import { PRIORITY_CONFIG, STATUS_CONFIG, IMPACT_CONFIG, URGENCY_CONFIG, CATEGORY_CONFIG } from "../../../config/styles";
// ── FIX 1: import shared helpers from ticketKeys ──────────────────────────────
import {
  formatDate,
  translateKey,
  STATUS_KEYS,
  PRIORITY_KEYS,
  CATEGORY_KEYS,
  URGENCY_KEYS,
  IMPACT_KEYS,
} from "../../../constants/ticketKeys";

const BADGE_STYLES = {
  "badge-yellow": { background:"#fef9ee", color:"#92400e", border:"1px solid #fde68a" },
  "badge-blue":   { background:"#eff6ff", color:"#1d4ed8", border:"1px solid #bfdbfe" },
  "badge-green":  { background:"#f0fdf4", color:"#15803d", border:"1px solid #bbf7d0" },
  "badge-red":    { background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca" },
  "badge-gray":   { background:"#f9fafb", color:"#6b7280", border:"1px solid #e5e7eb" },
  "badge-purple": { background:"#f5f3ff", color:"#6d28d9", border:"1px solid #ddd6fe" },
};

function Badge({ cls, children }) {
  const s = BADGE_STYLES[cls] ?? BADGE_STYLES["badge-gray"];
  return <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 8px", borderRadius:99, fontSize:11, fontWeight:600, ...s }}>{children}</span>;
}

function FileLinks({ files, dark }) {
  if (!files?.length) return null;
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:8 }}>
      {files.map((f, i) => (
        <a key={i} href={"http://localhost:3001/" + f.filePath} target="_blank" rel="noopener noreferrer"
          style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, borderRadius:6, padding:"2px 8px",
            background: dark ? "rgba(255,255,255,0.15)" : "#f1ede8",
            color: dark ? "#fff" : "#64748b", textDecoration:"none", fontWeight:500 }}>
          <HiOutlinePaperClip size={10} /> {f.fileName}
        </a>
      ))}
    </div>
  );
}

// ── FIX 2: ConvBubble receives t so it can format dates per language ──────────
function ConvBubble({ item, t, translateLegacyMsg }) {
  const isEmployee = ["emp_reply","confirmed","rejected_confirm"].includes(item.comment_type);
  const techStyle = {
    solution: { background:"#eff6ff", border:"1px solid #bfdbfe", color:"#1d4ed8" },
    info:     { background:"#fffbeb", border:"1px solid #fde68a", color:"#92400e" },
    confirm:  { background:"#f0fdf4", border:"1px solid #bbf7d0", color:"#15803d" },
  }[item.comment_type] ?? { background:"#f9fafb", border:"1px solid #e5e7eb", color:"#374151" };
  const bubbleStyle = isEmployee
    ? { background:"#534ab7", color:"#fff", borderBottomRightRadius:4 }
    : { ...techStyle, borderBottomLeftRadius:4 };
  return (
    <div style={{ display:"flex", marginBottom:10, justifyContent: isEmployee ? "flex-end" : "flex-start" }}>
      <div style={{ maxWidth:"75%", display:"flex", flexDirection:"column", alignItems: isEmployee ? "flex-end" : "flex-start" }}>
        <div style={{ padding:"9px 13px", borderRadius:14, fontSize:13, lineHeight:1.55, ...bubbleStyle }}>
<div>
  {(() => {
    const translated = translateLegacyMsg(item.message ?? "");

    if (translated !== null) {
      return translated;
    }

    return (
      <span
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(item.message),
        }}
      />
    );
  })()}
</div>
          <FileLinks files={item.files} dark={isEmployee} />
        </div>
        {/* FIX: use formatDate with "withTime" so bubble timestamps follow the selected language */}
        <p style={{ fontSize:10, color:"#94a3b8", marginTop:3, padding:"0 2px" }}>
          {formatDate(t, item.date, "withTime")}
        </p>
      </div>
    </div>
  );
}

function MetaItem({ icon: Icon, label, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
        {Icon && <Icon size={11} color="#c4bfb8" />}
        <span style={{ fontSize:10, color:"#94a3b8", fontWeight:500, textTransform:"uppercase", letterSpacing:".04em" }}>{label}</span>
      </div>
      <div style={{ fontSize:12, fontWeight:600, color:"#1e293b" }}>{children}</div>
    </div>
  );
}

export default function TicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  // ── FIX 3: load both namespaces ───────────────────────────────────────────
  const { t, i18n } = useTranslation(["employee", "common"]);
  const currentLang = i18n.language; // triggers re-render on language switch

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  // TYPE_META uses employee namespace keys — no change needed here
  const TYPE_META = {
    solution:         { label: t('ticketDetails.types.solution'),         dot:"#1d4ed8", bg:"#eff6ff", border:"#bfdbfe", text:"#1d4ed8", Icon: HiOutlineWrenchScrewdriver },
    info:             { label: t('ticketDetails.types.info'),             dot:"#d97706", bg:"#fffbeb", border:"#fde68a", text:"#92400e", Icon: HiOutlineInformationCircle },
    confirm:          { label: t('ticketDetails.types.confirm'),          dot:"#15803d", bg:"#f0fdf4", border:"#bbf7d0", text:"#15803d", Icon: HiOutlineExclamationTriangle },
    emp_reply:        { label: t('ticketDetails.types.emp_reply'),        dot:"#6b7280", bg:"#f9fafb", border:"#e5e7eb", text:"#374151", Icon: HiOutlineUser },
    confirmed:        { label: t('ticketDetails.types.confirmed'),        dot:"#15803d", bg:"#f0fdf4", border:"#bbf7d0", text:"#15803d", Icon: HiOutlineCheckCircle },
    rejected_confirm: { label: t('ticketDetails.types.rejected_confirm'), dot:"#dc2626", bg:"#fef2f2", border:"#fecaca", text:"#dc2626", Icon: HiOutlineXMark },
    redirect:         { label: t('ticketDetails.types.redirect'),         dot:"#9333ea", bg:"#faf5ff", border:"#e9d5ff", text:"#7e22ce", Icon: HiOutlineArrowPath },
    comment:          { label: t('ticketDetails.types.comment'),          dot:"#9ca3af", bg:"#f9fafb", border:"#e5e7eb", text:"#6b7280", Icon: HiOutlineInformationCircle },
    status:           { label: t('ticketDetails.types.status'),           dot:"#534ab7", bg:"#f5f3ff", border:"#ddd6fe", text:"#4c1d95", Icon: HiOutlineBolt },
    update:           { label: t('ticketDetails.types.update'),           dot:"#534ab7", bg:"#f5f3ff", border:"#ddd6fe", text:"#4c1d95", Icon: HiOutlinePencilSquare },
    reopen:           { label: t('ticketDetails.types.reopen'),           dot:"#15803d", bg:"#f0fdf4", border:"#bbf7d0", text:"#15803d", Icon: HiOutlineArrowPath },
    attachment:       { label: t('ticketDetails.types.attachment'),       dot:"#0369a1", bg:"#f0f9ff", border:"#bae6fd", text:"#0369a1", Icon: HiOutlinePaperClip },
  };

const translateLegacyMsg = (msg) => {
  if (!msg) return "";

  // Short keys saved by backend
  if (msg === "technician_took_over")   return t("history.technicianTookOver",    { ns: "common" });
  if (msg === "ticket_assigned")        return t("history.ticketAssigned",         { ns: "common" });
  if (msg === "confirmation_requested") return t("history.confirmationRequested",  { ns: "common" });
  if (msg === "history.confirmationRequested") return t("history.confirmationRequested", { ns: "common" });
  if (msg === "ticket_closed")          return t("history.ticketClosed",           { ns: "common" });
  if (msg === "employee_confirmed")     return t("history.employeeConfirmed",      { ns: "common" });
  if (msg === "employee_rejected")      return t("history.employeeRejected",       { ns: "common" });
  if (msg === "employee_reopened")      return t("history.employeeReopened",       { ns: "common" });
if (msg === "ticket_closed")          return t("history.ticketClosed",           { ns: "common" });

if (msg.startsWith("ticket_closed_with_note:")) {
  const note = msg.split(":").slice(1).join(":");
  return t("history.ticketClosedWithNote", { ns: "common", note });
}

if (msg.startsWith("ticket_redirected:")) {
  const parts = msg.split(":");
  return t("history.ticketRedirected", { ns: "common", by: parts[1], reason: parts[2] });
}
  // "status_changed:in_progress" etc.
  if (msg.startsWith("status_changed:")) {
    const statusKey = msg.split(":")[1];
    const translatedStatus = t(`status.${statusKey}`, { ns: "common", defaultValue: statusKey });
    return t("history.statusChanged", { ns: "common", status: translatedStatus });
  }

  // "history.statusChanged:in_progress" (old bad data already in DB)
  if (msg.startsWith("history.statusChanged:")) {
    const statusKey = msg.split(":")[1];
    const translatedStatus = t(`status.${statusKey}`, { ns: "common", defaultValue: statusKey });
    return t("history.statusChanged", { ns: "common", status: translatedStatus });
  }

  // "employee_updated:Titre modifié | Description modifiée"
  if (msg.startsWith("employee_updated:")) {
    const detail = msg.split(":").slice(1).join(":");
    return t("history.employeeUpdated", { ns: "common", detail });
  }

  // Legacy French sentences (old DB data)
  const LEGACY = {
    "Technicien a pris en charge le ticket":                      t("history.technicianTookOver",    { ns: "common" }),
    "Ticket assigné à un technicien":                             t("history.ticketAssigned",         { ns: "common" }),
    "Demande de confirmation de résolution envoyée à l'employé.": t("history.confirmationRequested", { ns: "common" }),
    "Ticket fermé manuellement par le technicien.":               t("history.ticketClosed",           { ns: "common" }),
    "Confirme resolu.":                                           t("history.employeeConfirmed",      { ns: "common" }),
    "Probleme persiste.":                                         t("history.employeeRejected",       { ns: "common" }),
  };
  const norm = (s) => s.replace(/[''`]/g, "'").trim();
  const legacy = Object.entries(LEGACY).find(([k]) => norm(k) === norm(msg));
  if (legacy) return legacy[1];

  // Free-text (user typed) — render as HTML
  return null;
};


  const [ticket, setTicket]             = useState(null);
  const [allIds, setAllIds]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [isEditing, setIsEditing]       = useState(false);
  const [updating, setUpdating]         = useState(false);
  const [replyMsg, setReplyMsg]         = useState("");
  const [replyFiles, setReplyFiles]     = useState([]);
  const [sendingReply, setSendingReply] = useState(false);
  const [confirming, setConfirming]     = useState(false);
  const [reopenCount, setReopenCount]   = useState(0);
  const [editFields, setEditFields]     = useState({ titre:"", description:"", impact:"", urgence:"" });

  const fileInputRef = useRef(null);
  const convEndRef   = useRef(null);

  // ── All fetch/logic functions unchanged ──────────────────────────────────
  const fetchTicket = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("http://localhost:3001/api/tickets/" + id);
      if (!res.ok) throw new Error(t('ticketDetails.notFound'));
      const data = await res.json();
      setTicket(data);
      setReopenCount((data.comments ?? []).filter(c => c.comment_type === "reopen").length);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user?.id) return;
    fetch(`http://localhost:3001/api/tickets/my/${user.id}`)
      .then(r => r.json())
      .then(data => setAllIds((data || []).map(tk => String(tk.id))))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchTicket(); }, [id]);
  useEffect(() => {
    if (ticket) setEditFields({ titre:ticket.title, description:ticket.description, impact:ticket.impact, urgence:ticket.urgency });
  }, [ticket]);

  const currentIdx = allIds.indexOf(String(id));
  const prevId = currentIdx > 0 ? allIds[currentIdx - 1] : null;
  const nextId = currentIdx !== -1 && currentIdx < allIds.length - 1 ? allIds[currentIdx + 1] : null;

  const techName = ticket?.technician
    ? ((ticket.technician.name||"") + " " + (ticket.technician.surname||"")).trim()
    : t('common.unassigned');
  const techInitials = techName.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase() || "?";

  const comments = ticket?.comments ?? [];
  const lastConfirmReq = [...comments].reverse().find(c => c.comment_type === "confirm");
  const responsesAfter = lastConfirmReq
    ? comments.filter(c => new Date(c.date) > new Date(lastConfirmReq.date) && ["confirmed","rejected_confirm"].includes(c.comment_type))
    : [];
  const alreadyConfirmed = responsesAfter.length > 0;
  const pendingConfirm   = !!lastConfirmReq && !alreadyConfirmed;

  const handleFieldChange = (f, v) => setEditFields(p => ({ ...p, [f]:v }));

  const handleReopen = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/tickets/${id}`, {
        method:"PUT", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ status:"open", user_id:currentUser.id, _reopen:true }),
      });
      if (!res.ok) {
        const e = await res.json();
        if (e.error === "Reopen limit reached") throw new Error(t('ticketDetails.reopen.limitReached'));
        if (e.error === "Reopen deadline expired") throw new Error(t('ticketDetails.reopen.deadlineExpired'));
        throw new Error(e.error || t('common.serverError'));
      }
      fetchTicket();
    } catch (e) { alert(e.message); }
  };

  const handleUpdateTicket = async () => {
    setUpdating(true);
    try {
      const res = await fetch("http://localhost:3001/api/tickets/" + id, {
        method:"PUT", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ title:editFields.titre, description:editFields.description, impact:editFields.impact, urgency:editFields.urgence, user_id:currentUser.id }),
      });
      if (!res.ok) throw new Error(t('ticketDetails.updateError'));
      setIsEditing(false); fetchTicket();
    } catch (e) { alert(e.message); }
    finally { setUpdating(false); }
  };

  const handleConfirmReply = async (confirmed) => {
    if (!currentUser?.id || confirming) return;
    setConfirming(true);
    try {
      const res = await fetch(`http://localhost:3001/api/tickets/${id}/confirm-reply`, {
        method:"PUT", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ employeeId:currentUser.id, confirmed }),
      });
      if (!res.ok) throw new Error();
      fetchTicket();
    } catch { alert(t('ticketDetails.confirmError')); }
    finally { setConfirming(false); }
  };

  const handleSendReply = async () => {
    if (!replyMsg.trim() && replyFiles.length === 0) return;
    if (!currentUser?.id) return;
    setSendingReply(true);
    try {
      const fd = new FormData();
      fd.append("employeeId", currentUser.id);
      fd.append("message", replyMsg);
      replyFiles.forEach(f => fd.append("files", f));
      const res = await fetch(`http://localhost:3001/api/tickets/${id}/employee-reply`, { method:"POST", body:fd });
      if (!res.ok) throw new Error(t('common.serverError'));
      setReplyMsg(""); setReplyFiles([]); fetchTicket();
    } catch (e) { alert(e.message); }
    finally { setSendingReply(false); }
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:280, gap:10, background:"#faf9f7" }}>
      <div style={{ width:18, height:18, border:"2px solid #534ab7", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
      <span style={{ fontSize:13, color:"#94a3b8", fontWeight:500 }}>{t('ticketDetails.loading')}</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (error) return <div style={{ color:"#dc2626", textAlign:"center", padding:48, background:"#faf9f7", minHeight:"100vh" }}>{error}</div>;
  if (!ticket) return null;

  const isClosed   = ticket.status === "closed";
  const closedDate = ticket.closed_at ? new Date(ticket.closed_at) : null;
  const canReopen  = isClosed && closedDate
    && (Date.now() - closedDate.getTime()) <= 30*24*60*60*1000
    && reopenCount < 2;

  const card       = { background:"#fff", borderRadius:12, border:"1px solid #e2ddd7" };
  const sLabel     = { fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#94a3b8", marginBottom:10, display:"block" };
  const btnPrimary = { background:"#1e3a8a", border:"none", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:600, color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", gap:5 };
  const btnOutline = { background:"#fff", border:"1px solid #d9d4cc", borderRadius:8, padding:"7px 12px", fontSize:12, fontWeight:500, color:"#1e293b", cursor:"pointer", display:"flex", alignItems:"center", gap:5 };
  const inputStyle = { width:"100%", padding:"8px 12px", border:"1px solid #d9d4cc", borderRadius:8, fontSize:13, color:"#1e293b", outline:"none", fontFamily:"inherit", background:"#fff" };

  // ── FIX 4: replace hardcoded locale dates with language-aware formatDate ──
  const fmtDate = (s) => formatDate(t, s, "short");
  const fmtDT   = (s) => formatDate(t, s, "withTime");

  const historyComments = comments.filter(c => c.comment_type !== "attachment");
  const hasSolution = isClosed && ticket.solution;

  // Employee info fallback
  const emp = ticket.employee ?? {};
  const empName = emp.name ? `${emp.name} ${emp.surname ?? ""}`.trim() : currentUser?.name ?? "—";
  const empInitials = empName.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div style={{ minHeight:"100vh", background:"#faf9f7", fontFamily:"sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── HEADER BAR ── */}
      <div style={{ background:"#faf9f7", borderBottom:"1px solid #e8e2d9", padding:"12px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => navigate(-1)} style={{ background:"none", border:"none", cursor:"pointer", color:"#534ab7", fontSize:12, fontWeight:600, padding:0, display:"flex", alignItems:"center", gap:4 }}>
            <HiOutlineArrowLeft size={13} /> {t('common.back')}
          </button>
          <span style={{ color:"#d1d5db" }}>/</span>
          <span style={{ fontSize:12, color:"#94a3b8" }}>{t('mesTickets.title')}</span>
          <span style={{ color:"#d1d5db" }}>/</span>
          <span style={{ fontSize:12, color:"#1e293b", fontWeight:700 }}>#{id}</span>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {isEditing ? (
            <>
              <button onClick={handleUpdateTicket} disabled={updating} style={{ ...btnPrimary, opacity:updating ? .6 : 1 }}>
                <HiOutlineCheck size={12}/> {updating ? t('common.saving') : t('common.save')}
              </button>
              <button onClick={() => setIsEditing(false)} style={btnOutline}>
                <HiOutlineXMark size={12}/> {t('common.cancel')}
              </button>
            </>
          ) : (
            <>
              {!isClosed && (
                <button onClick={() => setIsEditing(true)} style={btnOutline}>
                  <HiOutlinePencilSquare size={12}/> {t('common.edit')}
                </button>
              )}
              {canReopen && (
                <button onClick={handleReopen} style={{ ...btnOutline, color:"#15803d", borderColor:"#bbf7d0" }}>
                  <HiOutlineArrowPath size={12}/> {t('ticketDetails.reopen.button')}
                </button>
              )}
            </>
          )}
          <div style={{ width:1, height:18, background:"#e8e2d9", margin:"0 2px" }} />
          <button onClick={() => prevId && navigate(`/employee/ticket/${prevId}`)} disabled={!prevId}
            style={{ ...btnOutline, opacity: prevId ? 1 : .35, padding:"5px 10px", fontSize:11 }}>
            <HiOutlineArrowLeft size={12} /> Préc.
          </button>
          <button onClick={() => nextId && navigate(`/employee/ticket/${nextId}`)} disabled={!nextId}
            style={{ ...btnOutline, opacity: nextId ? 1 : .35, padding:"5px 10px", fontSize:11 }}>
            Suiv. <HiOutlineArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* ── BODY : 2-column grid ── */}
      <div style={{ padding:"20px 28px", maxWidth:"100%", margin:"0 auto" }}>
        {/* ── COLONNE DROITE ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* ── TICKET INFO CARD ── */}
          <div style={{ ...card, overflow:"hidden" }}>

            {/* Référence + titre + statut */}
            <div style={{ padding:"14px 18px 12px", borderBottom:"1px solid #f1ede8" }}>
              <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#94a3b8", marginBottom:6 }}>
                {t('ticketDetails.ticketReference') || "TICKET REFERENCE"}
              </div>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
                {isEditing ? (
                  <input value={editFields.titre} onChange={e => handleFieldChange("titre", e.target.value)}
                    style={{ ...inputStyle, fontSize:17, fontWeight:800, flex:1 }} />
                ) : (
                  <h1 style={{ fontSize:17, fontWeight:800, color:"#0f172a", margin:0 }}>#{id} — {ticket.title}</h1>
                )}
                {/* FIX 5: status Pill with translated label */}
                <Pill config={STATUS_CONFIG} value={ticket.status} label={translateKey(t, STATUS_KEYS, ticket.status)} />
              </div>
            </div>

            {/* Description */}
            <div style={{ padding:"12px 18px", borderBottom:"1px solid #f1ede8" }}>
              <span style={sLabel}>{t('ticketDetails.description') || "INCIDENT DESCRIPTION"}</span>
              {isEditing ? (
                <textarea rows={3} value={editFields.description} onChange={e => handleFieldChange("description", e.target.value)}
                  style={{ ...inputStyle, resize:"vertical", lineHeight:1.6 }} />
              ) : (
                <div style={{ background:"#faf9f7", border:"1px solid #f1ede8", borderRadius:8, padding:"12px 14px" }}>
                  <p style={{ fontSize:13, color:"#475569", lineHeight:1.7, margin:0, fontStyle:"italic" }}>{ticket.description}</p>
                </div>
              )}
            </div>

            {/* TICKET INFORMATION — grille 3×2 */}
            <div style={{ padding:"14px 18px", borderBottom:"1px solid #f1ede8" }}>
              <span style={sLabel}>{t('ticketDetails.ticketInformation') || "TICKET INFORMATION"}</span>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>

                <div style={{ border:"1px solid #e8e2d9", borderRadius:10, padding:"10px 14px" }}>
                  <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:"#94a3b8", marginBottom:6, display:"flex", alignItems:"center", gap:4 }}>
                    <HiOutlineBolt size={10}/> {t('ticketDetails.details.priority')}
                  </div>
                  {/* FIX 6: priority Pill with translated label */}
                  <Pill config={PRIORITY_CONFIG} value={ticket.priority} label={translateKey(t, PRIORITY_KEYS, ticket.priority)} />
                </div>

                <div style={{ border:"1px solid #e8e2d9", borderRadius:10, padding:"10px 14px" }}>
                  <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:"#94a3b8", marginBottom:6, display:"flex", alignItems:"center", gap:4 }}>
                    <HiOutlineTag size={10}/> {t('ticketDetails.details.category')}
                  </div>
                  {/* FIX 7: category Pill with translated label */}
                  <Pill config={CATEGORY_CONFIG} value={ticket.category} label={translateKey(t, CATEGORY_KEYS, ticket.category)} />
                </div>

                <div style={{ border:"1px solid #e8e2d9", borderRadius:10, padding:"10px 14px" }}>
                  <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:"#94a3b8", marginBottom:6, display:"flex", alignItems:"center", gap:4 }}>
                    <HiOutlineWrenchScrewdriver size={10}/> {t('ticketDetails.details.itService')}
                  </div>
                  <span style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{ticket.service ?? "N/A"}</span>
                </div>

                <div style={{ border:"1px solid #e8e2d9", borderRadius:10, padding:"10px 14px" }}>
                  <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:"#94a3b8", marginBottom:6, display:"flex", alignItems:"center", gap:4 }}>
                    <HiOutlineExclamationTriangle size={10}/> {t('ticketDetails.details.impact')}
                  </div>
                  {isEditing ? (
                    <select value={editFields.impact} onChange={e => handleFieldChange("impact", e.target.value)}
                      style={{ border:"1px solid #d9d4cc", borderRadius:6, padding:"4px 8px", fontSize:12, outline:"none", background:"#fff" }}>
                      <option value="low">{t('createTicket.impacts.low')}</option>
                      <option value="medium">{t('createTicket.impacts.medium')}</option>
                      <option value="high">{t('createTicket.impacts.high')}</option>
                    </select>
                  ) : (
                    // FIX 8: impact Pill with translated label
                    <Pill config={IMPACT_CONFIG} value={ticket.impact} label={translateKey(t, IMPACT_KEYS, ticket.impact)} />
                  )}
                </div>

                <div style={{ border:"1px solid #e8e2d9", borderRadius:10, padding:"10px 14px" }}>
                  <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:"#94a3b8", marginBottom:6, display:"flex", alignItems:"center", gap:4 }}>
                    <HiOutlineBolt size={10}/> {t('ticketDetails.details.urgency')}
                  </div>
                  {isEditing ? (
                    <select value={editFields.urgence} onChange={e => handleFieldChange("urgence", e.target.value)}
                      style={{ border:"1px solid #d9d4cc", borderRadius:6, padding:"4px 8px", fontSize:12, outline:"none", background:"#fff" }}>
                      <option value="low">{t('createTicket.urgencies.low')}</option>
                      <option value="medium">{t('createTicket.urgencies.medium')}</option>
                      <option value="high">{t('createTicket.urgencies.high')}</option>
                    </select>
                  ) : (
                    // FIX 9: urgency Pill with translated label
                    <Pill config={URGENCY_CONFIG} value={ticket.urgency} label={translateKey(t, URGENCY_KEYS, ticket.urgency)} />
                  )}
                </div>

                <div style={{ border:"1px solid #e8e2d9", borderRadius:10, padding:"10px 14px" }}>
                  <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:"#94a3b8", marginBottom:6, display:"flex", alignItems:"center", gap:4 }}>
                    <HiOutlineCalendarDays size={10}/> {t('ticketDetails.details.createdAt')}
                  </div>
                  {/* FIX 10: date uses language-aware fmtDate */}
                  <span style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{fmtDate(ticket.createdAt)}</span>
                </div>

              </div>
            </div>

            {/* ASSIGNED TECHNICIAN */}
            <div style={{ padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <span style={sLabel}>{t('ticketDetails.assignedTech')}</span>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <HiOutlineUser size={16} color="#534ab7" />
                  <span style={{ fontSize:14, fontWeight:700, color:"#1e293b" }}>{techName}</span>
                </div>
                {ticket.assigned_by && (
                  <div style={{ fontSize:11, color:"#94a3b8", marginTop:4, display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ fontSize:14 }}>🤖</span>
                    {t('ticketDetails.assignedBy') || "Assigné par"}{" "}
                    <strong style={{ color:"#64748b" }}>{ticket.assigned_by}</strong>
                  </div>
                )}
              </div>
        
            </div>
          </div>

          {/* ── ACTIVITY timeline ── */}
          <div style={{ ...card, padding:"14px 18px" }}>
            <span style={sLabel}>{t('ticketDetails.history.title')}</span>
            {historyComments.length === 0 ? (
              <p style={{ fontSize:13, color:"#94a3b8", margin:0 }}>{t('ticketDetails.history.empty')}</p>
            ) : (
              <div style={{ display:"flex", alignItems:"flex-start", overflowX:"auto", paddingBottom:4 }}>
                {historyComments.map((c, i, arr) => {
                  const meta = TYPE_META[c.comment_type] ?? TYPE_META.comment;
                  const Icon = meta.Icon;
                  return (
                    <div key={c.id} style={{ display:"flex", flexDirection:"column", alignItems:"center", flex:"1 0 130px", minWidth:130, position:"relative" }}>
                      {i < arr.length - 1 && (
                        <div style={{ position:"absolute", top:11, left:"50%", width:"100%", height:1.5, background:"#e8e2d9", zIndex:0 }} />
                      )}
                      <div style={{ width:22, height:22, borderRadius:"50%", background:meta.bg, border:`1.5px solid ${meta.border}`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", zIndex:1, flexShrink:0 }}>
                        <Icon size={10} color={meta.dot} />
                      </div>
                      <div style={{ marginTop:7, padding:"7px 9px", borderRadius:8, background:meta.bg, border:`1px solid ${meta.border}`, width:"calc(100% - 14px)", fontSize:11, textAlign:"center" }}>
                        <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:".05em", color:meta.text, marginBottom:2 }}>{meta.label}</div>
<div style={{ fontSize:11, lineHeight:1.4, color:meta.text, opacity:.9 }}>
  {(() => {
    const translated = translateLegacyMsg(c.message ?? "");
    if (translated !== null) return translated;
    return <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.message) }} />;
  })()}
</div>
                        {c.files?.length > 0 && (
                          <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:3, marginTop:4 }}>
                            {c.files.map((f, fi) => (
                              <a key={fi} href={"http://localhost:3001/"+f.filePath} target="_blank" rel="noopener noreferrer"
                                style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:10, padding:"2px 6px", borderRadius:5, background:"rgba(0,0,0,0.06)", color:meta.text, textDecoration:"none", fontWeight:500 }}>
                                <HiOutlinePaperClip size={9}/> {f.fileName}
                              </a>
                            ))}
                          </div>
                        )}
                        {/* FIX 11: timeline timestamps use language-aware fmtDT */}
                        <p style={{ fontSize:10, color:"#94a3b8", marginTop:3, marginBottom:0 }}>
                          {fmtDT(c.date)}
                        </p>
                        {c.author && <p style={{ fontSize:10, color:"#94a3b8", marginTop:1, marginBottom:0 }}>{t('common.by')} {c.author}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── CONVERSATION + SOLUTION ── */}
          <div style={{ display:"grid", gridTemplateColumns: hasSolution ? "1fr 320px" : "1fr", gap:14, alignItems:"start" }}>

            <div style={{ ...card, padding:"14px 18px" }}>
              <span style={sLabel}>{t('ticketDetails.conversation.title')}</span>
              <div style={{ maxHeight:340, overflowY:"auto", paddingRight:2, marginBottom:12 }}>
                {comments.filter(c => !["status","update","reopen","redirect"].includes(c.comment_type)).length === 0 ? (
                  <p style={{ textAlign:"center", color:"#94a3b8", padding:"28px 0", fontSize:13 }}>{t('ticketDetails.conversation.empty')}</p>
                ) : (
                  comments.filter(c => !["status","update","reopen","redirect"].includes(c.comment_type)).map(c => {
                    if (c.comment_type === "attachment") {
                      return (
                        <div key={c.id} style={{ marginBottom:10, padding:"8px 12px", background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:8 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:6 }}>
                            <HiOutlinePaperClip size={12} color="#0369a1" />
                            <span style={{ fontSize:11, fontWeight:600, color:"#0369a1" }}>{t('ticketDetails.initialAttachments')}</span>
                          </div>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                            {(c.files ?? []).map((f, i) => (
                              <a key={i} href={"http://localhost:3001/"+f.filePath} target="_blank" rel="noopener noreferrer"
                                style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, padding:"3px 9px", borderRadius:6, background:"#e0f2fe", color:"#0369a1", textDecoration:"none", fontWeight:500 }}>
                                <HiOutlinePaperClip size={10}/> {f.fileName}
                              </a>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    // FIX 12: pass t to ConvBubble for language-aware timestamps
                    return (
  <ConvBubble
    key={c.id}
    item={c}
    t={t}
    translateLegacyMsg={translateLegacyMsg}
  />
);
                  })
                )}
                <div ref={convEndRef} />
              </div>

              {pendingConfirm && (
                <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"12px 14px", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                    <HiOutlineCheckCircle size={14} color="#15803d" />
                    <p style={{ fontSize:13, fontWeight:600, color:"#15803d", margin:0 }}>{t('ticketDetails.confirm.question')}</p>
                  </div>
                  <div style={{ display:"flex", gap:7 }}>
                    <button onClick={() => handleConfirmReply(true)} disabled={confirming}
                      style={{ flex:1, padding:"7px 0", background:"#15803d", border:"none", borderRadius:8, color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", opacity:confirming ? .6 : 1, display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                      <HiOutlineCheck size={12}/> {t('ticketDetails.confirm.yes')}
                    </button>
                    <button onClick={() => handleConfirmReply(false)} disabled={confirming}
                      style={{ flex:1, padding:"7px 0", background:"#fff", border:"1px solid #fecaca", borderRadius:8, color:"#dc2626", fontSize:12, fontWeight:600, cursor:"pointer", opacity:confirming ? .6 : 1, display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                      <HiOutlineXMark size={12}/> {t('ticketDetails.confirm.no')}
                    </button>
                  </div>
                </div>
              )}

              {alreadyConfirmed && (
                <div style={{ background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, padding:"9px 12px", marginBottom:10, fontSize:12, color:"#6b7280", display:"flex", alignItems:"center", gap:6 }}>
                  <HiOutlineCheckCircle size={13} color="#15803d" /> {t('ticketDetails.confirm.alreadyReplied')}
                </div>
              )}

               {!isClosed ? (
                <div style={{ border:"1px solid #d9d4cc", borderRadius:10, overflow:"hidden" }}>
                  <textarea rows={3} value={replyMsg} onChange={e => setReplyMsg(e.target.value)}
                    placeholder={t('ticketDetails.conversation.placeholder')}
                    style={{ width:"100%", padding:"10px 14px", border:"none", outline:"none", fontSize:13, color:"#1e293b", fontFamily:"inherit", resize:"none", background:"#fff", lineHeight:1.55, boxSizing:"border-box" }} />
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 10px", background:"#faf9f7", borderTop:"1px solid #e8e2d9" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        style={{ fontSize:12, color:"#94a3b8", background:"none", border:"none", cursor:"pointer", padding:"4px 8px", borderRadius:6, display:"flex", alignItems:"center", gap:4, fontWeight:500 }}>
                        <HiOutlinePaperClip size={13}/> {t('common.attach')}
                      </button>
                      {replyFiles.length > 0 && <span style={{ fontSize:11, color:"#94a3b8" }}>{t('common.fileCount', { count: replyFiles.length })}</span>}
                    </div>
                    <button onClick={handleSendReply} disabled={sendingReply || (!replyMsg.trim() && replyFiles.length===0)}
                      style={{ ...btnPrimary, opacity:(sendingReply || (!replyMsg.trim() && replyFiles.length===0)) ? .5 : 1 }}>
                      {sendingReply ? t('common.sending') : <><HiOutlinePaperAirplane size={12}/> {t('common.send')}</>}
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" multiple style={{ display:"none" }} onChange={e => setReplyFiles(Array.from(e.target.files))} />
                </div>
              ) : (
                <div style={{ textAlign:"center", padding:"12px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <HiOutlineLockClosed size={13} color="#94a3b8" />
                  <p style={{ fontSize:13, color:"#94a3b8", margin:0 }}>
                    {canReopen ? t('ticketDetails.reopen.canReopen') : reopenCount >= 2 ? t('ticketDetails.reopen.limitMsg') : t('ticketDetails.reopen.expiredMsg')}
                  </p>
                </div>
              )}
            </div>

            {hasSolution && (
              <div style={{ ...card, border:"1px solid #bbf7d0", background:"#f0fdf4", padding:"14px 16px" }}>
                <span style={{ ...sLabel, color:"#15803d" }}>✓ {t('ticketDetails.solution.title')}</span>
                <div style={{ fontSize:13, color:"#166534", lineHeight:1.7, marginBottom:10 }}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ticket.solution) }} />
                {(() => {
                  const files = (ticket.comments ?? []).filter(c => ["solution","comment"].includes(c.comment_type)).flatMap(c => c.files ?? []);
                  return files.length > 0 ? (
                    <div style={{ borderTop:"1px solid #bbf7d0", paddingTop:8, marginTop:8 }}>
                      <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#15803d", marginBottom:6 }}>{t('ticketDetails.solution.attachments')}</p>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {files.map((f, i) => (
                          <a key={f.id ?? i} href={"http://localhost:3001/" + f.filePath} target="_blank" rel="noopener noreferrer"
                            style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, padding:"3px 9px", borderRadius:6, background:"#dcfce7", color:"#15803d", textDecoration:"none", fontWeight:500 }}>
                            <HiOutlinePaperClip size={10} /> {f.fileName}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
                {ticket.closing_note && (
                  <div style={{ marginTop:8, borderTop:"1px solid #bbf7d0", paddingTop:8 }}>
                    <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#15803d", marginBottom:4 }}>{t('ticketDetails.solution.closingNote')}</p>
                    <p style={{ fontSize:12, color:"#166534", margin:0 }}>{ticket.closing_note}</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
