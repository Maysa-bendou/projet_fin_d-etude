import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Tag, AlertTriangle, Layers,
  User, Mail, Building2, Briefcase, Phone, DoorOpen, Calendar, Clock,
  CheckCircle2, Circle, Send, Paperclip, X, Bold, Italic, Underline,
  Strikethrough, List, ListOrdered, RotateCcw, Forward, MessageSquare,
  Activity, Info, Hash, FileText, ShieldCheck, Lock,
} from "lucide-react";

// ── Maps ───────────────────────────────────────────────────────────────────
const PRIORITY_CLASS = {
  high:     "bg-red-100 text-red-700 border border-red-200",
  critical: "bg-red-200 text-red-800 border border-red-300",
  medium:   "bg-amber-100 text-amber-700 border border-amber-200",
  low:      "bg-green-100 text-green-700 border border-green-200",
};
const PRIORITY_FR = { high:"Haute", critical:"Critique", medium:"Normale", low:"Basse" };
const IMPACT_FR   = { high:"Haute", medium:"Moyen", low:"Faible" };
const URGENCY_FR  = { high:"Urgente", medium:"Normale", low:"Faible" };
const CATEGORY_FR = { hardware:"Hardware", software:"Logiciels", network:"Réseau", access:"Accès", security:"Sécurité", account:"Compte" };
const TYPE_FR     = { incident:"Incident", service_request:"Demande de service", change:"Changement", problem:"Problème" };
const STATUS_CLASS = {
  open:"bg-blue-100 text-blue-700 border border-blue-200",
  in_progress:"bg-amber-100 text-amber-700 border border-amber-200",
  pending:"bg-purple-100 text-purple-700 border border-purple-200",
  pending_supplier:"bg-orange-100 text-orange-700 border border-orange-200",
  resolved:"bg-green-100 text-green-700 border border-green-200",
  closed:"bg-gray-200 text-gray-600 border border-gray-300",
  rejected:"bg-red-100 text-red-700 border border-red-200",
};
const STATUS_FR = {
  open:"Ouvert", in_progress:"En cours", pending:"En attente",
  pending_supplier:"Att. fournisseur", resolved:"Résolu", closed:"Fermé", rejected:"Rejeté",
};
const CATEGORIES_EN = ["hardware","software","network","access","security","account"];
const API = "http://localhost:3001/api/tech";

// ── SLA ────────────────────────────────────────────────────────────────────
function getSLAInfo(createdAt, priority, slaDueDate) {
  const deadline = slaDueDate
    ? new Date(slaDueDate)
    : (() => {
        const h = { high:4, critical:2, medium:24, low:72 }[priority] ?? 24;
        return new Date(new Date(createdAt).getTime() + h * 3600000);
      })();
  const ms = deadline - new Date();
  const h  = { high:4, critical:2, medium:24, low:72 }[priority] ?? 24;
  return {
    deadline, hours: h,
    diffH:   Math.floor(Math.abs(ms) / 3600000),
    diffM:   Math.floor((Math.abs(ms) % 3600000) / 60000),
    pct:     Math.max(0, Math.min(100, (ms / (h * 3600000)) * 100)),
    expired: ms < 0,
  };
}

// ── UserTooltip ────────────────────────────────────────────────────────────
function UserTooltip({ user, children }) {
  const [show, setShow] = useState(false);
  if (!user) return children;
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-56 bg-gray-900 text-white rounded-xl shadow-xl p-3 text-[11px]">
          <p className="font-bold text-[13px] mb-1">{user.name} {user.surname}</p>
          {user.email && <p className="flex items-center gap-1.5 text-gray-300 mt-0.5"><Mail size={10}/>{user.email}</p>}
          {user.phone && <p className="flex items-center gap-1.5 text-gray-300 mt-0.5"><Phone size={10}/>{user.phone}</p>}
          {user.role && <p className="flex items-center gap-1.5 text-gray-400 mt-0.5 capitalize"><User size={10}/>{user.role}</p>}
          <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"/>
        </div>
      )}
    </div>
  );
}

// ── RichTextArea ───────────────────────────────────────────────────────────
function RichTextArea({ onChange, placeholder, rows = 6, disabled = false, clearSignal }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) { ref.current.innerHTML = ""; onChange(""); }
  }, [clearSignal]);
  const exec = (cmd) => { ref.current?.focus(); document.execCommand(cmd, false, null); onChange(ref.current?.innerHTML || ""); };
  const tools = [
    { Icon:Bold, cmd:"bold" }, { Icon:Italic, cmd:"italic" },
    { Icon:Underline, cmd:"underline" }, { Icon:Strikethrough, cmd:"strikeThrough" },
    { divider:true },
    { Icon:List, cmd:"insertUnorderedList" }, { Icon:ListOrdered, cmd:"insertOrderedList" },
    { divider:true }, { Icon:RotateCcw, cmd:"removeFormat" },
  ];
  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden bg-white ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-100 flex-wrap">
        {tools.map((t, i) => t.divider
          ? <div key={i} className="w-px h-4 bg-gray-300 mx-1"/>
          : <button key={i} type="button" onMouseDown={e => { e.preventDefault(); exec(t.cmd); }}
              className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-200 transition text-gray-600 bg-transparent border-none cursor-pointer">
              <t.Icon size={13}/>
            </button>
        )}
      </div>
      <div ref={ref} contentEditable={!disabled} suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML || "")}
        data-placeholder={placeholder}
        className="px-3 py-2.5 text-[13px] text-gray-800 outline-none leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
        style={{ minHeight:`${rows * 22}px` }}/>
    </div>
  );
}

// ── FileAttachment ─────────────────────────────────────────────────────────
function FileAttachment({ files, onAdd, onRemove, disabled = false }) {
  const ref = useRef(null);
  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
      <button type="button" onClick={() => ref.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition bg-transparent cursor-pointer">
        <Paperclip size={12}/> Joindre un fichier
      </button>
      <input ref={ref} type="file" multiple className="hidden" onChange={e => onAdd(Array.from(e.target.files))}/>
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1 text-[11px] text-gray-700">
              <Paperclip size={10} className="text-gray-400"/>
              <span className="max-w-[120px] truncate">{f.name}</span>
              <button type="button" onClick={() => onRemove(i)} className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer"><X size={11}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ManualCloseModal ───────────────────────────────────────────────────────
function ManualCloseModal({ onConfirm, onCancel, loading }) {
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <Lock size={20} className="text-gray-600"/>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Fermer le ticket manuellement</p>
            <p className="text-[12px] text-gray-500 mt-0.5">Utilisez cette option si vous avez résolu le problème par téléphone ou en personne.</p>
          </div>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">Note de fermeture (obligatoire)</label>
          <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
            placeholder="Ex : Résolu par téléphone à 11h30 — problème confirmé résolu par l'employé."
            className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 resize-none focus:outline-none focus:border-gray-400 leading-relaxed"/>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} disabled={loading}
            className="px-4 py-2 text-[12px] font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 bg-transparent cursor-pointer transition">Annuler</button>
          <button onClick={() => onConfirm(note)} disabled={loading || !note.trim()}
            className="px-4 py-2 text-[12px] font-semibold rounded-lg bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50 cursor-pointer transition flex items-center gap-2">
            <Lock size={13}/>{loading ? "Fermeture..." : "Fermer le ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Conversation bubble ────────────────────────────────────────────────────
function ConvBubble({ item, currentUser, empInitials, empName }) {
  const isMine   = item.authorId === currentUser?.id;
  const isSystem = item.type === "status";

  const typeTag = {
    solution: { label:"Solution",              cls: isMine ? "bg-blue-100 text-blue-700"   : "bg-blue-100 text-blue-700"   },
    info:     { label:"Demande d'info",         cls: isMine ? "bg-amber-100 text-amber-700" : "bg-amber-100 text-amber-700" },
    redirect: { label:"Redirigé",              cls:"bg-pink-100 text-pink-700"  },
    confirm:  { label:"Confirmation envoyée",  cls:"bg-green-100 text-green-700"},
    emp_reply:{ label:"Réponse employé",       cls:"bg-gray-100 text-gray-600"  },
    confirmed:{ label:"Résolution confirmée",  cls:"bg-green-100 text-green-700"},
    rejected_confirm:{ label:"Solution refusée", cls:"bg-red-100 text-red-700" },
  }[item.type];

  // System pill (status change)
  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="text-[11px] text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-4 py-1"
          dangerouslySetInnerHTML={{ __html: item.message }}/>
      </div>
    );
  }

  // Confirmation card (tech sent to employee)
  if (item.type === "confirm") {
    return (
      <div className="flex flex-col items-end mb-4">
        <div className="flex items-end gap-2 flex-row-reverse">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            {`${currentUser?.name?.[0] ?? "T"}${currentUser?.surname?.[0] ?? ""}`}
          </div>
          <div className="max-w-[78%]">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 inline-block bg-green-100 text-green-700">Confirmation envoyée</span>
            <div className="bg-green-50 border border-green-200 rounded-2xl rounded-tr-sm px-4 py-3">
              <p className="text-[12px] text-gray-700 mb-2">Le problème de l'employé est-il résolu ?</p>
              <div className="flex gap-2">
                <span className="flex-1 text-center text-[11px] font-medium border border-green-300 text-green-700 rounded-lg py-1 bg-white">✓ Oui, résolu</span>
                <span className="flex-1 text-center text-[11px] font-medium border border-red-200 text-red-600 rounded-lg py-1 bg-white">✗ Non, toujours un problème</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 mr-9">Vous · {item.date}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col mb-4 ${isMine ? "items-end" : "items-start"}`}>
      <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
        <div className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
          isMine ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
        }`}>
          {isMine ? `${currentUser?.name?.[0] ?? "T"}${currentUser?.surname?.[0] ?? ""}` : empInitials}
        </div>
        <div className={`max-w-[75%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
          {typeTag && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${typeTag.cls}`}>{typeTag.label}</span>
          )}
          <div className={`rounded-2xl px-4 py-2.5 text-[12px] leading-relaxed shadow-sm ${
            isMine
              ? item.type === "info"
                ? "bg-amber-50 border border-amber-200 text-amber-900 rounded-tr-sm"
                : "bg-blue-600 text-white rounded-tr-sm"
              : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
          }`}>
            <div dangerouslySetInnerHTML={{ __html: item.message }}/>
            {item.files?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.files.map((f, i) => (
                  <span key={i} className={`flex items-center gap-1 text-[10px] rounded px-2 py-0.5 ${isMine ? "bg-blue-500 text-blue-100" : "bg-gray-100 text-gray-500"}`}>
                    <Paperclip size={9}/>{f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <p className={`text-[10px] text-gray-400 mt-1 ${isMine ? "mr-9" : "ml-9"}`}>
        {isMine ? "Vous" : empName} · {item.date}
      </p>
    </div>
  );
}

// ── ActualityDot ───────────────────────────────────────────────────────────
const ACT_DOT = {
  assigned:"bg-blue-400", solution:"bg-blue-500", info:"bg-amber-500",
  redirect:"bg-pink-500", confirm:"bg-green-500", emp_reply:"bg-gray-400",
  confirmed:"bg-green-600", rejected_confirm:"bg-red-500", status:"bg-purple-500",
  comment:"bg-gray-300",
};
const ACT_LABEL = {
  assigned:         "Ticket assigné",
  solution:         "Solution envoyée, confirmation en attente",
  info:             "Demande d'info envoyée à l'employé",
  redirect:         "Ticket redirigé",
  confirm:          "Demande de confirmation envoyée",
  emp_reply:        "Réponse de l'employé",
  confirmed:        "Résolution confirmée par l'employé",
  rejected_confirm: "L'employé a refusé la solution",
  comment:          "Note ajoutée",
};

// ── MAIN ───────────────────────────────────────────────────────────────────
export default function TicketDetailTechnicien() {
  const navigate    = useNavigate();
  const { id }      = useParams();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const [ticket,            setTicket]           = useState(null);
  const [allIds,            setAllIds]           = useState([]);
  const [loading,           setLoading]          = useState(true);
  const [error,             setError]            = useState(null);
  const [status,            setStatus]           = useState("");
  const [savingStatus,      setSavingStatus]     = useState(false);
  const [activeTab,         setActiveTab]        = useState("respond");
  const [respondMode,       setRespondMode]      = useState("solution");
  const [solution,          setSolution]         = useState("");
  const [infoMsg,           setInfoMsg]          = useState("");
  const [solutionFiles,     setSolutionFiles]    = useState([]);
  const [infoFiles,         setInfoFiles]        = useState([]);
  const [sending,           setSending]          = useState(false);
  const [sentError,         setSentError]        = useState(null);
  const [clearSignal,       setClearSignal]      = useState(0);
  const [conversation,      setConversation]     = useState([]);
  const [actuality,         setActuality]        = useState([]);
  const [services,          setServices]         = useState([]);
  const [techniciens,       setTechniciens]      = useState([]);
  const [redirectTechId,    setRedirectTechId]   = useState("");
  const [redirectServiceId, setRedirectServiceId]= useState("");
  const [redirectCategory,  setRedirectCategory] = useState("");
  const [redirectNote,      setRedirectNote]     = useState("");
  const [redirecting,       setRedirecting]      = useState(false);
  const [showManualClose,   setShowManualClose]  = useState(false);
  const [closingManually,   setClosingManually]  = useState(false);
  // true when a solution+confirmation is pending employee reply
  const [awaitingConfirm,   setAwaitingConfirm]  = useState(false);

  const convEndRef = useRef(null);
  const isClosed = status === "closed";

  const fmt = (d) => new Date(d).toLocaleTimeString("fr-DZ", { hour:"2-digit", minute:"2-digit" });

  const addActEntry = (type, message, date = new Date()) => ({
    id: `act-${Date.now()}-${Math.random()}`,
    type, message,
    date: fmt(date),
    rawDate: new Date(date),
  });

  // ── Fetch ticket ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const res  = await fetch(`${API}/tickets/${id}`);
        if (!res.ok) throw new Error("Ticket introuvable");
        const data = await res.json();
        setTicket(data);
        setStatus(data.status);
        setAwaitingConfirm(!!data.confirmation_requested && !data.is_resolved_confirmed);

        const convItems = [];
        const actItems  = [];

        // First actuality item: ticket assigned
        actItems.push({
          id:"act-assigned", type:"assigned",
          message: "Ticket assigné",
          date: fmt(data.createdAt),
          rawDate: new Date(data.createdAt),
        });

        data.comments.forEach((c) => {
          const type     = c.comment_type ?? "comment";
          const dateObj  = new Date(c.date);
          const dateStr  = fmt(c.date);
          const authorId = c.authorId;

          // All non-status go to conversation thread
          convItems.push({
            id:       c.id,
            type,
            authorId,
            author:   c.author,
            isMe:     authorId === currentUser?.id,
            message:  c.message.replace(/^\[REDIRECTION\]\s*/, ""),
            files:    [],
            date:     dateStr,
          });

          // Build actuality based on type
          if (type === "status") {
            actItems.push({ id:`act-${c.id}`, type:"status", message: c.message, date: dateStr, rawDate: dateObj });
          } else if (ACT_LABEL[type]) {
            actItems.push({ id:`act-${c.id}`, type, message: ACT_LABEL[type], date: dateStr, rawDate: dateObj });
          }
        });

        actItems.sort((a, b) => a.rawDate - b.rawDate);
        setConversation(convItems);
        setActuality(actItems);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [id]);

  // Auto-scroll conversation
  useEffect(() => {
    convEndRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [conversation]);

  // ── Fetch assigned ticket ids for prev/next ───────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) return;
    (async () => {
      try {
        const res = await fetch(`${API}/assigned/${currentUser.id}`);
        if (!res.ok) return;
        setAllIds((await res.json()).map((t) => t.id));
      } catch (_) {}
    })();
  }, []);

  // ── Fetch services + techniciens for redirect tab ─────────────────────────
  useEffect(() => {
    if (activeTab !== "redirect") return;
    (async () => {
      const [sRes, tRes] = await Promise.all([fetch(`${API}/services`), fetch(`${API}/techniciens`)]);
      setServices(await sRes.json());
      setTechniciens(await tRes.json());
    })();
  }, [activeTab]);

  const idx    = allIds.indexOf(Number(id));
  const prevId = idx > 0 ? allIds[idx - 1] : null;
  const nextId = idx < allIds.length - 1 ? allIds[idx + 1] : null;

  // ── Navigate to another ticket (same route pattern) ───────────────────────
  // Adjust the route path to match your actual router configuration
  const goToTicket = (tid) => {
    // detect current route pattern and replicate it for the new id
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(/\/\d+$/, `/${tid}`);
    navigate(newPath);
  };

  // ── Status change — also saved as comment so it shows on refresh ──────────
  const handleStatusChange = async (newStatus) => {
    const old = status;
    setStatus(newStatus);
    setSavingStatus(true);
    try {
      const res = await fetch(`${API}/tickets/${id}/status`, {
        method:"PUT", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ status: newStatus, technicianId: currentUser?.id }),
      });
      if (!res.ok) throw new Error();
      const now = new Date();
      const msg = `Statut modifié : <strong>${STATUS_FR[old]}</strong> → <strong>${STATUS_FR[newStatus]}</strong>`;
      // Add to conversation as system pill
      setConversation(p => [...p, {
        id: Date.now(), type:"status",
        authorId: currentUser?.id, isMe: true,
        author: `${currentUser?.name ?? "Tech"} ${currentUser?.surname ?? ""}`.trim(),
        message: msg, files:[], date: fmt(now),
      }]);
      // Add to actuality
      setActuality(p => [...p, { id:`act-s-${Date.now()}`, type:"status", message: msg, date: fmt(now), rawDate: now }]);
    } catch { setStatus(old); }
    finally { setSavingStatus(false); }
  };

  // ── Send solution or info request ─────────────────────────────────────────
  const handleSend = async () => {
    const msg   = respondMode === "solution" ? solution : infoMsg;
    const files = respondMode === "solution" ? solutionFiles : infoFiles;
    if (!msg.replace(/<[^>]*>/g,"").trim() && files.length === 0) return;
    setSending(true); setSentError(null);
    try {
      const fd = new FormData();
      fd.append("message",      msg);
      fd.append("technicianId", currentUser?.id);
      fd.append("type",         respondMode);
      files.forEach(f => fd.append("files", f));

      const res = await fetch(`${API}/tickets/${id}/send`, { method:"POST", body:fd });
      if (!res.ok) throw new Error("Erreur serveur");

      const now    = new Date();
      const author = `${currentUser?.name ?? "Tech"} ${currentUser?.surname ?? ""}`.trim();

      // Add message to conversation
      setConversation(p => [...p, {
        id: Date.now(), type: respondMode,
        authorId: currentUser?.id, isMe: true,
        author, message: msg,
        files: files.map(f => f.name),
        date: fmt(now),
      }]);

      if (respondMode === "solution") {
        // Add solution actuality
        setActuality(p => [...p, addActEntry("solution", ACT_LABEL.solution, now)]);
        // Automatically request confirmation from employee
        await doRequestConfirm(now);
        setSolution(""); setSolutionFiles([]);
      } else {
        setActuality(p => [...p, addActEntry("info", ACT_LABEL.info, now)]);
        setInfoMsg(""); setInfoFiles([]);
      }

      setClearSignal(s => s + 1);
    } catch (e) { setSentError(e.message); }
    finally { setSending(false); }
  };

  // ── Auto-request confirmation (called right after solution send) ──────────
  const doRequestConfirm = async (now = new Date()) => {
    try {
      const res = await fetch(`${API}/tickets/${id}/request-confirm`, {
        method:"PUT", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ technicianId: currentUser?.id }),
      });
      if (!res.ok) return;
      setTicket(p => ({ ...p, confirmation_requested: true }));
      setAwaitingConfirm(true);
      const author = `${currentUser?.name ?? "Tech"} ${currentUser?.surname ?? ""}`.trim();
      // Show confirmation card in conversation
      setConversation(p => [...p, {
        id: Date.now() + 1, type:"confirm",
        authorId: currentUser?.id, isMe: true,
        author, message:"Demande de confirmation de résolution envoyée à l'employé.",
        files:[], date: fmt(now),
      }]);
      setActuality(p => [...p, addActEntry("confirm", ACT_LABEL.confirm, now)]);
    } catch (_) {}
  };

  // ── Manual close ──────────────────────────────────────────────────────────
  const handleManualClose = async (closingNote) => {
    setClosingManually(true);
    try {
      const res = await fetch(`${API}/tickets/${id}/close-manual`, {
        method:"PUT", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ technicianId: currentUser?.id, closingNote }),
      });
      if (!res.ok) throw new Error();
      const now    = new Date();
      const author = `${currentUser?.name ?? "Tech"} ${currentUser?.surname ?? ""}`.trim();
      setStatus("closed");
      setTicket(p => ({ ...p, closing_note: closingNote }));
      setConversation(p => [...p, {
        id: Date.now(), type:"comment", authorId: currentUser?.id, isMe: true,
        author, message:`Ticket fermé manuellement. Note : ${closingNote}`,
        files:[], date: fmt(now),
      }]);
      setActuality(p => [...p, addActEntry("status", "Ticket fermé manuellement", now)]);
      setShowManualClose(false);
    } catch { alert("Erreur lors de la fermeture."); }
    finally { setClosingManually(false); }
  };

  // ── Redirect ──────────────────────────────────────────────────────────────
  const handleRedirect = async () => {
    if (!redirectTechId && !redirectServiceId) return;
    setRedirecting(true);
    try {
      const res = await fetch(`${API}/tickets/${id}/redirect`, {
        method:"PUT", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          newTechId:    redirectTechId    || null,
          newServiceId: redirectServiceId || null,
          newCategory:  redirectCategory  || null,
          note:         redirectNote,
          assignedById: currentUser?.id,
        }),
      });
      if (!res.ok) throw new Error();
      const tech = techniciens.find(t => t.id === parseInt(redirectTechId));
      const svc  = services.find(s => s.id === parseInt(redirectServiceId));
      let msg = `Redirigé vers <strong>${tech ? `${tech.name} ${tech.surname}` : "N/A"}</strong>`;
      if (svc) msg += ` / service <strong>${svc.name}</strong>`;
      if (redirectCategory) msg += ` / catégorie <strong>${CATEGORY_FR[redirectCategory]}</strong>`;
      if (redirectNote) msg += `<br/><em>Raison : ${redirectNote}</em>`;
      const now    = new Date();
      const author = `${currentUser?.name ?? "Tech"} ${currentUser?.surname ?? ""}`.trim();
      setConversation(p => [...p, {
        id: Date.now(), type:"redirect", authorId: currentUser?.id, isMe: true,
        author, message: msg, files:[], date: fmt(now),
      }]);
      setActuality(p => [...p, addActEntry("redirect", ACT_LABEL.redirect, now)]);
      setRedirectTechId(""); setRedirectServiceId(""); setRedirectCategory(""); setRedirectNote("");
    } finally { setRedirecting(false); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
        <p className="text-sm text-gray-500">Chargement du ticket...</p>
      </div>
    </div>
  );
  if (error)   return <div className="p-6 text-red-500 flex items-center gap-2"><AlertTriangle size={16}/>Erreur : {error}</div>;
  if (!ticket) return <div className="p-6 text-gray-400">Ticket introuvable.</div>;

  const emp     = ticket.employee ?? {};
  const ini     = `${emp.name?.[0] ?? "?"}${emp.surname?.[0] ?? ""}`;
  const empName = `${emp.name ?? ""} ${emp.surname ?? ""}`.trim();
  const sla     = ticket.createdAt ? getSLAInfo(ticket.createdAt, ticket.priority, ticket.sla_due_date) : null;
  const solutionBlocked = !isClosed && awaitingConfirm && !ticket?.is_resolved_confirmed;

  return (
    <div className="min-h-screen bg-gray-50 p-5">
      {showManualClose && (
        <ManualCloseModal loading={closingManually} onConfirm={handleManualClose} onCancel={() => setShowManualClose(false)}/>
      )}

      <div className="max-w-7xl mx-auto flex flex-col gap-5">

        {/* ── Breadcrumb + Prev/Next ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => navigate("/technician/tickets-assignes")}
              className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition bg-transparent border-none cursor-pointer p-0 font-medium">
              <ArrowLeft size={15}/> Tickets Assignés
            </button>
            <ChevronRight size={13} className="text-gray-300"/>
            <span className="text-gray-800 font-semibold truncate max-w-xs sm:max-w-md">T n°{ticket.id} — {ticket.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button disabled={!prevId} onClick={() => goToTicket(prevId)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
              <ChevronLeft size={13}/> Précédent
            </button>
            {idx >= 0 && <span className="text-xs text-gray-400 font-mono">{idx+1}/{allIds.length}</span>}
            <button disabled={!nextId} onClick={() => goToTicket(nextId)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
              Suivant <ChevronRight size={13}/>
            </button>
          </div>
        </div>

        {/* ══ TOP ROW: Employee info + Ticket info (ORIGINAL, UNCHANGED) ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">

          {/* Employee card */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <User size={12}/> Informations Employé
            </h2>
            <UserTooltip user={emp}>
              <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 cursor-default">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white text-base font-bold flex items-center justify-center shrink-0 shadow-sm">{ini}</div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{emp.name} {emp.surname}</p>
                  <p className="text-[11px] text-blue-600 font-medium mt-0.5">{emp.job_title ?? emp.role ?? "N/A"}</p>
                </div>
              </div>
            </UserTooltip>
            <div className="flex flex-col gap-0.5">
              {[
                { Icon:Hash,      label:"ID",             value:emp.id },
                { Icon:Mail,      label:"Email",          value:emp.email },
                { Icon:Building2, label:"Département",    value:emp.department },
                { Icon:Briefcase, label:"Titre du poste", value:emp.job_title },
                { Icon:Phone,     label:"Numéro",         value:emp.phone },
                { Icon:Building2, label:"Block",          value:emp.block_number || emp.block || "N/A" },
                { Icon:DoorOpen,  label:"Bureau",         value:emp.office },
              ].map(f => (
                <div key={f.label} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    <f.Icon size={12} className="text-gray-400"/>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{f.label}</p>
                    <p className="text-[12px] text-gray-800 font-medium mt-0.5">{f.value ?? "N/A"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket card */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 font-mono mb-0.5">#{ticket.id}</p>
                <h1 className="text-base font-bold text-gray-900 leading-snug">{ticket.title}</h1>
              </div>
              <span className={`text-[11px] font-semibold px-3 py-1 rounded-full shrink-0 ${STATUS_CLASS[status] ?? "bg-gray-100 text-gray-600"}`}>
                {STATUS_FR[status] ?? status}
              </span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Description</p>
              <p className="text-[13px] text-gray-700 leading-relaxed">{ticket.description ?? "Aucune description."}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { Icon:AlertTriangle, label:"Priorité", custom: ticket.priority
                    ? <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${PRIORITY_CLASS[ticket.priority] ?? "bg-gray-100"}`}>{PRIORITY_FR[ticket.priority] ?? ticket.priority}</span>
                    : null },
                { Icon:Tag,          label:"Catégorie",   value: CATEGORY_FR[ticket.category] ?? ticket.category },
                { Icon:Layers,       label:"Service",     value: ticket.service ?? "N/A" },
                { Icon:AlertTriangle,label:"Impact",      value: IMPACT_FR[ticket.impact] ?? ticket.impact ?? "N/A" },
                { Icon:AlertTriangle,label:"Urgence",     value: URGENCY_FR[ticket.urgency] ?? ticket.urgency ?? "N/A" },
                { Icon:FileText,     label:"Type",        value: TYPE_FR[ticket.type] ?? ticket.type ?? "Incident" },
                { Icon:User, label:"Assigné par", custom: ticket.assignedBy
                    ? ticket.assignedBy.type === "auto"
                      ? <span className="text-[12px] font-semibold text-gray-500 italic">Auto / Système</span>
                      : <UserTooltip user={ticket.assignedBy}>
                          <span className="text-[12px] font-semibold text-blue-700 cursor-default underline decoration-dotted">{ticket.assignedBy.label}</span>
                        </UserTooltip>
                    : null },
                { Icon:Calendar, label:"Créé le", value: ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("fr-DZ") : "N/A" },
              ].map(f => (
                <div key={f.label} className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <f.Icon size={10} className="text-gray-400"/>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{f.label}</p>
                  </div>
                  {f.custom ? f.custom : <p className="text-[12px] font-semibold text-gray-800">{f.value}</p>}
                </div>
              ))}
            </div>

            {/* SLA */}
            {sla && (
              <div className="rounded-xl p-3 border bg-gray-50 border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className={sla.expired ? "text-red-500" : "text-gray-500"}/>
                    <p className="text-[11px] font-bold text-gray-700">SLA</p>
                  </div>
                  <span className={`text-[11px] font-bold ${sla.expired ? "text-red-600" : sla.pct > 50 ? "text-emerald-700" : sla.pct > 20 ? "text-amber-600" : "text-red-600"}`}>
                    {sla.expired ? `⚠ Dépassé de ${sla.diffH}h ${sla.diffM}m` : `${sla.diffH}h ${sla.diffM}m restants`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1.5">
                  <div className={`h-1.5 rounded-full transition-all ${sla.expired ? "bg-red-500" : sla.pct > 50 ? "bg-emerald-500" : sla.pct > 20 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: sla.expired ? "100%" : `${sla.pct}%` }}/>
                </div>
                <p className="text-[10px] text-gray-400">Limite : {sla.deadline.toLocaleString("fr-DZ")} · SLA : {sla.hours}h</p>
              </div>
            )}

            {/* Status selector */}
            <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-gray-100">
              <label className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                <Clock size={11}/> Statut :
              </label>
              {isClosed ? (
                <span className="text-[12px] font-semibold text-gray-500 flex items-center gap-1.5">
                  <Lock size={12}/> Ticket fermé — statut verrouillé
                </span>
              ) : (
                <select value={status} onChange={e => handleStatusChange(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 cursor-pointer focus:outline-none focus:border-blue-400">
                  {Object.entries(STATUS_FR).filter(([v]) => v !== "closed").map(([val, lbl]) => (
                    <option key={val} value={val}>{lbl}</option>
                  ))}
                </select>
              )}
              {savingStatus && (
                <span className="text-[10px] text-gray-400 animate-pulse flex items-center gap-1">
                  <Circle size={8} className="animate-spin"/> Sauvegarde...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ══ ACTUALITÉ (TOP horizontal) + Conversation/Actions (BOTTOM row) ══ */}
        <div className="space-y-6">
          
          {/* ── ACTUALITÉ ── TOP full-width horizontal */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100 shrink-0">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={12}/> Actualité
              </h2>
            </div>
            <div className="h-[200px] overflow-hidden p-4">
              {actuality.length === 0 ? (
                <p className="text-[11px] text-gray-300 text-center mt-8">Aucune activité</p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 h-full">
                  {actuality.map(item => (
                    <div key={item.id} className="flex-none w-48 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition hover:bg-white min-h-[120px] flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${ACT_DOT[item.type] ?? "bg-gray-300"}`}/>
                        <p className="text-[10px] font-bold text-gray-400 font-mono flex-shrink-0">{item.date}</p>
                      </div>
                      <p className="text-[11px] text-gray-700 leading-snug flex-1 line-clamp-4"
                        dangerouslySetInnerHTML={{ __html: item.message }}/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Conversation + Actions ── SAME LEVEL UNDER actualité */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
            {/* ── Conversation ── */}
            <div className="bg-white rounded-xl border border-gray-200 h-[500px]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={12}/> Conversation
                </h2>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                  {conversation.length} msg
                </span>
              </div>
              <div className="h-[420px] overflow-y-auto px-4 py-4">
                {conversation.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare size={28} className="text-gray-200 mb-3"/>
                    <p className="text-[12px] text-gray-400 font-medium">Aucun message</p>
                    <p className="text-[11px] text-gray-300 mt-1">Les échanges avec l'employé apparaîtront ici.</p>
                  </div>
                ) : (
                  conversation.map(item => (
                    <ConvBubble key={item.id} item={item} currentUser={currentUser} empInitials={ini} empName={empName}/>
                  ))
                )}
                <div ref={convEndRef}/>
              </div>
            </div>

            {/* ── Send/Respond/Redirect/Close ── */}
            <div className="bg-white rounded-xl border border-gray-200 h-[500px]">
              {/* Tabs */}
              <div className="flex border-b border-gray-100 shrink-0">
                {[
                  { id:"respond",  label:"Répondre"  },
                  { id:"redirect", label:"Rediriger" },
                  { id:"close",    label:"Fermer"    },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 text-[11px] font-semibold border-b-2 transition-all bg-transparent cursor-pointer
                      ${activeTab === tab.id ? "text-blue-700 border-blue-600 bg-white" : "text-gray-500 border-transparent hover:text-gray-700"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {/* ── RESPOND tab ── */}
                {activeTab === "respond" && (
                  isClosed ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Lock size={15}/><p className="text-sm font-semibold">Ticket fermé — aucune action disponible</p>
                      </div>
                      {ticket.solution && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1.5 flex items-center gap-1"><CheckCircle2 size={11}/> Solution finale</p>
                          <div className="text-[12px] text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: ticket.solution }}/>
                        </div>
                      )}
                      {ticket.closing_note && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Note de fermeture</p>
                          <p className="text-[12px] text-gray-700">{ticket.closing_note}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Solution / Info sub-tabs */}
                      <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                        <button onClick={() => setRespondMode("solution")}
                          className={`flex-1 py-2 text-[11px] font-semibold transition flex items-center justify-center gap-1 ${respondMode === "solution" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                          <CheckCircle2 size={12}/> Solution
                        </button>
                        <button onClick={() => setRespondMode("info")}
                          className={`flex-1 py-2 text-[11px] font-semibold transition flex items-center justify-center gap-1 ${respondMode === "info" ? "bg-white text-amber-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                          <MessageSquare size={12}/> Demande info
                        </button>
                      </div>

                      {/* Awaiting confirmation notice */}
                      {respondMode === "solution" && solutionBlocked && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[11px] text-amber-700 flex items-start gap-2">
                          <Info size={13} className="shrink-0 mt-0.5"/>
                          Solution envoyée — en attente de la confirmation de l'employé. Si l'employé répond "Non, toujours un problème", vous pourrez envoyer une nouvelle solution.
                        </div>
                      )}

                      {/* Confirmed notice */}
                      {ticket?.is_resolved_confirmed && (
                        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-[11px] text-green-700 flex items-center gap-2">
                          <CheckCircle2 size={13}/> Résolution confirmée par l'employé.
                        </div>
                      )}

                      {/* Text editor */}
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">
                          {respondMode === "solution"
                            ? (ticket?.solution ? "Mettre à jour la solution" : `Solution pour ${emp.name} ${emp.surname}`)
                            : `Message à ${emp.name} ${emp.surname}`}
                        </label>
                        <RichTextArea
                          onChange={respondMode === "solution" ? setSolution : setInfoMsg}
                          placeholder={respondMode === "solution" ? "Décrivez la solution ici..." : "Posez votre question ici..."}
                          rows={5}
                          disabled={respondMode === "solution" && solutionBlocked}
                          clearSignal={clearSignal}
                        />
                      </div>

                      <FileAttachment
                        disabled={respondMode === "solution" && solutionBlocked}
                        files={respondMode === "solution" ? solutionFiles : infoFiles}
                        onAdd={f => respondMode === "solution" ? setSolutionFiles(p => [...p, ...f]) : setInfoFiles(p => [...p, ...f])}
                        onRemove={i => respondMode === "solution" ? setSolutionFiles(p => p.filter((_,x) => x !== i)) : setInfoFiles(p => p.filter((_,x) => x !== i))}
                      />

                      {sentError && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[11px] text-red-700">
                          <AlertTriangle size={13}/> {sentError}
                        </div>
                      )}

                      <button onClick={handleSend}
                        disabled={
                          sending
                          || (respondMode === "solution" && solutionBlocked)
                          || (respondMode === "solution"
                              ? (!solution.replace(/<[^>]*>/g,"").trim() && solutionFiles.length === 0)
                              : (!infoMsg.replace(/<[^>]*>/g,"").trim() && infoFiles.length === 0))
                        }
                        className={`flex items-center justify-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-40 disabled:cursor-not-allowed transition
                          ${respondMode === "solution" ? "bg-blue-600 hover:bg-blue-700" : "bg-amber-500 hover:bg-amber-600"}`}>
                        <Send size={13}/>
                        {sending ? "Envoi..." : respondMode === "solution" ? "Envoyer la solution" : "Envoyer la demande"}
                      </button>

                      {/* Hint: confirmation is automatic with solution */}
                      {respondMode === "solution" && !solutionBlocked && (
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                          <ShieldCheck size={11} className="text-green-500"/>
                          Une demande de confirmation sera envoyée automatiquement à l'employé.
                        </p>
                      )}
                    </>
                  )
                )}

                {/* ── REDIRECT tab ── */}
                {activeTab === "redirect" && (
                  isClosed ? (
                    <div className="flex items-center gap-2 text-gray-400 text-[12px]"><Lock size={13}/> Ticket fermé</div>
                  ) : (
                    <>
                      <div className="flex items-start gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 text-[11px] text-purple-700">
                        <Forward size={13} className="shrink-0 mt-0.5"/>
                        Sélectionnez le technicien et/ou le service vers lequel rediriger ce ticket.
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5"><User size={11} className="text-gray-400"/> Technicien</label>
                        <select value={redirectTechId} onChange={e => setRedirectTechId(e.target.value)}
                          className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:border-purple-400 cursor-pointer">
                          <option value="">Choisir un technicien...</option>
                          {techniciens.map(t => <option key={t.id} value={t.id}>{t.name} {t.surname}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5"><Layers size={11} className="text-gray-400"/> Service</label>
                        <select value={redirectServiceId} onChange={e => setRedirectServiceId(e.target.value)}
                          className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:border-purple-400 cursor-pointer">
                          <option value="">Choisir un service...</option>
                          {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5"><Tag size={11} className="text-gray-400"/> Catégorie</label>
                        <select value={redirectCategory} onChange={e => setRedirectCategory(e.target.value)}
                          className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:border-purple-400 cursor-pointer">
                          <option value="">Choisir une catégorie...</option>
                          {CATEGORIES_EN.map(c => <option key={c} value={c}>{CATEGORY_FR[c]}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                          <MessageSquare size={11} className="text-gray-400"/> Raison <span className="text-gray-400 font-normal">(obligatoire)</span>
                        </label>
                        <textarea rows={3} value={redirectNote} onChange={e => setRedirectNote(e.target.value)}
                          placeholder="Expliquez pourquoi vous redirigez ce ticket..."
                          className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 resize-none focus:outline-none focus:border-purple-400 leading-relaxed"/>
                      </div>
                      <button onClick={handleRedirect}
                        disabled={(!redirectTechId && !redirectServiceId) || !redirectNote.trim() || redirecting}
                        className="flex items-center justify-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                        <Forward size={13}/>{redirecting ? "Redirection..." : "Rediriger le ticket"}
                      </button>
                    </>
                  )
                )}

                {/* ── CLOSE tab ── */}
                {activeTab === "close" && (
                  isClosed ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-gray-500 text-sm font-semibold"><Lock size={15}/> Ticket fermé</div>
                      {ticket.closing_note && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Note de fermeture</p>
                          <p className="text-[12px] text-gray-700">{ticket.closing_note}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {ticket?.is_resolved_confirmed && (
                        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-[11px] text-green-700 flex items-center gap-2">
                          <CheckCircle2 size={13}/> Résolution confirmée — vous pouvez fermer le ticket.
                        </div>
                      )}
                      {awaitingConfirm && !ticket?.is_resolved_confirmed && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[11px] text-amber-700 flex items-center gap-2">
                          <Clock size={13}/> En attente de la réponse de l'employé.
                        </div>
                      )}
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
                        <div>
                          <p className="text-[12px] font-bold text-gray-800 mb-1">Vous avez déjà contacté l'employé ?</p>
                          <p className="text-[11px] text-gray-500 leading-relaxed">Si vous avez résolu le problème par téléphone ou en personne, fermez le ticket manuellement sans attendre sa réponse.</p>
                        </div>
                        <button onClick={() => setShowManualClose(true)}
                          className="flex items-center justify-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition bg-white cursor-pointer w-full">
                          <Lock size={13}/> Fermer manuellement
                        </button>
                      </div>
                    </>
                  )
                )}

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

