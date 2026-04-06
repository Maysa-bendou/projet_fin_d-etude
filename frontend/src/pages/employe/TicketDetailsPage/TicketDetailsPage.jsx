import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

/* ─── helpers ─────────────────────────────────────────────────────── */
function statusCls(s) {
  return {
    in_progress: "badge-yellow",
    resolved:    "badge-green",
    open:        "badge-blue",
    rejected:    "badge-red",
    closed:      "badge-gray",
    pending:     "badge-purple",
  }[s] ?? "badge-gray";
}

function priorityCls(p) {
  return {
    critical: "badge-purple",
    high:     "badge-red",
    medium:   "badge-yellow",
    low:      "badge-green",
  }[p?.toLowerCase()] ?? "badge-gray";
}

const STATUS_FR   = { open: "Ouvert", in_progress: "En cours", pending: "En attente", resolved: "Résolu", closed: "Fermé", rejected: "Rejeté" };
const PRIORITY_FR = { critical: "Critique", high: "Haute", medium: "Normale", low: "Basse" };
const IMPACT_FR   = { high: "Haute", medium: "Moyen", low: "Faible" };
const URGENCY_FR  = { high: "Urgente", medium: "Normale", low: "Faible" };

const TYPE_META = {
  solution:         { label: "Solution",            dot: "#378add", bg: "#e6f1fb", border: "#b5d4f4", text: "#0c447c" },
  info:             { label: "Demande d'info",       dot: "#ba7517", bg: "#faeeda", border: "#fac775", text: "#633806" },
  confirm:          { label: "Confirmation demandée",dot: "#639922", bg: "#eaf3de", border: "#c0dd97", text: "#27500a" },
  emp_reply:        { label: "Votre réponse",        dot: "#888780", bg: "var(--color-bg-secondary)", border: "var(--color-border)", text: "var(--color-text-muted)" },
  confirmed:        { label: "Résolution confirmée", dot: "#3b6d11", bg: "#eaf3de", border: "#c0dd97", text: "#27500a" },
  rejected_confirm: { label: "Solution refusée",     dot: "#a32d2d", bg: "#fcebeb", border: "#f7c1c1", text: "#791f1f" },
  redirect:         { label: "Ticket redirigé",      dot: "#993556", bg: "#fbeaf0", border: "#f4c0d1", text: "#4b1528" },
  comment:          { label: "Note interne",         dot: "#b4b2a9", bg: "var(--color-bg-secondary)", border: "var(--color-border)", text: "var(--color-text-muted)" },
  status:           { label: "Changement statut",    dot: "#7f77dd", bg: "#eeedfe", border: "#afa9ec", text: "#26215c" },
};

/* ─── sub-components ──────────────────────────────────────────────── */
function MetaRow({ label, children }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:"0.5px solid var(--color-border)" }}>
      <span style={{ fontSize:12, color:"var(--color-text-muted)" }}>{label}</span>
      <div style={{ fontSize:12, fontWeight:500, color:"var(--color-text)", textAlign:"right" }}>{children}</div>
    </div>
  );
}

function Badge({ cls, children }) {
  const styles = {
    "badge-yellow": { background:"#faeeda", color:"#854f0b", borderColor:"#fac775" },
    "badge-blue":   { background:"#e6f1fb", color:"#185fa5", borderColor:"#b5d4f4" },
    "badge-green":  { background:"#eaf3de", color:"#3b6d11", borderColor:"#c0dd97" },
    "badge-red":    { background:"#fcebeb", color:"#a32d2d", borderColor:"#f7c1c1" },
    "badge-gray":   { background:"var(--color-bg-secondary)", color:"var(--color-text-muted)", borderColor:"var(--color-border)" },
    "badge-purple": { background:"#eeedfe", color:"#3c3489", borderColor:"#afa9ec" },
  };
  const s = styles[cls] ?? styles["badge-gray"];
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:500, border:"0.5px solid", ...s }}>
      {children}
    </span>
  );
}

function FileLinks({ files, isEmployee }) {
  if (!files || files.length === 0) return null;
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:8 }}>
      {files.map((f, i) => (
        <a key={i} href={"http://localhost:3001/" + f.filePath} target="_blank" rel="noopener noreferrer"
          style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, borderRadius:6, padding:"2px 8px",
            background: isEmployee ? "rgba(255,255,255,0.2)" : "var(--color-bg-secondary)",
            color: isEmployee ? "#fff" : "var(--color-text-muted)",
            textDecoration:"none" }}>
          📎 {f.fileName}
        </a>
      ))}
    </div>
  );
}

function ConvBubble({ item }) {
  const isEmployee = ["emp_reply", "confirmed", "rejected_confirm"].includes(item.comment_type);
  const bubbleStyle = isEmployee
    ? { background:"#534ab7", color:"#fff", borderBottomRightRadius:4 }
    : item.comment_type === "solution"
      ? { background:"#e6f1fb", border:"0.5px solid #b5d4f4", color:"#185fa5", borderBottomLeftRadius:4 }
      : item.comment_type === "info"
        ? { background:"#faeeda", border:"0.5px solid #fac775", color:"#854f0b", borderBottomLeftRadius:4 }
        : item.comment_type === "confirm"
          ? { background:"#eaf3de", border:"0.5px solid #c0dd97", color:"#3b6d11", borderBottomLeftRadius:4 }
          : { background:"var(--color-bg-secondary)", border:"0.5px solid var(--color-border)", color:"var(--color-text)", borderBottomLeftRadius:4 };

  return (
    <div style={{ display:"flex", marginBottom:12, justifyContent: isEmployee ? "flex-end" : "flex-start" }}>
      <div style={{ maxWidth:"72%", display:"flex", flexDirection:"column", alignItems: isEmployee ? "flex-end" : "flex-start" }}>
        <div style={{ padding:"10px 14px", borderRadius:16, fontSize:13, lineHeight:1.55, ...bubbleStyle }}>
          <div dangerouslySetInnerHTML={{ __html: item.message }} />
          <FileLinks files={item.files} isEmployee={isEmployee} />
        </div>
        <p style={{ fontSize:10, color:"var(--color-text-muted)", marginTop:4, padding:"0 2px" }}>
          {new Date(item.date).toLocaleString("fr-FR", {
            day:"2-digit", month:"2-digit", year:"numeric",
            hour:"2-digit", minute:"2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

/* ─── main page ───────────────────────────────────────────────────── */
export default function TicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const [ticket, setTicket]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [isEditing, setIsEditing]   = useState(false);
  const [updating, setUpdating]     = useState(false);
  const [replyMsg, setReplyMsg]     = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [sendingReply, setSendingReply] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const fileInputRef = useRef(null);
  const convEndRef   = useRef(null);

  const fetchTicket = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("http://localhost:3001/api/tickets/" + id);
      if (!res.ok) throw new Error("Ticket non trouvé");
      setTicket(await res.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTicket(); }, [id]);

  useEffect(() => {
    convEndRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [ticket?.comments?.length]);

  const [editFields, setEditFields] = useState({ titre:"", description:"", impact:"", urgence:"" });
  useEffect(() => {
    if (ticket) setEditFields({ titre:ticket.title, description:ticket.description, impact:ticket.impact, urgence:ticket.urgency });
  }, [ticket]);

  const isClosed = ticket?.status === "closed" || ticket?.status === "resolved";
  const techName = ticket?.technician
    ? ((ticket.technician.name || "") + " " + (ticket.technician.surname || "")).trim()
    : "Non assigné";
  const techInitials = techName.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase() || "?";

  const comments = ticket?.comments ?? [];
  const lastConfirmReq = [...comments].reverse().find(c => c.comment_type === "confirm");
  const responsesAfterLastConfirm = lastConfirmReq
    ? comments.filter(c => new Date(c.date) > new Date(lastConfirmReq.date) && (c.comment_type === "confirmed" || c.comment_type === "rejected_confirm"))
    : [];
  const alreadyConfirmed = responsesAfterLastConfirm.length > 0;
  const pendingConfirm   = !!lastConfirmReq && !alreadyConfirmed;
  const lastInfoRequest  = [...comments].reverse().find(c => c.comment_type === "info");

  const handleFieldChange = (field, value) => setEditFields(prev => ({ ...prev, [field]: value }));

  const handleUpdateTicket = async () => {
    setUpdating(true);
    try {
      const payload = { title:editFields.titre, description:editFields.description, impact:editFields.impact, urgency:editFields.urgence };
      if (ticket.status === "closed") payload.status = "open";
      const res = await fetch("http://localhost:3001/api/tickets/" + id, {
        method:"PUT", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erreur mise à jour");
      setIsEditing(false); fetchTicket();
    } catch (e) { alert(e.message); }
    finally { setUpdating(false); }
  };

  const handleConfirmReply = async (confirmed) => {
    if (!currentUser?.id || confirming) return;
    setConfirming(true);
    try {
      const res = await fetch("http://localhost:3001/api/tickets/" + id + "/confirm-reply", {
        method:"PUT", headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ employeeId:currentUser.id, confirmed }),
      });
      if (!res.ok) throw new Error();
      fetchTicket();
    } catch { alert("Erreur lors de la réponse."); }
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
      const res = await fetch("http://localhost:3001/api/tickets/" + id + "/employee-reply", { method:"POST", body:fd });
      if (!res.ok) throw new Error("Erreur serveur");
      setReplyMsg(""); setReplyFiles([]); fetchTicket();
    } catch (e) { alert(e.message); }
    finally { setSendingReply(false); }
  };

  /* ── CSS-in-JS tokens ── */
  const css = {
    page:       { minHeight:"100vh", background:"var(--color-bg-page, #f5f4f0)", padding:"24px 20px", "--color-bg-secondary":"#f1efe8", "--color-border":"rgba(0,0,0,0.08)", "--color-text":"#2c2c2a", "--color-text-muted":"#888780" },
    inner:      { maxWidth:960, margin:"0 auto", display:"flex", flexDirection:"column", gap:20 },
    card:       { background:"#fff", borderRadius:14, border:"0.5px solid rgba(0,0,0,0.08)", padding:16 },
    sectionLbl: { fontSize:10, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.08em", color:"#888780", marginBottom:12 },
    btnOutline: { background:"#fff", border:"0.5px solid rgba(0,0,0,0.15)", borderRadius:8, padding:"7px 14px", fontSize:13, fontWeight:500, color:"#2c2c2a", cursor:"pointer" },
    btnPrimary: { background:"#534ab7", border:"none", borderRadius:8, padding:"7px 16px", fontSize:13, fontWeight:500, color:"#fff", cursor:"pointer" },
    btnGreen:   { flex:1, padding:"9px 0", background:"#639922", border:"none", borderRadius:8, color:"#fff", fontSize:13, fontWeight:500, cursor:"pointer" },
    btnReject:  { flex:1, padding:"9px 0", background:"#fff", border:"0.5px solid rgba(163,45,45,0.3)", borderRadius:8, color:"#a32d2d", fontSize:13, fontWeight:500, cursor:"pointer" },
  };

  /* ── loading / error states ── */
  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:240, gap:10 }}>
      <div style={{ width:18, height:18, border:"2px solid #534ab7", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
      <span style={{ fontSize:13, color:"#888780" }}>Chargement du ticket...</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (error)  return <div style={{ color:"#a32d2d", textAlign:"center", padding:48 }}>{error}</div>;
  if (!ticket) return null;

  return (
    <div style={css.page}>
      <div style={css.inner}>

        {/* ── breadcrumb ── */}
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#888780" }}>
          <button onClick={() => navigate(-1)} style={{ background:"none", border:"none", cursor:"pointer", color:"#534ab7", fontSize:12, fontWeight:500, padding:0 }}>← Retour</button>
          <span style={{ opacity:0.4 }}>/</span>
          <span>Mes tickets</span>
          <span style={{ opacity:0.4 }}>/</span>
          <span style={{ color:"#2c2c2a", fontWeight:500 }}>#{id}</span>
        </div>

        {/* ── header ── */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            {isEditing ? (
              <input
                style={{ fontSize:20, fontWeight:500, color:"#2c2c2a", borderBottom:"2px solid #534ab7", border:"none", borderBottom:"2px solid #534ab7", outline:"none", background:"transparent", minWidth:280 }}
                value={editFields.titre}
                onChange={e => handleFieldChange("titre", e.target.value)}
              />
            ) : (
              <h1 style={{ fontSize:20, fontWeight:500, color:"#2c2c2a", margin:0 }}>{ticket.title}</h1>
            )}
            <Badge cls={statusCls(ticket.status)}>{STATUS_FR[ticket.status] ?? ticket.status}</Badge>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} style={css.btnOutline}>Annuler</button>
                <button onClick={handleUpdateTicket} disabled={updating} style={{ ...css.btnPrimary, opacity:updating ? 0.6 : 1 }}>
                  {updating ? "Enregistrement..." : "Enregistrer"}
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} style={css.btnOutline}>
                {ticket.status === "closed" ? "Réouvrir le ticket" : "Modifier"}
              </button>
            )}
          </div>
        </div>

        {/* ── main grid ── */}
        <div style={{ display:"grid", gridTemplateColumns:"240px minmax(0,1fr)", gap:16 }}>

          {/* ── left column ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* technicien */}
            <div style={css.card}>
              <p style={css.sectionLbl}>Technicien assigné</p>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:38, height:38, borderRadius:"50%", background:"#eeedfe", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:500, fontSize:13, color:"#3c3489", flexShrink:0 }}>
                  {techInitials}
                </div>
                <div>
                  <p style={{ fontSize:13, fontWeight:500, color:"#2c2c2a", margin:0 }}>{techName}</p>
                  <p style={{ fontSize:11, color:"#888780", margin:0 }}>Technicien IT</p>
                </div>
              </div>
            </div>

            {/* détails */}
            <div style={css.card}>
              <p style={css.sectionLbl}>Détails</p>
              <div style={{ borderTop:"0.5px solid rgba(0,0,0,0.06)" }}>
                <MetaRow label="Impact">
                  {isEditing ? (
                    <select value={editFields.impact} onChange={e => handleFieldChange("impact", e.target.value)}
                      style={{ border:"0.5px solid rgba(0,0,0,0.15)", borderRadius:6, padding:"3px 6px", fontSize:12, outline:"none", background:"#fff" }}>
                      <option value="low">Faible</option>
                      <option value="medium">Moyen</option>
                      <option value="high">Haute</option>
                    </select>
                  ) : (IMPACT_FR[ticket.impact] ?? ticket.impact)}
                </MetaRow>
                <MetaRow label="Urgence">
                  {isEditing ? (
                    <select value={editFields.urgence} onChange={e => handleFieldChange("urgence", e.target.value)}
                      style={{ border:"0.5px solid rgba(0,0,0,0.15)", borderRadius:6, padding:"3px 6px", fontSize:12, outline:"none", background:"#fff" }}>
                      <option value="low">Faible</option>
                      <option value="medium">Normale</option>
                      <option value="high">Urgente</option>
                    </select>
                  ) : (URGENCY_FR[ticket.urgency] ?? ticket.urgency)}
                </MetaRow>
                <MetaRow label="Priorité"><Badge cls={priorityCls(ticket.priority)}>{PRIORITY_FR[ticket.priority] ?? ticket.priority}</Badge></MetaRow>
                <MetaRow label="Catégorie"><Badge cls="badge-purple">{ticket.category}</Badge></MetaRow>
                <MetaRow label="Service IT"><Badge cls="badge-blue">{ticket.service ?? "N/A"}</Badge></MetaRow>
                <MetaRow label="Type">{ticket.type ?? "N/A"}</MetaRow>
                <MetaRow label="Créé le">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("fr-DZ") : "N/A"}</MetaRow>
                <MetaRow label="Mise à jour">
                  <span style={{ color:"#534ab7" }}>
                    {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "N/A"}
                  </span>
                </MetaRow>
              </div>
            </div>
          </div>

          {/* ── right column ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* description */}
            <div style={css.card}>
              <p style={css.sectionLbl}>Description</p>
              {isEditing ? (
                <textarea rows={4} value={editFields.description}
                  onChange={e => handleFieldChange("description", e.target.value)}
                  style={{ width:"100%", padding:"10px 12px", border:"0.5px solid rgba(0,0,0,0.15)", borderRadius:8, fontSize:13, color:"#2c2c2a", resize:"none", outline:"none", fontFamily:"inherit" }} />
              ) : (
                <p style={{ fontSize:13, color:"#444441", lineHeight:1.65, margin:0 }}>{ticket.description}</p>
              )}
            </div>

            {/* historique */}
            <div style={css.card}>
              <p style={css.sectionLbl}>Historique</p>
              <div style={{ overflowX:"auto", paddingBottom:6 }}>
                <div style={{ display:"flex", gap:10, minWidth:"max-content" }}>
                  {comments.length === 0 ? (
                    <p style={{ fontSize:13, color:"#888780", padding:"12px 0" }}>Aucun historique disponible.</p>
                  ) : (
                    comments.map(c => {
                      const meta = TYPE_META[c.comment_type] ?? TYPE_META.comment;
                      return (
                        <div key={c.id} style={{ flexShrink:0, width:220, padding:"12px 14px", borderRadius:10, background:meta.bg, border:`0.5px solid ${meta.border}` }}>
                          <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:6 }}>
                            <div style={{ width:6, height:6, borderRadius:"50%", background:meta.dot, flexShrink:0 }} />
                            <span style={{ fontSize:10, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.07em", color:meta.text }}>{meta.label}</span>
                          </div>
                          <div style={{ fontSize:12, lineHeight:1.5, color:meta.text }} dangerouslySetInnerHTML={{ __html: c.message }} />
                          <p style={{ fontSize:10, color:"#888780", marginTop:8, marginBottom:0 }}>
                            {new Date(c.date).toLocaleString("fr-FR")}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* conversation */}
            <div style={css.card}>
              <p style={css.sectionLbl}>Échanges avec le technicien</p>

              <div style={{ maxHeight:380, overflowY:"auto", paddingRight:4, marginBottom:16 }}>
                {comments.length === 0 ? (
                  <p style={{ textAlign:"center", color:"#888780", padding:"32px 0", fontSize:13 }}>Aucun échange pour le moment.</p>
                ) : (
                  comments.map(c => <ConvBubble key={c.id} item={c} />)
                )}
                <div ref={convEndRef} />
              </div>

              {/* confirmation pending */}
              {pendingConfirm && (
                <div style={{ background:"#f5f4f0", border:"0.5px solid rgba(0,0,0,0.08)", borderRadius:10, padding:"14px 16px", marginBottom:12 }}>
                  <p style={{ fontSize:13, fontWeight:500, color:"#2c2c2a", marginBottom:10 }}>Cette solution a-t-elle résolu votre problème ?</p>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => handleConfirmReply(true)} disabled={confirming} style={{ ...css.btnGreen, opacity:confirming ? 0.6 : 1 }}>
                      Oui, résolu
                    </button>
                    <button onClick={() => handleConfirmReply(false)} disabled={confirming} style={{ ...css.btnReject, opacity:confirming ? 0.6 : 1 }}>
                      Non, problème persiste
                    </button>
                  </div>
                </div>
              )}

              {alreadyConfirmed && (
                <div style={{ background:"#f1efe8", border:"0.5px solid rgba(0,0,0,0.08)", borderRadius:8, padding:"10px 14px", marginBottom:12, fontSize:13, color:"#888780" }}>
                  Vous avez déjà répondu à la demande de confirmation.
                </div>
              )}

              {/* reply box */}
              {lastInfoRequest && !isClosed && (
                <div style={{ border:"0.5px solid rgba(0,0,0,0.12)", borderRadius:10, overflow:"hidden" }}>
                  <textarea rows={3} value={replyMsg}
                    onChange={e => setReplyMsg(e.target.value)}
                    placeholder="Répondre au technicien..."
                    style={{ width:"100%", padding:"10px 14px", border:"none", outline:"none", fontSize:13, color:"#2c2c2a", fontFamily:"inherit", resize:"none", background:"#fff", lineHeight:1.55 }}
                  />
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", background:"#f5f4f0", borderTop:"0.5px solid rgba(0,0,0,0.06)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        style={{ fontSize:12, color:"#888780", background:"none", border:"none", cursor:"pointer", padding:"4px 8px", borderRadius:6 }}>
                        📎 Joindre
                      </button>
                      {replyFiles.length > 0 && (
                        <span style={{ fontSize:12, color:"#888780" }}>{replyFiles.length} fichier(s)</span>
                      )}
                    </div>
                    <button onClick={handleSendReply}
                      disabled={sendingReply || (!replyMsg.trim() && replyFiles.length === 0)}
                      style={{ ...css.btnPrimary, opacity:(sendingReply || (!replyMsg.trim() && replyFiles.length === 0)) ? 0.5 : 1 }}>
                      {sendingReply ? "Envoi..." : "Envoyer"}
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" multiple style={{ display:"none" }}
                    onChange={e => setReplyFiles(Array.from(e.target.files))} />
                </div>
              )}

              {isClosed && (
                <p style={{ textAlign:"center", color:"#888780", padding:"16px 0", fontSize:13 }}>
                  Ticket fermé — aucune action possible.
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}