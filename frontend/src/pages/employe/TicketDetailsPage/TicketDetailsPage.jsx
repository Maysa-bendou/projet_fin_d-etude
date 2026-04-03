import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

// ── Style helpers (inchangés) ─────────────────────────────────────────────
function statusCls(s) {
  return {
    in_progress: "bg-yellow-50 text-yellow-800 border border-yellow-200",
    resolved:    "bg-green-50  text-green-800  border border-green-200",
    open:        "bg-blue-50   text-blue-800   border border-blue-200",
    rejected:    "bg-red-50    text-red-800    border border-red-200",
    closed:      "bg-gray-100  text-gray-600   border border-gray-200",
    pending:     "bg-purple-50 text-purple-800 border border-purple-200",
  }[s] ?? "bg-gray-100 text-gray-600 border border-gray-200";
}

function priorityCls(p) {
  return {
    critical: "bg-purple-100 text-purple-800 border border-purple-200",
    high:     "bg-red-100    text-red-800    border border-red-200",
    medium:   "bg-yellow-100 text-yellow-800 border border-yellow-200",
    low:      "bg-green-100  text-green-800  border border-green-200",
  }[p?.toLowerCase()] ?? "bg-gray-100 text-gray-600";
}

const STATUS_FR   = { open:"Ouvert", in_progress:"En cours", pending:"En attente", resolved:"Résolu", closed:"Fermé", rejected:"Rejeté" };
const PRIORITY_FR = { critical:"Critique", high:"Haute", medium:"Normale", low:"Basse" };
const IMPACT_FR   = { high:"Haute", medium:"Moyen", low:"Faible" };
const URGENCY_FR  = { high:"Urgente", medium:"Normale", low:"Faible" };

const TYPE_META = {
  solution:         { label: "Solution du technicien",       dot: "bg-blue-500",   bg: "bg-blue-50   border-blue-200",   text: "text-blue-800"   },
  info:             { label: "Demande d'information",        dot: "bg-amber-500",  bg: "bg-amber-50  border-amber-200",  text: "text-amber-800"  },
  confirm:          { label: "Demande de confirmation",      dot: "bg-green-400",  bg: "bg-green-50  border-green-200",  text: "text-green-800"  },
  emp_reply:        { label: "Votre réponse",                dot: "bg-gray-400",   bg: "bg-gray-50   border-gray-200",   text: "text-gray-700"   },
  confirmed:        { label: "Résolution confirmée",         dot: "bg-green-600",  bg: "bg-green-50  border-green-200",  text: "text-green-800"  },
  rejected_confirm: { label: "Solution refusée",             dot: "bg-red-500",    bg: "bg-red-50    border-red-200",    text: "text-red-800"    },
  redirect:         { label: "Ticket redirigé",              dot: "bg-pink-500",   bg: "bg-pink-50   border-pink-200",   text: "text-pink-800"   },
  comment:          { label: "Note interne",                 dot: "bg-gray-300",   bg: "bg-gray-50   border-gray-100",   text: "text-gray-600"   },
  status:           { label: "Changement de statut",         dot: "bg-purple-400", bg: "bg-purple-50 border-purple-200", text: "text-purple-800" },
};

// ── MetaRow (inchangé) ────────────────────────────────────────────────────
function MetaRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1 py-2 border-b border-gray-50 last:border-0">
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
      <div className="text-sm font-medium text-gray-800">{children}</div>
    </div>
  );
}

// ── Conversation Bubble ───────────────────────────────────────────────────
function ConvBubble({ item }) {
  const isEmployee = ["emp_reply", "confirmed", "rejected_confirm"].includes(item.comment_type);

  return (
    <div className={`flex ${isEmployee ? "justify-end" : "justify-start"} mb-6`}>
      <div className={`max-w-[75%] flex flex-col ${isEmployee ? "items-end" : "items-start"}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
          ${isEmployee 
            ? "bg-indigo-600 text-white rounded-br-sm" 
            : item.comment_type === "solution" 
              ? "bg-blue-50 border border-blue-200 text-gray-800 rounded-bl-sm"
              : item.comment_type === "info"
                ? "bg-amber-50 border border-amber-200 text-gray-800 rounded-bl-sm"
                : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
          }`}>
          <div dangerouslySetInnerHTML={{ __html: item.message }} />
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 px-1">
          {new Date(item.date).toLocaleString("fr-FR", { 
            day:"2-digit", month:"2-digit", year:"numeric", 
            hour:"2-digit", minute:"2-digit" 
          })}
        </p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function TicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [replyMsg, setReplyMsg] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [sendingReply, setSendingReply] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch ticket
  const fetchTicket = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`http://localhost:3001/api/tickets/${id}`);
      if (!res.ok) throw new Error("Ticket non trouvé");
      const data = await res.json();
      setTicket(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTicket(); }, [id]);

  const isClosed = ticket?.status === "closed" || ticket?.status === "resolved";
  const techName = ticket?.technician 
    ? `${ticket.technician.name || ""} ${ticket.technician.surname || ""}`.trim() 
    : "Non assigné";
  const techInitials = techName.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase() || "?";

  const comments = ticket?.comments ?? [];
  const lastSolution = [...comments].reverse().find(c => c.comment_type === "solution");
  const lastInfoRequest = [...comments].reverse().find(c => c.comment_type === "info");
  const lastConfirmReq = [...comments].reverse().find(c => c.comment_type === "confirm");
  const alreadyConfirmed = ticket?.is_resolved_confirmed !== undefined 
    ? ticket.is_resolved_confirmed 
    : comments.some(c => c.comment_type === "confirmed" || c.comment_type === "rejected_confirm");
  const pendingConfirm = !!lastConfirmReq && !alreadyConfirmed && !isClosed;

  // Edit fields
  const [editFields, setEditFields] = useState({ titre:"", description:"", impact:"", urgence:"" });
  useEffect(() => {
    if (ticket) setEditFields({
      titre: ticket.title,
      description: ticket.description,
      impact: ticket.impact,
      urgence: ticket.urgency,
    });
  }, [ticket]);

  const handleFieldChange = (field, value) => {
    setEditFields(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateTicket = async () => {
    setUpdating(true);
    try {
      const payload = {
        title: editFields.titre,
        description: editFields.description,
        impact: editFields.impact,
        urgency: editFields.urgence,
        ...(ticket.status === "closed" && { status: "open" }),
      };
      const res = await fetch(`http://localhost:3001/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour");
      setIsEditing(false);
      fetchTicket();
    } catch (e) { alert(e.message); }
    finally { setUpdating(false); }
  };

  const handleConfirmReply = async (confirmed) => {
    if (!currentUser?.id) return;
    setConfirming(true);
    try {
      const res = await fetch(`http://localhost:3001/api/tickets/${id}/confirm-reply`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: currentUser.id, confirmed }),
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
      const res = await fetch(`http://localhost:3001/api/tickets/${id}/employee-reply`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Erreur serveur");
      setReplyMsg(""); 
      setReplyFiles([]);
      fetchTicket();
    } catch (e) { alert(e.message); }
    finally { setSendingReply(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3">
      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/>
      <span className="text-sm text-gray-400">Chargement du ticket...</span>
    </div>
  );
  if (error) return <div className="text-red-500 text-center py-12">{error}</div>;
  if (!ticket) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white px-4 py-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 hover:text-indigo-600">
              ← Retour
            </button>
            <span>/ Mes Tickets /</span>
            <span className="font-medium text-gray-700">#{id}</span>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {isEditing ? (
                <input
                  className="text-2xl font-bold text-gray-900 border-b-2 border-indigo-500 outline-none bg-transparent min-w-[280px]"
                  value={editFields.titre}
                  onChange={e => handleFieldChange("titre", e.target.value)}
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
              )}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusCls(ticket.status)}`}>
                {STATUS_FR[ticket.status] ?? ticket.status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50">Annuler</button>
                  <button onClick={handleUpdateTicket} disabled={updating} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
                    {updating ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50">
                  {ticket.status === "closed" ? "Réouvrir le ticket" : "Modifier"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ====================== TICKET INFOS (remis en place) ====================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: Technicien + Détails du ticket */}
          <div className="flex flex-col gap-5">

            {/* Technician card */}
            <div className="bg-white rounded-3xl shadow-sm p-5 border border-gray-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4">Technicien assigné</p>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {techInitials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{techName}</p>
                  <p className="text-xs text-gray-500">Technicien IT</p>
                </div>
              </div>
            </div>

            {/* Details card */}
            <div className="bg-white rounded-3xl shadow-sm p-5 border border-gray-200 flex flex-col">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Détails du ticket</p>

              <MetaRow label="Impact">
                {isEditing ? (
                  <select value={editFields.impact} onChange={e => handleFieldChange("impact", e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-full mt-0.5 focus:outline-none focus:border-indigo-400">
                    <option value="low">Faible</option>
                    <option value="medium">Moyen</option>
                    <option value="high">Haute</option>
                  </select>
                ) : IMPACT_FR[ticket.impact] ?? ticket.impact}
              </MetaRow>

              <MetaRow label="Urgence">
                {isEditing ? (
                  <select value={editFields.urgence} onChange={e => handleFieldChange("urgence", e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-full mt-0.5 focus:outline-none focus:border-indigo-400">
                    <option value="low">Faible</option>
                    <option value="medium">Normale</option>
                    <option value="high">Urgente</option>
                  </select>
                ) : URGENCY_FR[ticket.urgency] ?? ticket.urgency}
              </MetaRow>

              <MetaRow label="Priorité (calculée)">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${priorityCls(ticket.priority)}`}>
                  {PRIORITY_FR[ticket.priority] ?? ticket.priority}
                </span>
              </MetaRow>

              <MetaRow label="Catégorie">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                  {ticket.category}
                </span>
              </MetaRow>

              <MetaRow label="Service IT">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  {ticket.service ?? "N/A"}
                </span>
              </MetaRow>

              <MetaRow label="Type">{ticket.type ?? "N/A"}</MetaRow>

              <MetaRow label="Créé le">
                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("fr-DZ") : "N/A"}
              </MetaRow>

              <MetaRow label="Dernière MAJ">
                <span className="text-indigo-600">
                  {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString("fr-FR", { 
                    day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" 
                  }) : "N/A"}
                </span>
              </MetaRow>
            </div>
          </div>

          {/* RIGHT: Description + Historique Horizontal + Conversation */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Description */}
            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Description</p>
              {isEditing ? (
                <textarea rows={4} value={editFields.description}
                  onChange={e => handleFieldChange("description", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 resize-none focus:outline-none focus:border-indigo-400"/>
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed">{ticket.description}</p>
              )}
            </div>

            {/* Historique Horizontal */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Historique du ticket</h3>
              </div>
              <div className="p-6 overflow-x-auto">
                <div className="flex gap-4 pb-4 min-w-max">
                  {comments.length === 0 ? (
                    <p className="text-gray-400 py-8">Aucun historique disponible.</p>
                  ) : (
                    comments.map(c => {
                      const meta = TYPE_META[c.comment_type] ?? TYPE_META.comment;
                      return (
                        <div key={c.id} className={`flex-none w-80 p-5 rounded-2xl border ${meta.bg}`}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                            <span className={`text-xs font-bold uppercase tracking-wide ${meta.text}`}>{meta.label}</span>
                          </div>
                          <div className={`text-sm leading-relaxed ${meta.text}`} 
                            dangerouslySetInnerHTML={{ __html: c.message }} />
                          <p className="text-[10px] text-gray-400 mt-4">
                            {new Date(c.date).toLocaleString("fr-FR")}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Conversation Style */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-6">Échanges avec le technicien</h3>

              <div className="max-h-[460px] overflow-y-auto pr-4 space-y-1 mb-8">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-400 py-12">Aucun échange pour le moment.</p>
                ) : (
                  comments.map((c) => <ConvBubble key={c.id} item={c} />)
                )}
              </div>

              {/* Confirmation Panel */}
              {pendingConfirm && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6">
                  <p className="font-semibold mb-4">Cette solution a-t-elle résolu votre problème ?</p>
                  <div className="flex gap-3">
                    <button onClick={() => handleConfirmReply(true)} disabled={confirming}
                      className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50">
                      ✓ Oui, c’est résolu
                    </button>
                    <button onClick={() => handleConfirmReply(false)} disabled={confirming}
                      className="flex-1 py-3 bg-white border border-red-300 text-red-600 rounded-xl font-bold hover:bg-red-50 disabled:opacity-50">
                      ✗ Non, problème persistant
                    </button>
                  </div>
                </div>
              )}

              {/* Reply to Info Request */}
              {lastInfoRequest && !isClosed && (
                <div className="border border-gray-200 rounded-2xl p-6">
                  <p className="text-xs font-semibold text-gray-500 mb-4">Votre réponse à la demande du technicien</p>
                  <textarea
                    rows={4}
                    value={replyMsg}
                    onChange={e => setReplyMsg(e.target.value)}
                    placeholder="Répondez ici..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-indigo-400"
                  />

                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 text-xs flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-xl hover:border-indigo-400"
                  >
                    📎 Joindre des fichiers
                  </button>
                  <input ref={fileInputRef} type="file" multiple className="hidden" 
                    onChange={e => setReplyFiles(Array.from(e.target.files))} />

                  <button 
                    onClick={handleSendReply}
                    disabled={sendingReply || (!replyMsg.trim() && replyFiles.length === 0)}
                    className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold disabled:opacity-50"
                  >
                    {sendingReply ? "Envoi en cours..." : "Envoyer ma réponse"}
                  </button>
                </div>
              )}

              {isClosed && (
                <p className="text-center text-gray-400 py-8">Ticket fermé — aucune action possible</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}