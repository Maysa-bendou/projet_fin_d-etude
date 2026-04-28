import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DOMPurify from "dompurify";
import {
  HiOutlineArrowLeft,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineTag,
  HiOutlinePencilSquare,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlinePaperClip,
  HiOutlinePaperAirplane,
  HiOutlineArrowPath,
  HiOutlineLockClosed,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
  HiOutlineBolt,
  HiOutlineWrenchScrewdriver,
  HiOutlineCalendarDays,
} from "react-icons/hi2";
import Pill from "../../../components/common/Pill";
import { PRIORITY_CONFIG, STATUS_CONFIG, IMPACT_CONFIG, URGENCY_CONFIG, CATEGORY_CONFIG } from "../../../config/styles";

/* ─── helpers ─────────────────────────────────────────────────────── */

const BADGE_STYLES = {
  "badge-yellow": { background:"#fef9ee", color:"#92400e", border:"1px solid #fde68a" },
  "badge-blue":   { background:"#eff6ff", color:"#1d4ed8", border:"1px solid #bfdbfe" },
  "badge-green":  { background:"#f0fdf4", color:"#15803d", border:"1px solid #bbf7d0" },
  "badge-red":    { background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca" },
  "badge-gray":   { background:"#f9fafb", color:"#6b7280", border:"1px solid #e5e7eb" },
  "badge-purple": { background:"#f5f3ff", color:"#6d28d9", border:"1px solid #ddd6fe" },
};

/* ─── sub-components ──────────────────────────────────────────────── */
function Badge({ cls, children }) {
  const s = BADGE_STYLES[cls] ?? BADGE_STYLES["badge-gray"];
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:600, ...s }}>
      {children}
    </span>
  );
}

function MetaRow({ label, icon: Icon, children }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #f1ede8" }}>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        {Icon && <Icon size={12} color="#c4bfb8" />}
        <span style={{ fontSize:12, color:"#94a3b8", fontWeight:500 }}>{label}</span>
      </div>
      <div style={{ fontSize:12, fontWeight:600, color:"#1e293b", textAlign:"right" }}>{children}</div>
    </div>
  );
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

function ConvBubble({ item }) {
  const isEmployee = ["emp_reply","confirmed","rejected_confirm"].includes(item.comment_type);
  const techStyle = {
    solution:  { background:"#eff6ff", border:"1px solid #bfdbfe", color:"#1d4ed8" },
    info:      { background:"#fffbeb", border:"1px solid #fde68a", color:"#92400e" },
    confirm:   { background:"#f0fdf4", border:"1px solid #bbf7d0", color:"#15803d" },
  }[item.comment_type] ?? { background:"#f9fafb", border:"1px solid #e5e7eb", color:"#374151" };

  const bubbleStyle = isEmployee
    ? { background:"#534ab7", color:"#fff", borderBottomRightRadius:4 }
    : { ...techStyle, borderBottomLeftRadius:4 };

  return (
    <div style={{ display:"flex", marginBottom:10, justifyContent: isEmployee ? "flex-end" : "flex-start" }}>
      <div style={{ maxWidth:"75%", display:"flex", flexDirection:"column", alignItems: isEmployee ? "flex-end" : "flex-start" }}>
        <div style={{ padding:"9px 13px", borderRadius:14, fontSize:13, lineHeight:1.55, ...bubbleStyle }}>
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.message) }} />
          <FileLinks files={item.files} dark={isEmployee} />
        </div>
        <p style={{ fontSize:10, color:"#94a3b8", marginTop:3, padding:"0 2px" }}>
          {new Date(item.date).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" })}
        </p>
      </div>
    </div>
  );
}

/* ─── main page ───────────────────────────────────────────────────── */
export default function TicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
 const { t } = useTranslation('employee');
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  // TYPE_META built inside component so t() works
  const TYPE_META = {
    solution:         { label: t('ticketDetails.types.solution'),         dot:"#1d4ed8", bg:"#eff6ff", border:"#bfdbfe", text:"#1d4ed8",   Icon: HiOutlineWrenchScrewdriver },
    info:             { label: t('ticketDetails.types.info'),             dot:"#d97706", bg:"#fffbeb", border:"#fde68a", text:"#92400e",   Icon: HiOutlineInformationCircle },
    confirm:          { label: t('ticketDetails.types.confirm'),          dot:"#15803d", bg:"#f0fdf4", border:"#bbf7d0", text:"#15803d",   Icon: HiOutlineExclamationTriangle },
    emp_reply:        { label: t('ticketDetails.types.emp_reply'),        dot:"#6b7280", bg:"#f9fafb", border:"#e5e7eb", text:"#374151",   Icon: HiOutlineUser },
    confirmed:        { label: t('ticketDetails.types.confirmed'),        dot:"#15803d", bg:"#f0fdf4", border:"#bbf7d0", text:"#15803d",   Icon: HiOutlineCheckCircle },
    rejected_confirm: { label: t('ticketDetails.types.rejected_confirm'), dot:"#dc2626", bg:"#fef2f2", border:"#fecaca", text:"#dc2626",   Icon: HiOutlineXMark },
    redirect:         { label: t('ticketDetails.types.redirect'),         dot:"#9333ea", bg:"#faf5ff", border:"#e9d5ff", text:"#7e22ce",   Icon: HiOutlineArrowPath },
    comment:          { label: t('ticketDetails.types.comment'),          dot:"#9ca3af", bg:"#f9fafb", border:"#e5e7eb", text:"#6b7280",   Icon: HiOutlineInformationCircle },
    status:           { label: t('ticketDetails.types.status'),           dot:"#534ab7", bg:"#f5f3ff", border:"#ddd6fe", text:"#4c1d95",   Icon: HiOutlineBolt },
    update:           { label: t('ticketDetails.types.update'),           dot:"#534ab7", bg:"#f5f3ff", border:"#ddd6fe", text:"#4c1d95",   Icon: HiOutlinePencilSquare },
    reopen:           { label: t('ticketDetails.types.reopen'),           dot:"#15803d", bg:"#f0fdf4", border:"#bbf7d0", text:"#15803d",   Icon: HiOutlineArrowPath },
    attachment:       { label: t('ticketDetails.types.attachment'),       dot:"#0369a1", bg:"#f0f9ff", border:"#bae6fd", text:"#0369a1",   Icon: HiOutlinePaperClip },
  };

  const [ticket, setTicket]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [isEditing, setIsEditing]   = useState(false);
  const [updating, setUpdating]     = useState(false);
  const [replyMsg, setReplyMsg]     = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [sendingReply, setSendingReply] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reopenCount, setReopenCount] = useState(0);

  const fileInputRef = useRef(null);
  const convEndRef   = useRef(null);

  const fetchTicket = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("http://localhost:3001/api/tickets/" + id);
      if (!res.ok) throw new Error(t('ticketDetails.notFound'));
      const data = await res.json();
      setTicket(data);
      const count = (data.comments ?? []).filter(c => c.comment_type === "reopen").length;
      setReopenCount(count);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTicket(); }, [id]);
  useEffect(() => { convEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [ticket?.comments?.length]);

  const [editFields, setEditFields] = useState({ titre:"", description:"", impact:"", urgence:"" });
  useEffect(() => {
    if (ticket) setEditFields({ titre:ticket.title, description:ticket.description, impact:ticket.impact, urgence:ticket.urgency });
  }, [ticket]);

  const techName = ticket?.technician
    ? ((ticket.technician.name||"") + " " + (ticket.technician.surname||"")).trim()
    : t('common.unassigned');
  const techInitials = techName.split(" ").filter(Boolean).map(n=>n[0]).join("").toUpperCase() || "?";

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

  /* loading / error */
  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:280, gap:10, background:"#faf9f7" }}>
      <div style={{ width:18, height:18, border:"2px solid #534ab7", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
      <span style={{ fontSize:13, color:"#94a3b8", fontWeight:500 }}>{t('ticketDetails.loading')}</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (error) return <div style={{ color:"#dc2626", textAlign:"center", padding:48, background: "#faf9f7", minHeight:"100vh" }}>{error}</div>;
  if (!ticket) return null;

  const isClosed   = ticket.status === "closed";
  const closedDate = ticket.closed_at ? new Date(ticket.closed_at) : null;
  const canReopen  = isClosed && closedDate
    && (Date.now() - closedDate.getTime()) <= 30*24*60*60*1000
    && reopenCount < 2;

  /* shared styles */
  const card = { background:"#fff", borderRadius:12, border:"1px solid #d9d4cc", padding:18 };
  const sectionLabel = { fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#94a3b8", marginBottom:14, display:"block" };
  const btnPrimary = { background:"#534ab7", border:"none", borderRadius:8, padding:"7px 16px", fontSize:13, fontWeight:600, color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", gap:6 };
  const btnOutline = { background:"#fff", border:"1px solid #d9d4cc", borderRadius:8, padding:"7px 14px", fontSize:13, fontWeight:500, color:"#1e293b", cursor:"pointer", display:"flex", alignItems:"center", gap:6 };
  const inputStyle = { width:"100%", padding:"8px 12px", border:"1px solid #d9d4cc", borderRadius:8, fontSize:13, color:"#1e293b", outline:"none", fontFamily:"inherit", background:"#fff" };

  return (
    <div style={{ minHeight:"100vh", background:"#faf9f7", padding:"28px 24px" }}>
      <div style={{ maxWidth:1020, margin:"0 auto", display:"flex", flexDirection:"column", gap:20 }}>

        {/* ── breadcrumb ── */}
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#94a3b8" }}>
          <button onClick={() => navigate(-1)} style={{ background:"none", border:"none", cursor:"pointer", color:"#534ab7", fontSize:12, fontWeight:600, padding:0, display:"flex", alignItems:"center", gap:4 }}>
            <HiOutlineArrowLeft size={13} /> {t('common.back')}
          </button>
          <span style={{ opacity:.4 }}>/</span>
          <span>{t('mesTickets.title')}</span>
          <span style={{ opacity:.4 }}>/</span>
          <span style={{ color:"#1e293b", fontWeight:600 }}>#{id}</span>
        </div>

        {/* ── header card ── */}
        <div style={{ ...card, padding:"16px 20px" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", flex:1 }}>
              {isEditing ? (
                <input value={editFields.titre} onChange={e => handleFieldChange("titre", e.target.value)}
                  style={{ ...inputStyle, fontSize:18, fontWeight:700, flex:1, minWidth:220 }} />
              ) : (
                <h1 style={{ fontSize:18, fontWeight:700, color:"#0f172a", margin:0 }}>{ticket.title}</h1>
              )}
              <Pill config={STATUS_CONFIG} value={ticket.status} />
            </div>
            <div style={{ display:"flex", gap:8 }}>
              {isEditing ? (
                <>
                  <button onClick={handleUpdateTicket} disabled={updating} style={{ ...btnPrimary, opacity:updating?.6:1 }}>
                    <HiOutlineCheck size={13}/> {updating ? t('common.saving') : t('common.save')}
                  </button>
                  <button onClick={() => setIsEditing(false)} style={btnOutline}>
                    <HiOutlineXMark size={13}/> {t('common.cancel')}
                  </button>
                </>
              ) : (
                <>
                  {!isClosed && (
                    <button onClick={() => setIsEditing(true)} style={btnOutline}>
                      <HiOutlinePencilSquare size={13}/> {t('common.edit')}
                    </button>
                  )}
                  {canReopen && (
                    <button onClick={handleReopen} style={{ ...btnOutline, color:"#15803d", borderColor:"#bbf7d0" }}>
                      <HiOutlineArrowPath size={13}/> {t('ticketDetails.reopen.button')}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── two-column layout ── */}
        <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:14, alignItems:"start" }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* technician */}
            <div style={card}>
              <span style={sectionLabel}>{t('ticketDetails.assignedTech')}</span>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:"#f5f3ff", border:"1.5px solid #ddd6fe", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13, color:"#6d28d9", flexShrink:0 }}>
                  {techInitials}
                </div>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:"#0f172a", margin:0 }}>{techName}</p>
                  <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>{t('ticketDetails.itTechnician')}</p>
                </div>
              </div>
            </div>

            {/* ── FINAL SOLUTION (closed ticket) ── */}
            {isClosed && ticket.solution && (
              <div style={{ ...card, border:"1px solid #bbf7d0", background:"#f0fdf4" }}>
                <span style={{ ...sectionLabel, color:"#15803d" }}>✓ {t('ticketDetails.solution.title')}</span>
                <div style={{ fontSize:13, color:"#166534", lineHeight:1.7, marginBottom:12 }}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ticket.solution) }} />
                {(() => {
                  const files = (ticket.comments ?? [])
                    .filter(c => ["solution", "comment"].includes(c.comment_type))
                    .flatMap(c => c.files ?? []);
                  return files.length > 0 ? (
                    <div style={{ borderTop:"1px solid #bbf7d0", paddingTop:10 }}>
                      <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#15803d", marginBottom:8 }}>
                        {t('ticketDetails.solution.attachments')}
                      </p>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                        {files.map((f, i) => (
                          <a key={f.id ?? i} href={"http://localhost:3001/" + f.filePath} target="_blank" rel="noopener noreferrer"
                            style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, padding:"3px 10px", borderRadius:6, background:"#dcfce7", color:"#15803d", textDecoration:"none", fontWeight:500 }}>
                            <HiOutlinePaperClip size={10} /> {f.fileName}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
                {ticket.closing_note && (
                  <div style={{ marginTop:10, borderTop:"1px solid #bbf7d0", paddingTop:10 }}>
                    <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#15803d", marginBottom:4 }}>
                      {t('ticketDetails.solution.closingNote')}
                    </p>
                    <p style={{ fontSize:12, color:"#166534", margin:0 }}>{ticket.closing_note}</p>
                  </div>
                )}
              </div>
            )}

            {/* ticket details */}
            <div style={card}>
              <span style={sectionLabel}>{t('ticketDetails.details.title')}</span>
              <div>
                <MetaRow label={t('ticketDetails.details.status')} icon={HiOutlineBolt}>
                  <Pill config={STATUS_CONFIG} value={ticket.status} />
                </MetaRow>
                <MetaRow label={t('ticketDetails.details.priority')} icon={HiOutlineExclamationTriangle}>
                  <Pill config={PRIORITY_CONFIG} value={ticket.priority} />
                </MetaRow>
                <MetaRow label={t('ticketDetails.details.impact')} icon={HiOutlineUser}>
                  {isEditing ? (
                    <select value={editFields.impact} onChange={e => handleFieldChange("impact", e.target.value)}
                      style={{ border:"1px solid #d9d4cc", borderRadius:6, padding:"3px 6px", fontSize:12, outline:"none", background:"#fff" }}>
                      <option value="low">{t('createTicket.impacts.low')}</option>
                      <option value="medium">{t('createTicket.impacts.medium')}</option>
                      <option value="high">{t('createTicket.impacts.high')}</option>
                    </select>
                  ) : <Pill config={IMPACT_CONFIG} value={ticket.impact} />}
                </MetaRow>
                <MetaRow label={t('ticketDetails.details.urgency')} icon={HiOutlineBolt}>
                  {isEditing ? (
                    <select value={editFields.urgence} onChange={e => handleFieldChange("urgence", e.target.value)}
                      style={{ border:"1px solid #d9d4cc", borderRadius:6, padding:"3px 6px", fontSize:12, outline:"none", background:"#fff" }}>
                      <option value="low">{t('createTicket.urgencies.low')}</option>
                      <option value="medium">{t('createTicket.urgencies.medium')}</option>
                      <option value="high">{t('createTicket.urgencies.high')}</option>
                    </select>
                  ) : <Pill config={URGENCY_CONFIG} value={ticket.urgency} />}
                </MetaRow>
                <MetaRow label={t('ticketDetails.details.category')} icon={HiOutlineTag}>
                  <Pill config={CATEGORY_CONFIG} value={ticket.category} />
                </MetaRow>
                <MetaRow label={t('ticketDetails.details.itService')} icon={HiOutlineWrenchScrewdriver}>
                  <Badge cls="badge-blue">{ticket.service ?? "N/A"}</Badge>
                </MetaRow>
                <MetaRow label={t('ticketDetails.details.type')} icon={HiOutlineInformationCircle}>
                  {ticket.type ?? "N/A"}
                </MetaRow>
                <MetaRow label={t('ticketDetails.details.createdAt')} icon={HiOutlineCalendarDays}>
                  {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("fr-DZ") : "N/A"}
                </MetaRow>
                <MetaRow label={t('ticketDetails.details.updatedAt')} icon={HiOutlineClock}>
                  <span style={{ color:"#534ab7", fontWeight:600 }}>
                    {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "N/A"}
                  </span>
                </MetaRow>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* description */}
            <div style={card}>
              <span style={sectionLabel}>{t('ticketDetails.description')}</span>
              {isEditing ? (
                <textarea rows={4} value={editFields.description}
                  onChange={e => handleFieldChange("description", e.target.value)}
                  style={{ ...inputStyle, resize:"vertical", lineHeight:1.6 }} />
              ) : (
                <p style={{ fontSize:13, color:"#475569", lineHeight:1.7, margin:0 }}>{ticket.description}</p>
              )}
            </div>

            {/* ── ACTIVITY HISTORY (vertical timeline) ── */}
            <div style={card}>
              <span style={sectionLabel}>{t('ticketDetails.history.title')}</span>
              {comments.filter(c => c.comment_type !== "attachment").length === 0 ? (
                <p style={{ fontSize:13, color:"#94a3b8", margin:0, padding:"8px 0" }}>{t('ticketDetails.history.empty')}</p>
              ) : (
                <div style={{ position:"relative", paddingLeft:22 }}>
                  <div style={{ position:"absolute", left:7, top:6, bottom:6, width:1.5, background:"#e8e2d9", borderRadius:2 }} />
                  {comments.filter(c => c.comment_type !== "attachment").map((c, i, arr) => {
                    const meta = TYPE_META[c.comment_type] ?? TYPE_META.comment;
                    const Icon = meta.Icon;
                    return (
                      <div key={c.id} style={{ position:"relative", marginBottom: i === arr.length-1 ? 0 : 12 }}>
                        <div style={{
                          position:"absolute", left:-22, top:4,
                          width:16, height:16, borderRadius:"50%",
                          background: meta.bg, border:`1.5px solid ${meta.border}`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                        }}>
                          <Icon size={8} color={meta.dot} />
                        </div>
                        <div style={{ padding:"9px 12px", borderRadius:8, background:meta.bg, border:`1px solid ${meta.border}` }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4, gap:8 }}>
                            <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:meta.text }}>
                              {meta.label}
                            </span>
                            <span style={{ fontSize:10, color:"#94a3b8", whiteSpace:"nowrap" }}>
                              {new Date(c.date).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                            </span>
                          </div>
                          <div style={{ fontSize:12, lineHeight:1.5, color:meta.text }}
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.message) }} />
                          {c.files?.length > 0 && (
                            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:6 }}>
                              {c.files.map((f,fi) => (
                                <a key={fi} href={"http://localhost:3001/"+f.filePath} target="_blank" rel="noopener noreferrer"
                                  style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:10, padding:"2px 7px", borderRadius:5,
                                    background:"rgba(0,0,0,0.05)", color:meta.text, textDecoration:"none", fontWeight:500 }}>
                                  <HiOutlinePaperClip size={9}/> {f.fileName}
                                </a>
                              ))}
                            </div>
                          )}
                          {c.author && <p style={{ fontSize:10, color:"#94a3b8", marginTop:4, marginBottom:0 }}>{t('common.by')} {c.author}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── CONVERSATION ── */}
            <div style={card}>
              <span style={sectionLabel}>{t('ticketDetails.conversation.title')}</span>

              <div style={{ maxHeight:360, overflowY:"auto", paddingRight:2, marginBottom:14 }}>
                {comments.filter(c => !["status","update","reopen","redirect"].includes(c.comment_type)).length === 0 ? (
                  <p style={{ textAlign:"center", color:"#94a3b8", padding:"32px 0", fontSize:13 }}>
                    {t('ticketDetails.conversation.empty')}
                  </p>
                ) : (
                  comments
                    .filter(c => !["status","update","reopen","redirect"].includes(c.comment_type))
                    .map(c => {
                      if (c.comment_type === "attachment") {
                        return (
                          <div key={c.id} style={{ marginBottom:10, padding:"8px 12px", background:"#faf9f7", border:"1px solid #bae6fd", borderRadius:8 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:6 }}>
                              <HiOutlinePaperClip size={12} color="#0369a1" />
                              <span style={{ fontSize:11, fontWeight:600, color:"#0369a1" }}>{t('ticketDetails.initialAttachments')}</span>
                            </div>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                              {(c.files ?? []).map((f,i) => (
                                <a key={i} href={"http://localhost:3001/"+f.filePath} target="_blank" rel="noopener noreferrer"
                                  style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, padding:"3px 9px", borderRadius:6,
                                    background:"#e0f2fe", color:"#0369a1", textDecoration:"none", fontWeight:500 }}>
                                  <HiOutlinePaperClip size={10}/> {f.fileName}
                                </a>
                              ))}
                            </div>
                            <p style={{ fontSize:10, color:"#94a3b8", marginTop:5, marginBottom:0 }}>
                              {new Date(c.date).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                            </p>
                          </div>
                        );
                      }
                      return <ConvBubble key={c.id} item={c} />;
                    })
                )}
                <div ref={convEndRef} />
              </div>

              {/* confirmation banner */}
              {pendingConfirm && (
                <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"14px 16px", marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                    <HiOutlineCheckCircle size={15} color="#15803d" />
                    <p style={{ fontSize:13, fontWeight:600, color:"#15803d", margin:0 }}>{t('ticketDetails.confirm.question')}</p>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => handleConfirmReply(true)} disabled={confirming}
                      style={{ flex:1, padding:"8px 0", background:"#15803d", border:"none", borderRadius:8, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", opacity:confirming?.6:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                      <HiOutlineCheck size={13}/> {t('ticketDetails.confirm.yes')}
                    </button>
                    <button onClick={() => handleConfirmReply(false)} disabled={confirming}
                      style={{ flex:1, padding:"8px 0", background:"#fff", border:"1px solid #fecaca", borderRadius:8, color:"#dc2626", fontSize:13, fontWeight:600, cursor:"pointer", opacity:confirming?.6:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                      <HiOutlineXMark size={13}/> {t('ticketDetails.confirm.no')}
                    </button>
                  </div>
                </div>
              )}

              {alreadyConfirmed && (
                <div style={{ background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, padding:"10px 14px", marginBottom:12, fontSize:12, color:"#6b7280", display:"flex", alignItems:"center", gap:6 }}>
                  <HiOutlineCheckCircle size={13} color="#15803d" /> {t('ticketDetails.confirm.alreadyReplied')}
                </div>
              )}

              {/* reply box */}
              {!isClosed ? (
                <div style={{ border:"1px solid #d9d4cc", borderRadius:10, overflow:"hidden" }}>
                  <textarea rows={3} value={replyMsg} onChange={e => setReplyMsg(e.target.value)}
                    placeholder={t('ticketDetails.conversation.placeholder')}
                    style={{ width:"100%", padding:"10px 14px", border:"none", outline:"none", fontSize:13, color:"#1e293b", fontFamily:"inherit", resize:"none", background:"#fff", lineHeight:1.55, boxSizing:"border-box" }} />
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", background:"#f9f6f2", borderTop:"1px solid #e8e2d9" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        style={{ fontSize:12, color:"#94a3b8", background:"none", border:"none", cursor:"pointer", padding:"4px 8px", borderRadius:6, display:"flex", alignItems:"center", gap:4, fontWeight:500 }}>
                        <HiOutlinePaperClip size={13}/> {t('common.attach')}
                      </button>
                      {replyFiles.length > 0 && (
                        <span style={{ fontSize:11, color:"#94a3b8" }}>
                          {t('common.fileCount', { count: replyFiles.length })}
                        </span>
                      )}
                    </div>
                    <button onClick={handleSendReply} disabled={sendingReply || (!replyMsg.trim() && replyFiles.length===0)}
                      style={{ ...btnPrimary, opacity:(sendingReply || (!replyMsg.trim() && replyFiles.length===0))?.5:1 }}>
                      {sendingReply ? t('common.sending') : <><HiOutlinePaperAirplane size={13}/> {t('common.send')}</>}
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" multiple style={{ display:"none" }} onChange={e => setReplyFiles(Array.from(e.target.files))} />
                </div>
              ) : (
                <div style={{ textAlign:"center", padding:"14px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <HiOutlineLockClosed size={13} color="#94a3b8" />
                  <p style={{ fontSize:13, color:"#94a3b8", margin:0 }}>
                    {canReopen
                      ? t('ticketDetails.reopen.canReopen')
                      : reopenCount >= 2
                        ? t('ticketDetails.reopen.limitMsg')
                        : t('ticketDetails.reopen.expiredMsg')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}