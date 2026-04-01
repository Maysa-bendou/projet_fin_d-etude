import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Tag, AlertTriangle, Layers, Zap,
  User, Mail, Building2, Briefcase, Phone, DoorOpen, Calendar, Clock,
  CheckCircle2, Circle, Send, Paperclip, X, Bold, Italic, Underline,
  Strikethrough, List, ListOrdered, RotateCcw, Forward, MessageSquare,
  Activity, Info, Hash, FileText, ShieldCheck,
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
const CATEGORY_FR = {
  hardware:"Hardware", software:"Logiciels", network:"Réseau",
  access:"Accès", security:"Sécurité", account:"Compte",
};
const TYPE_FR = {
  incident:"Incident", service_request:"Demande de service",
  change:"Changement", problem:"Problème",
};
const STATUS_CLASS = {
  open:             "bg-blue-100 text-blue-700 border border-blue-200",
  in_progress:      "bg-amber-100 text-amber-700 border border-amber-200",
  pending:          "bg-purple-100 text-purple-700 border border-purple-200",
  pending_supplier: "bg-orange-100 text-orange-700 border border-orange-200",
  resolved:         "bg-green-100 text-green-700 border border-green-200",
  closed:           "bg-gray-200 text-gray-600 border border-gray-300",
  rejected:         "bg-red-100 text-red-700 border border-red-200",
};
const STATUS_FR = {
  open:"Ouvert", in_progress:"En cours", pending:"En attente",
  pending_supplier:"Att. fournisseur", resolved:"Résolu",
  closed:"Fermé", rejected:"Rejeté",
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
  const ms  = deadline - new Date();
  const h   = { high:4, critical:2, medium:24, low:72 }[priority] ?? 24;
  return {
    deadline, hours: h,
    diffH: Math.floor(Math.abs(ms) / 3600000),
    diffM: Math.floor((Math.abs(ms) % 3600000) / 60000),
    pct:   Math.max(0, Math.min(100, (ms / (h * 3600000)) * 100)),
    expired: ms < 0,
  };
}

// ── Tooltip ────────────────────────────────────────────────────────────────
function UserTooltip({ user, children }) {
  const [show, setShow] = useState(false);
  if (!user) return children;
  return (
    <div className="relative inline-block"
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-56 bg-gray-900 text-white rounded-xl shadow-xl p-3 text-[11px]">
          <p className="font-bold text-[13px] mb-1">{user.name} {user.surname}</p>
          {user.email && <p className="flex items-center gap-1.5 text-gray-300 mt-0.5"><Mail size={10}/>{user.email}</p>}
          {user.phone && <p className="flex items-center gap-1.5 text-gray-300 mt-0.5"><Phone size={10}/>{user.phone}</p>}
          {user.role  && <p className="flex items-center gap-1.5 text-gray-400 mt-0.5 capitalize"><User size={10}/>{user.role}</p>}
          <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"/>
        </div>
      )}
    </div>
  );
}

// ── RichTextArea ───────────────────────────────────────────────────────────
function RichTextArea({ onChange, placeholder, rows = 6 }) {
  const ref = useRef(null);
  const exec = (cmd) => { ref.current?.focus(); document.execCommand(cmd, false, null); onChange(ref.current?.innerHTML || ""); };
  const tools = [
    { Icon:Bold, cmd:"bold" }, { Icon:Italic, cmd:"italic" },
    { Icon:Underline, cmd:"underline" }, { Icon:Strikethrough, cmd:"strikeThrough" },
    { divider:true },
    { Icon:List, cmd:"insertUnorderedList" }, { Icon:ListOrdered, cmd:"insertOrderedList" },
    { divider:true }, { Icon:RotateCcw, cmd:"removeFormat" },
  ];
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-100 flex-wrap">
        {tools.map((t, i) => t.divider
          ? <div key={i} className="w-px h-4 bg-gray-300 mx-1"/>
          : <button key={i} type="button" onMouseDown={e => { e.preventDefault(); exec(t.cmd); }}
              className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-200 transition text-gray-600 bg-transparent border-none cursor-pointer">
              <t.Icon size={13}/>
            </button>
        )}
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML || "")}
        data-placeholder={placeholder}
        className="px-3 py-2.5 text-[13px] text-gray-800 outline-none leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
        style={{ minHeight:`${rows * 22}px` }}/>
    </div>
  );
}

// ── FileAttachment ─────────────────────────────────────────────────────────
function FileAttachment({ files, onAdd, onRemove }) {
  const ref = useRef(null);
  return (
    <div>
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

// ── Modal confirmation résolution ──────────────────────────────────────────
function ConfirmModal({ onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} className="text-green-600"/>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Confirmer la résolution</p>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Êtes-vous sûr de vouloir envoyer une demande de confirmation à l'employé ?
            </p>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-[11px] text-green-700 flex items-start gap-2">
          <Info size={12} className="shrink-0 mt-0.5"/>
          Le ticket passera en <strong className="mx-1">Résolu</strong> et l'employé devra confirmer la clôture.
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} disabled={loading}
            className="px-4 py-2 text-[12px] font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 bg-transparent cursor-pointer transition">
            Annuler
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 text-[12px] font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer transition flex items-center gap-2">
            <ShieldCheck size={13}/>{loading ? "Envoi..." : "Envoyer la demande"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── TimelineItem ───────────────────────────────────────────────────────────
function TimelineItem({ item }) {
  const conf = {
    solution: { dot:"bg-blue-500",   ring:"ring-blue-100",   bg:"bg-blue-50 border-blue-200",    lbl:"Solution",       lCls:"bg-blue-100 text-blue-700",   Icon:CheckCircle2  },
    info:     { dot:"bg-amber-500",  ring:"ring-amber-100",  bg:"bg-amber-50 border-amber-200",  lbl:"Demande d'info", lCls:"bg-amber-100 text-amber-700", Icon:MessageSquare },
    status:   { dot:"bg-purple-500", ring:"ring-purple-100", bg:"bg-purple-50 border-purple-200",lbl:"Statut modifié", lCls:"bg-purple-100 text-purple-700",Icon:Activity      },
    redirect: { dot:"bg-pink-500",   ring:"ring-pink-100",   bg:"bg-pink-50 border-pink-200",    lbl:"Redirigé",       lCls:"bg-pink-100 text-pink-700",   Icon:Forward       },
    confirm:  { dot:"bg-green-500",  ring:"ring-green-100",  bg:"bg-green-50 border-green-200",  lbl:"Confirmation",   lCls:"bg-green-100 text-green-700", Icon:ShieldCheck   },
    comment:  { dot:"bg-gray-400",   ring:"ring-gray-100",   bg:"bg-gray-50 border-gray-200",    lbl:"Commentaire",    lCls:"bg-gray-100 text-gray-600",   Icon:MessageSquare },
  };
  const c = conf[item.type] ?? conf.comment;
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ring-4 mt-0.5 ${c.dot} ${c.ring}`}>
          <c.Icon size={12} className="text-white"/>
        </div>
        <div className="w-px flex-1 bg-gray-200 mt-1"/>
      </div>
      <div className={`flex-1 rounded-xl p-3 border text-[12px] mb-4 ${c.bg}`}>
        <div className="flex justify-between items-start mb-1.5 flex-wrap gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800">{item.author}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.lCls}`}>{c.lbl}</span>
          </div>
          <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock size={9}/>{item.date}</span>
        </div>
        {item.message && (
          <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.message }}/>
        )}
        {item.files?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.files.map((f, i) => (
              <span key={i} className="flex items-center gap-1 text-[10px] bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-600">
                <Paperclip size={9}/>{f}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────
export default function TicketDetailTechnicien() {
  const navigate    = useNavigate();
  const { id }      = useParams();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const [ticket,           setTicket]           = useState(null);
  const [allIds,           setAllIds]           = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [status,           setStatus]           = useState("");
  const [savingStatus,     setSavingStatus]     = useState(false);
  const [activeTab,        setActiveTab]        = useState("solution");
  const [solution,         setSolution]         = useState("");
  const [infoMsg,          setInfoMsg]          = useState("");
  const [solutionFiles,    setSolutionFiles]    = useState([]);
  const [infoFiles,        setInfoFiles]        = useState([]);
  const [sending,          setSending]          = useState(false);
  const [sent,             setSent]             = useState(false);
  const [sentError,        setSentError]        = useState(null);
  const [timeline,         setTimeline]         = useState([]);
  const [services,         setServices]         = useState([]);
  const [techniciens,      setTechniciens]      = useState([]);
  const [redirectTechId,   setRedirectTechId]   = useState("");
  const [redirectServiceId,setRedirectServiceId]= useState("");
  const [redirectCategory, setRedirectCategory] = useState("");
  const [redirectNote,     setRedirectNote]     = useState("");
  const [redirecting,      setRedirecting]      = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming,       setConfirming]       = useState(false);

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

        // Timeline initiale depuis BDD
        setTimeline(
          data.comments.map((c) => ({
            id:     c.id,
            type:   c.message.startsWith("[REDIRECTION]") ? "redirect"
                  : c.authorRole === "technician"         ? "solution"
                  : "comment",
            author: c.author,
            message:c.message.replace(/^\[REDIRECTION\]\s*/, ""),
            files:  [],
            date:   new Date(c.date).toLocaleString("fr-DZ"),
          }))
        );
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [id]);

  // ── Fetch assigned ids ────────────────────────────────────────────────────
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

  // ── Fetch services + techniciens pour redirect ────────────────────────────
  useEffect(() => {
    if (activeTab !== "redirect") return;
    (async () => {
      const [sRes, tRes] = await Promise.all([
        fetch(`${API}/services`),
        fetch(`${API}/techniciens`),
      ]);
      setServices(await sRes.json());
      setTechniciens(await tRes.json());
    })();
  }, [activeTab]);

  const idx    = allIds.indexOf(Number(id));
  const prevId = idx > 0 ? allIds[idx - 1] : null;
  const nextId = idx < allIds.length - 1 ? allIds[idx + 1] : null;

  // ── Statut ────────────────────────────────────────────────────────────────
  const handleStatusChange = async (newStatus) => {
    const old = status; setStatus(newStatus); setSavingStatus(true);
    try {
      const res = await fetch(`${API}/tickets/${id}/status`, {
        method: "PUT", headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setTimeline((p) => [...p, {
        id: Date.now(), type: "status",
        author: `${currentUser?.name ?? "Tech"} ${currentUser?.surname ?? ""}`.trim(),
        message: `Statut : <strong>${STATUS_FR[old]}</strong> → <strong>${STATUS_FR[newStatus]}</strong>`,
        files: [], date: new Date().toLocaleString("fr-DZ"),
      }]);
    } catch { setStatus(old); }
    finally { setSavingStatus(false); }
  };

  // ── Envoi solution / info ─────────────────────────────────────────────────
  const handleSend = async () => {
    const msg   = activeTab === "solution" ? solution : infoMsg;
    const files = activeTab === "solution" ? solutionFiles : infoFiles;
    if (!msg.trim() && files.length === 0) return;
    setSending(true); setSentError(null);
    try {
      const fd = new FormData();
      fd.append("message",     msg);
      fd.append("technicianId",currentUser?.id);
      fd.append("type",        activeTab);
      files.forEach((f) => fd.append("files", f));

      const res = await fetch(`${API}/tickets/${id}/send`, { method:"POST", body:fd });
      if (!res.ok) throw new Error("Erreur serveur");

      setStatus(activeTab === "solution" ? "resolved" : "pending");
      setTimeline((p) => [...p, {
        id: Date.now(), type: activeTab,
        author: `${currentUser?.name ?? "Tech"} ${currentUser?.surname ?? ""}`.trim(),
        message: msg,
        files: files.map((f) => f.name),
        date: new Date().toLocaleString("fr-DZ"),
      }]);
      setSent(true); setTimeout(() => setSent(false), 3000);
      if (activeTab === "solution") { setSolution(""); setSolutionFiles([]); }
      else { setInfoMsg(""); setInfoFiles([]); }
    } catch (e) { setSentError(e.message); }
    finally { setSending(false); }
  };

  // ── Demande confirmation résolution ───────────────────────────────────────
  const handleConfirmResolution = async () => {
    setConfirming(true);
    try {
      const res = await fetch(`${API}/tickets/${id}/confirm`, { method:"PUT" });
      if (!res.ok) throw new Error();
      setStatus("closed");
      setTimeline((p) => [...p, {
        id: Date.now(), type: "confirm",
        author: `${currentUser?.name ?? "Tech"} ${currentUser?.surname ?? ""}`.trim(),
        message: "Demande de confirmation de résolution envoyée à l'employé.",
        files: [], date: new Date().toLocaleString("fr-DZ"),
      }]);
      setShowConfirmModal(false);
    } catch { alert("Erreur lors de la confirmation."); }
    finally { setConfirming(false); }
  };

  // ── Redirection ───────────────────────────────────────────────────────────
  const handleRedirect = async () => {
    if (!redirectTechId && !redirectServiceId) return;
    setRedirecting(true);
    try {
      const res = await fetch(`${API}/tickets/${id}/redirect`, {
        method: "PUT", headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          newTechId:    redirectTechId    || null,
          newServiceId: redirectServiceId || null,
          newCategory:  redirectCategory  || null,
          note:         redirectNote,
          assignedById: currentUser?.id,
        }),
      });
      if (!res.ok) throw new Error();
      const tech = techniciens.find((t) => t.id === parseInt(redirectTechId));
      const svc  = services.find((s) => s.id === parseInt(redirectServiceId));
      setTimeline((p) => [...p, {
        id: Date.now(), type: "redirect",
        author: `${currentUser?.name ?? "Tech"} ${currentUser?.surname ?? ""}`.trim(),
        message: `Redirigé → <strong>${tech ? `${tech.name} ${tech.surname}` : "N/A"}</strong> / 
                  service <strong>${svc?.name ?? "N/A"}</strong>
                  ${redirectCategory ? ` / catégorie <strong>${CATEGORY_FR[redirectCategory]}</strong>` : ""}
                  ${redirectNote ? `<br/><em>Note : ${redirectNote}</em>` : ""}`,
        files: [], date: new Date().toLocaleString("fr-DZ"),
      }]);
      setStatus("open");
      setRedirectTechId(""); setRedirectServiceId(""); setRedirectCategory(""); setRedirectNote("");
    } finally { setRedirecting(false); }
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────
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

  const emp  = ticket.employee ?? {};
  const ini  = `${emp.name?.[0] ?? "?"}${emp.surname?.[0] ?? ""}`;
  const sla  = ticket.createdAt ? getSLAInfo(ticket.createdAt, ticket.priority, ticket.sla_due_date) : null;

  return (
    <div className="min-h-screen bg-gray-50 p-5">
      {showConfirmModal && (
        <ConfirmModal
          loading={confirming}
          onConfirm={handleConfirmResolution}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      <div className="max-w-7xl mx-auto flex flex-col gap-5">

        {/* Breadcrumb + Prev/Next */}
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
            <button disabled={!prevId} onClick={() => navigate(`/technician/tickets-service/${prevId}`)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
              <ChevronLeft size={13}/> Précédent
            </button>
            {idx >= 0 && <span className="text-xs text-gray-400 font-mono">{idx+1}/{allIds.length}</span>}
            <button disabled={!nextId} onClick={() => navigate(`/technician/tickets-service/${nextId}`)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
              Suivant <ChevronRight size={13}/>
            </button>
          </div>
        </div>

        {/* Employé + Ticket */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">

          {/* Employé */}
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
              ].map((f) => (
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

          {/* Ticket */}
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
                {
                  Icon:AlertTriangle, label:"Priorité",
                  custom: ticket.priority
                    ? <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${PRIORITY_CLASS[ticket.priority] ?? "bg-gray-100"}`}>
                        {PRIORITY_FR[ticket.priority] ?? ticket.priority}
                      </span>
                    : null,
                },
                { Icon:Tag,          label:"Catégorie",   value: CATEGORY_FR[ticket.category] ?? ticket.category },
                { Icon:Layers,       label:"Service",     value: ticket.service ?? "N/A" },
                { Icon:Zap,          label:"Impact",      value: IMPACT_FR[ticket.impact]   ?? ticket.impact   ?? "N/A" },
                { Icon:AlertTriangle,label:"Urgence",     value: URGENCY_FR[ticket.urgency] ?? ticket.urgency  ?? "N/A" },
                { Icon:FileText,     label:"Type",        value: TYPE_FR[ticket.type]       ?? ticket.type     ?? "Incident" },
                {
                  Icon:User, label:"Assigné par",
                  custom: ticket.assignedBy
                    ? ticket.assignedBy.type === "auto"
                      ? <span className="text-[12px] font-semibold text-gray-500 italic">Auto / Système</span>
                      : <UserTooltip user={ticket.assignedBy}>
                          <span className="text-[12px] font-semibold text-blue-700 cursor-default underline decoration-dotted">
                            {ticket.assignedBy.label}
                          </span>
                        </UserTooltip>
                    : null,
                },
                { Icon:Calendar, label:"Créé le", value: ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("fr-DZ") : "N/A" },
              ].map((f) => (
                <div key={f.label} className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <f.Icon size={10} className="text-gray-400"/>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{f.label}</p>
                  </div>
                  {f.custom ? f.custom : <p className="text-[12px] font-semibold text-gray-800">{f.value}</p>}
                </div>
              ))}
            </div>

            {/* SLA — barre grise colorée selon le temps restant */}
            {sla && (
              <div className="rounded-xl p-3 border bg-gray-50 border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className={sla.expired ? "text-red-500" : "text-gray-500"}/>
                    <p className="text-[11px] font-bold text-gray-700">SLA</p>
                  </div>
                  <span className={`text-[11px] font-bold ${sla.expired ? "text-red-600" : sla.pct > 50 ? "text-emerald-700" : sla.pct > 20 ? "text-amber-600" : "text-red-600"}`}>
                    {sla.expired
                      ? `⚠ Dépassé de ${sla.diffH}h ${sla.diffM}m`
                      : `${sla.diffH}h ${sla.diffM}m restants`}
                  </span>
                </div>
                {/* Barre grise avec fill coloré */}
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      sla.expired ? "bg-red-500"
                      : sla.pct > 50 ? "bg-emerald-500"
                      : sla.pct > 20 ? "bg-amber-500"
                      : "bg-red-500"
                    }`}
                    style={{ width: sla.expired ? "100%" : `${sla.pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400">
                  Limite : {sla.deadline.toLocaleString("fr-DZ")} · SLA : {sla.hours}h
                </p>
              </div>
            )}

            {/* Statut — sans bouton "Prendre en charge" */}
            <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-gray-100">
              <label className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                <Clock size={11}/> Statut :
              </label>
              <select value={status} onChange={(e) => handleStatusChange(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 cursor-pointer focus:outline-none focus:border-blue-400">
                {Object.entries(STATUS_FR).map(([val, lbl]) => (
                  <option key={val} value={val}>{lbl}</option>
                ))}
              </select>
              {savingStatus && (
                <span className="text-[10px] text-gray-400 animate-pulse flex items-center gap-1">
                  <Circle size={8} className="animate-spin"/> Sauvegarde...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions + Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Tabs */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-100 bg-gray-50">
              {[
                { id:"solution", label:"Solution",    Icon:CheckCircle2 },
                { id:"info",     label:"Demande info", Icon:MessageSquare },
                { id:"redirect", label:"Rediriger",    Icon:Forward },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-semibold border-b-2 transition-all bg-transparent cursor-pointer
                    ${activeTab === tab.id ? "text-blue-700 border-blue-600 bg-white" : "text-gray-500 border-transparent hover:text-gray-700"}`}>
                  <tab.Icon size={13}/>{tab.label}
                </button>
              ))}
            </div>

            <div className="p-5 flex flex-col gap-4">
              {sent && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-[12px] text-green-700">
                  <CheckCircle2 size={14}/> Envoyé et sauvegardé en base de données !
                </div>
              )}
              {sentError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[12px] text-red-700">
                  <AlertTriangle size={14}/> {sentError}
                </div>
              )}

              {/* ── Solution ── */}
              {activeTab === "solution" && (<>
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-[11px] text-blue-700">
                  <Info size={13} className="shrink-0 mt-0.5"/>
                  La solution sera sauvegardée et visible par l'employé. Le ticket passera en <strong className="ml-1">Résolu</strong>.
                </div>

                {/* Solution existante en BDD */}
                {ticket.solution && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <CheckCircle2 size={11}/> Solution envoyée
                    </p>
                    <div className="text-[12px] text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: ticket.solution }}/>
                  </div>
                )}

                {/* Pièces jointes existantes */}
                {ticket.attachments?.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Paperclip size={11}/> Fichiers joints ({ticket.attachments.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ticket.attachments.map((a) => (
                        <a key={a.id}
                          href={`http://localhost:3001/uploads/tickets/${id}/${a.fileName}`}
                          target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-[11px] bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-blue-600 hover:bg-blue-50 transition">
                          <Paperclip size={10}/>{a.fileName}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">
                    {ticket.solution ? "Mettre à jour la solution" : `Solution pour ${emp.name} ${emp.surname}`}
                  </label>
                  <RichTextArea value={solution} onChange={setSolution} placeholder="Décrivez la solution ici..." rows={6}/>
                </div>
                <FileAttachment files={solutionFiles}
                  onAdd={(f) => setSolutionFiles((p) => [...p, ...f])}
                  onRemove={(i) => setSolutionFiles((p) => p.filter((_, x) => x !== i))}/>

                <div className="flex gap-2 flex-wrap">
                  <button onClick={handleSend} disabled={sending || (!solution.trim() && solutionFiles.length === 0)}
                    className="flex items-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                    <Send size={13}/> {sending ? "Envoi..." : "Envoyer la solution"}
                  </button>

                  {/* Bouton demande confirmation résolution */}
                  {status === "resolved" && !ticket.is_resolved_confirmed && (
                    <button onClick={() => setShowConfirmModal(true)}
                      className="flex items-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition">
                      <ShieldCheck size={13}/> Demander confirmation
                    </button>
                  )}
                  {ticket.is_resolved_confirmed && (
                    <span className="flex items-center gap-1.5 text-[12px] text-green-700 font-medium">
                      <CheckCircle2 size={14}/> Résolution confirmée par l'employé
                    </span>
                  )}
                </div>
              </>)}

              {/* ── Info ── */}
              {activeTab === "info" && (<>
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[11px] text-amber-700">
                  <Info size={13} className="shrink-0 mt-0.5"/>
                  Demander une info passera le ticket en <strong className="ml-1">En attente</strong>.
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">
                    Demande à {emp.name} {emp.surname}
                  </label>
                  <RichTextArea value={infoMsg} onChange={setInfoMsg} placeholder="Posez votre question ici..." rows={6}/>
                </div>
                <FileAttachment files={infoFiles}
                  onAdd={(f) => setInfoFiles((p) => [...p, ...f])}
                  onRemove={(i) => setInfoFiles((p) => p.filter((_, x) => x !== i))}/>
                <button onClick={handleSend} disabled={sending || (!infoMsg.trim() && infoFiles.length === 0)}
                  className="self-start flex items-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  <Send size={13}/> {sending ? "Envoi..." : "Envoyer la demande"}
                </button>
              </>)}

              {/* ── Redirect ── */}
              {activeTab === "redirect" && (<>
                <div className="flex items-start gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 text-[11px] text-purple-700">
                  <Forward size={13} className="shrink-0 mt-0.5"/>
                  Sélectionnez le technicien, le service et/ou la catégorie de redirection.
                </div>

                {/* Technicien */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <User size={12} className="text-gray-400"/> Technicien
                  </label>
                  <select value={redirectTechId} onChange={(e) => setRedirectTechId(e.target.value)}
                    className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:border-purple-400 cursor-pointer">
                    <option value="">Choisir un technicien...</option>
                    {techniciens.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} {t.surname}</option>
                    ))}
                  </select>
                </div>

                {/* Service */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <Layers size={12} className="text-gray-400"/> Service
                  </label>
                  <select value={redirectServiceId} onChange={(e) => setRedirectServiceId(e.target.value)}
                    className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:border-purple-400 cursor-pointer">
                    <option value="">Choisir un service...</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Catégorie */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <Tag size={12} className="text-gray-400"/> Catégorie
                  </label>
                  <select value={redirectCategory} onChange={(e) => setRedirectCategory(e.target.value)}
                    className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:border-purple-400 cursor-pointer">
                    <option value="">Choisir une catégorie...</option>
                    {CATEGORIES_EN.map((c) => (
                      <option key={c} value={c}>{CATEGORY_FR[c]}</option>
                    ))}
                  </select>
                </div>

                {/* Note */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <MessageSquare size={12} className="text-gray-400"/> Note
                    <span className="text-gray-400 font-normal">(optionnel)</span>
                  </label>
                  <textarea rows={3} value={redirectNote} onChange={(e) => setRedirectNote(e.target.value)}
                    placeholder="Expliquez la raison de la redirection..."
                    className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 resize-none focus:outline-none focus:border-purple-400 leading-relaxed"/>
                </div>

                <button onClick={handleRedirect}
                  disabled={(!redirectTechId && !redirectServiceId) || redirecting}
                  className="self-start flex items-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  <Forward size={13}/> {redirecting ? "Redirection..." : "Rediriger le ticket"}
                </button>
              </>)}
            </div>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={12}/> Activité
              </h2>
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                {timeline.length} événement{timeline.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[440px] pr-1">
              {timeline.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-36 text-center">
                  <Activity size={28} className="text-gray-200 mb-3"/>
                  <p className="text-[12px] text-gray-400 font-medium">Aucune activité</p>
                  <p className="text-[11px] text-gray-300 mt-1">Les actions apparaîtront ici.</p>
                </div>
              ) : (
                <div className="pt-1">{timeline.map((item) => <TimelineItem key={item.id} item={item}/>)}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}