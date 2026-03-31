import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Tag, AlertTriangle, Layers, Zap,
  User, Mail, Building2, Briefcase, Phone, DoorOpen, Calendar, Clock,
  CheckCircle2, Circle, Send, Paperclip, X, Bold, Italic, Underline,
  Strikethrough, List, ListOrdered, RotateCcw, Forward, MessageSquare,
  Activity, Info,
} from "lucide-react";

// ── Badge maps ─────────────────────────────────────────────────────────────
const PRIORITY_CLASS = {
  Haute:"bg-red-100 text-red-700 border border-red-200", High:"bg-red-100 text-red-700 border border-red-200",
  Normale:"bg-amber-100 text-amber-700 border border-amber-200", Medium:"bg-amber-100 text-amber-700 border border-amber-200",
  Basse:"bg-green-100 text-green-700 border border-green-200", Low:"bg-green-100 text-green-700 border border-green-200",
};
const STATUS_CLASS = {
  "Ouvert":"bg-blue-100 text-blue-700 border border-blue-200",
  "En cours":"bg-amber-100 text-amber-700 border border-amber-200",
  "En attente":"bg-purple-100 text-purple-700 border border-purple-200",
  "Résolu":"bg-green-100 text-green-700 border border-green-200",
  "Fermé":"bg-gray-200 text-gray-600 border border-gray-300",
};
const STATUS_FR = { open:"Ouvert", in_progress:"En cours", waiting:"En attente", resolved:"Résolu", closed:"Fermé" };
const STATUS_EN = { "Ouvert":"open","En cours":"in_progress","En attente":"waiting","Résolu":"resolved","Fermé":"closed" };
const STATUTS_FR = ["Ouvert","En cours","En attente","Résolu","Fermé"];

// Mock — remplacer par fetch
const CATEGORIES_MOCK = ["Logiciels","Hardware","VPN","Mot de Passe","Réseau","Autre"];
const SERVICES_MOCK   = ["Support N1","Support N2","Infrastructure","Sécurité","Développement"];

// ── SLA ────────────────────────────────────────────────────────────────────
function getSLAInfo(createdAt, priority) {
  const h   = { Haute:4, High:4, Normale:24, Medium:24, Basse:72, Low:72 }[priority] || 24;
  const dl  = new Date(new Date(createdAt).getTime() + h * 3600000);
  const ms  = dl - new Date();
  return { deadline:dl, diffH:Math.floor(Math.abs(ms)/3600000), diffM:Math.floor((Math.abs(ms)%3600000)/60000),
           pct:Math.max(0,Math.min(100,(ms/(h*3600000))*100)), expired:ms<0, hours:h };
}

// ── RichTextArea ───────────────────────────────────────────────────────────
function RichTextArea({ onChange, placeholder, rows=6 }) {
  const ref = useRef(null);
  const exec = (cmd) => { ref.current?.focus(); document.execCommand(cmd,false,null); onChange(ref.current?.innerHTML||""); };
  const tools = [
    { Icon:Bold, cmd:"bold" }, { Icon:Italic, cmd:"italic" }, { Icon:Underline, cmd:"underline" },
    { Icon:Strikethrough, cmd:"strikeThrough" }, { divider:true },
    { Icon:List, cmd:"insertUnorderedList" }, { Icon:ListOrdered, cmd:"insertOrderedList" }, { divider:true },
    { Icon:RotateCcw, cmd:"removeFormat" },
  ];
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-100 flex-wrap">
        {tools.map((t,i) => t.divider
          ? <div key={i} className="w-px h-4 bg-gray-300 mx-1"/>
          : <button key={i} type="button" onMouseDown={e=>{e.preventDefault();exec(t.cmd);}}
              className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-200 transition text-gray-600 bg-transparent border-none cursor-pointer">
              <t.Icon size={13}/>
            </button>
        )}
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning
        onInput={()=>onChange(ref.current?.innerHTML||"")}
        data-placeholder={placeholder}
        className="px-3 py-2.5 text-[13px] text-gray-800 outline-none leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
        style={{minHeight:`${rows*22}px`}} />
    </div>
  );
}

// ── FileAttachment ─────────────────────────────────────────────────────────
function FileAttachment({ files, onAdd, onRemove }) {
  const ref = useRef(null);
  return (
    <div>
      <button type="button" onClick={()=>ref.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition bg-transparent cursor-pointer">
        <Paperclip size={12}/> Joindre un fichier
      </button>
      <input ref={ref} type="file" multiple className="hidden" onChange={e=>onAdd(Array.from(e.target.files))}/>
      {files.length>0&&(
        <div className="flex flex-wrap gap-2 mt-2">
          {files.map((f,i)=>(
            <div key={i} className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1 text-[11px] text-gray-700">
              <Paperclip size={10} className="text-gray-400"/>
              <span className="max-w-[120px] truncate">{f.name}</span>
              <button type="button" onClick={()=>onRemove(i)} className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer"><X size={11}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TimelineItem ───────────────────────────────────────────────────────────
function TimelineItem({ item }) {
  const conf = {
    solution: { dot:"bg-blue-500",   ring:"ring-blue-100",   bg:"bg-blue-50 border-blue-200",    lbl:"Solution",        lCls:"bg-blue-100 text-blue-700",   Icon:CheckCircle2 },
    info:     { dot:"bg-amber-500",  ring:"ring-amber-100",  bg:"bg-amber-50 border-amber-200",  lbl:"Demande d'info",  lCls:"bg-amber-100 text-amber-700", Icon:MessageSquare },
    status:   { dot:"bg-purple-500", ring:"ring-purple-100", bg:"bg-purple-50 border-purple-200",lbl:"Statut modifié",  lCls:"bg-purple-100 text-purple-700",Icon:Activity },
    redirect: { dot:"bg-pink-500",   ring:"ring-pink-100",   bg:"bg-pink-50 border-pink-200",    lbl:"Redirigé",        lCls:"bg-pink-100 text-pink-700",   Icon:Forward },
  };
  const c = conf[item.type]||conf.info;
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
        {item.message&&<div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{__html:item.message}}/>}
        {item.files?.length>0&&(
          <div className="flex flex-wrap gap-1 mt-2">
            {item.files.map((f,i)=>(
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
  const currentUser = JSON.parse(localStorage.getItem("user")||"null");

  const [ticket,          setTicket]          = useState(null);
  const [allIds,          setAllIds]          = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [status,          setStatus]          = useState("");
  const [savingStatus,    setSavingStatus]    = useState(false);
  const [activeTab,       setActiveTab]       = useState("solution");
  const [solution,        setSolution]        = useState("");
  const [infoMsg,         setInfoMsg]         = useState("");
  const [solutionFiles,   setSolutionFiles]   = useState([]);
  const [infoFiles,       setInfoFiles]       = useState([]);
  const [sent,            setSent]            = useState(false);
  const [timeline,        setTimeline]        = useState([]);
  const [redirectCategory,setRedirectCategory]= useState("");
  const [redirectService, setRedirectService] = useState("");
  const [redirectNote,    setRedirectNote]    = useState("");
  const [redirecting,     setRedirecting]     = useState(false);

  // fetch ticket
  useEffect(()=>{
    (async()=>{
      setLoading(true);
      try {
        const res  = await fetch(`http://localhost:3001/api/tickets/${id}`);
        if(!res.ok) throw new Error("Ticket introuvable");
        const data = await res.json();
        setTicket(data);
        setStatus(STATUS_FR[data.status]||data.status);
      } catch(e){ setError(e.message); }
      finally{ setLoading(false); }
    })();
  },[id]);

  // fetch assigned ids for prev/next
  useEffect(()=>{
    (async()=>{
      try {
        const u   = JSON.parse(localStorage.getItem("user"));
        const res = await fetch(`http://localhost:3001/api/tickets/assigned/${u?.id}`);
        if(!res.ok) return;
        setAllIds((await res.json()).map(t=>t.id));
      } catch(_){}
    })();
  },[]);

  const idx    = allIds.indexOf(Number(id));
  const prevId = idx>0 ? allIds[idx-1] : null;
  const nextId = idx<allIds.length-1 ? allIds[idx+1] : null;

  const addTimeline = (type,message,files=[])=>{
    setTimeline(p=>[...p,{
      id:Date.now(), type,
      author:`${currentUser?.name||"Technicien"} ${currentUser?.surname||""}`.trim(),
      message, files:files.map(f=>f.name),
      date:new Date().toLocaleString("fr-DZ"),
    }]);
  };

  const handleStatusChange = async(newFR)=>{
    const old=status; setStatus(newFR); setSavingStatus(true);
    try {
      await fetch(`http://localhost:3001/api/tickets/${id}/status`,{
        method:"PUT", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({status:STATUS_EN[newFR]}),
      });
      addTimeline("status",`Statut : <strong>${old}</strong> → <strong>${newFR}</strong>`);
    } catch{ setStatus(old); }
    finally{ setSavingStatus(false); }
  };

  const handleSend=()=>{
    const msg   = activeTab==="solution"?solution:infoMsg;
    const files = activeTab==="solution"?solutionFiles:infoFiles;
    if(!msg.trim()&&files.length===0) return;
    addTimeline(activeTab,msg,files);
    if(activeTab==="info"     &&status!=="En attente") handleStatusChange("En attente");
    if(activeTab==="solution" &&status!=="Résolu")     handleStatusChange("Résolu");
    setSent(true); setTimeout(()=>setSent(false),3000);
    setSolution(""); setInfoMsg(""); setSolutionFiles([]); setInfoFiles([]);
  };

  const handleRedirect=async()=>{
    if(!redirectCategory||!redirectService) return;
    setRedirecting(true);
    try {
      const note = redirectNote ? `<br/><em>Note : ${redirectNote}</em>` : "";
      addTimeline("redirect",`Redirigé → service <strong>${redirectService}</strong> / catégorie <strong>${redirectCategory}</strong>${note}`);
      alert(`Ticket redirigé vers "${redirectService}" (${redirectCategory})`);
      setRedirectCategory(""); setRedirectService(""); setRedirectNote("");
    } finally { setRedirecting(false); }
  };

  if(loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
        <p className="text-sm text-gray-500">Chargement du ticket...</p>
      </div>
    </div>
  );
  if(error)   return <div className="p-6 text-red-500 flex items-center gap-2"><AlertTriangle size={16}/>Erreur : {error}</div>;
  if(!ticket) return <div className="p-6 text-gray-400">Ticket introuvable.</div>;

  const emp = ticket.employee||{};
  const ini = `${emp.name?.[0]||"?"}${emp.surname?.[0]||""}`;
  const sla = ticket.createdAt ? getSLAInfo(ticket.createdAt,ticket.priority) : null;

  return (
    <div className="min-h-screen bg-gray-50 p-5">
      <div className="max-w-7xl mx-auto flex flex-col gap-5">

        {/* Breadcrumb + Prev/Next */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={()=>navigate("/technician/tickets-assignes")}
              className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition bg-transparent border-none cursor-pointer p-0 font-medium">
              <ArrowLeft size={15}/> Tickets Assignés
            </button>
            <ChevronRight size={13} className="text-gray-300"/>
            <span className="text-gray-800 font-semibold truncate max-w-xs sm:max-w-md">T n°{ticket.id} — {ticket.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button disabled={!prevId} onClick={()=>navigate(`/technician/tickets-service/${prevId}`)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
              <ChevronLeft size={13}/> Précédent
            </button>
            {idx>=0&&<span className="text-xs text-gray-400 font-mono">{idx+1}/{allIds.length}</span>}
            <button disabled={!nextId} onClick={()=>navigate(`/technician/tickets-service/${nextId}`)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
              Suivant <ChevronRight size={13}/>
            </button>
          </div>
        </div>

        {/* Employé + Ticket */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">

          {/* Employé 2/5 */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <User size={12}/> Informations Employé
            </h2>
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white text-base font-bold flex items-center justify-center shrink-0 shadow-sm">{ini}</div>
              <div>
                <p className="text-sm font-bold text-gray-900">{emp.name} {emp.surname}</p>
                <p className="text-[11px] text-blue-600 font-medium mt-0.5">{emp.role||"N/A"}</p>
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              {[
                {Icon:Mail,      label:"Email",          value:emp.email},
                {Icon:Building2, label:"Département",    value:emp.department},
                {Icon:Briefcase, label:"Titre du poste", value:emp.job_title||emp.role},
                {Icon:Phone,     label:"Numéro",         value:emp.phone||emp.numero||"N/A"},
                {Icon:DoorOpen,  label:"Bureau",         value:emp.office||emp.bureau||"N/A"},
              ].map(f=>(
                <div key={f.label} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    <f.Icon size={12} className="text-gray-400"/>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{f.label}</p>
                    <p className="text-[12px] text-gray-800 font-medium mt-0.5">{f.value||"N/A"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket 3/5 */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 font-mono mb-0.5">#{ticket.id}</p>
                <h1 className="text-base font-bold text-gray-900 leading-snug">{ticket.title}</h1>
              </div>
              <span className={`text-[11px] font-semibold px-3 py-1 rounded-full shrink-0 ${STATUS_CLASS[status]||"bg-gray-100 text-gray-600"}`}>{status}</span>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Description</p>
              <p className="text-[13px] text-gray-700 leading-relaxed">{ticket.description||"Aucune description."}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                {Icon:AlertTriangle,label:"Priorité",   custom:<span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${PRIORITY_CLASS[ticket.priority]||"bg-gray-100 text-gray-500"}`}>{ticket.priority||"N/A"}</span>},
                {Icon:Tag,      label:"Catégorie",   value:ticket.category},
                {Icon:Layers,   label:"Service",     value:ticket.service||"N/A"},
                {Icon:Zap,      label:"Impact",      value:ticket.impact||"N/A"},
                {Icon:AlertTriangle,label:"Urgence", value:ticket.urgency||ticket.urgence||"N/A"},
                {Icon:Info,     label:"Type",        value:ticket.type||"Incident"},
                {Icon:User,     label:"Assigné par", value:ticket.assigned_by||"Auto / Manager"},
                {Icon:Calendar, label:"Créé le",     value:ticket.createdAt?new Date(ticket.createdAt).toLocaleDateString("fr-DZ"):"N/A"},
              ].map(f=>(
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
            {sla&&(
              <div className={`rounded-xl p-3 border ${sla.expired?"bg-red-50 border-red-200":"bg-emerald-50 border-emerald-200"}`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className={sla.expired?"text-red-500":"text-emerald-600"}/>
                    <p className="text-[11px] font-bold text-gray-700">SLA</p>
                  </div>
                  <span className={`text-[11px] font-bold ${sla.expired?"text-red-600":"text-emerald-700"}`}>
                    {sla.expired?`⚠ Dépassé de ${sla.diffH}h ${sla.diffM}m`:`${sla.diffH}h ${sla.diffM}m restants`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1.5">
                  <div className={`h-1.5 rounded-full transition-all ${sla.pct>50?"bg-emerald-500":sla.pct>20?"bg-amber-500":"bg-red-500"}`} style={{width:`${sla.pct}%`}}/>
                </div>
                <p className="text-[10px] text-gray-400">Limite : {sla.deadline.toLocaleString("fr-DZ")} · SLA : {sla.hours}h</p>
              </div>
            )}

            {/* Statut */}
            <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-gray-100">
              <label className="text-[11px] text-gray-400 font-medium flex items-center gap-1"><Clock size={11}/> Statut :</label>
              <select value={status} onChange={e=>handleStatusChange(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 cursor-pointer focus:outline-none focus:border-blue-400">
                {STATUTS_FR.map(s=><option key={s}>{s}</option>)}
              </select>
              {savingStatus&&<span className="text-[10px] text-gray-400 animate-pulse flex items-center gap-1"><Circle size={8} className="animate-spin"/>Sauvegarde...</span>}
              {ticket.status!=="resolved"&&ticket.status!=="closed"&&(
                <button onClick={()=>handleStatusChange("En cours")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition">
                  <CheckCircle2 size={13}/> Prendre en charge
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Actions + Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Tabs 3/5 */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-100 bg-gray-50">
              {[
                {id:"solution", label:"Solution",     Icon:CheckCircle2},
                {id:"info",     label:"Demande info",  Icon:MessageSquare},
                {id:"redirect", label:"Rediriger",     Icon:Forward},
              ].map(tab=>(
                <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-semibold border-b-2 transition-all bg-transparent cursor-pointer
                    ${activeTab===tab.id?"text-blue-700 border-blue-600 bg-white":"text-gray-500 border-transparent hover:text-gray-700"}`}>
                  <tab.Icon size={13}/>{tab.label}
                </button>
              ))}
            </div>

            <div className="p-5 flex flex-col gap-4">
              {sent&&(
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-[12px] text-green-700">
                  <CheckCircle2 size={14}/> Message envoyé avec succès !
                </div>
              )}

              {activeTab==="solution"&&(<>
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-[11px] text-blue-700">
                  <Info size={13} className="shrink-0 mt-0.5"/> Envoyer une solution marquera le ticket comme <strong className="ml-1">Résolu</strong>.
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">Solution pour {emp.name} {emp.surname}</label>
                  <RichTextArea value={solution} onChange={setSolution} placeholder="Décrivez la solution ici..." rows={6}/>
                </div>
                <FileAttachment files={solutionFiles} onAdd={f=>setSolutionFiles(p=>[...p,...f])} onRemove={i=>setSolutionFiles(p=>p.filter((_,x)=>x!==i))}/>
                <button onClick={handleSend} disabled={!solution.trim()&&solutionFiles.length===0}
                  className="self-start flex items-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  <Send size={13}/> Envoyer la solution
                </button>
              </>)}

              {activeTab==="info"&&(<>
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[11px] text-amber-700">
                  <Info size={13} className="shrink-0 mt-0.5"/> Demander une info passera le ticket en <strong className="ml-1">En attente</strong>.
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">Demande à {emp.name} {emp.surname}</label>
                  <RichTextArea value={infoMsg} onChange={setInfoMsg} placeholder="Posez votre question ici..." rows={6}/>
                </div>
                <FileAttachment files={infoFiles} onAdd={f=>setInfoFiles(p=>[...p,...f])} onRemove={i=>setInfoFiles(p=>p.filter((_,x)=>x!==i))}/>
                <button onClick={handleSend} disabled={!infoMsg.trim()&&infoFiles.length===0}
                  className="self-start flex items-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  <Send size={13}/> Envoyer la demande
                </button>
              </>)}

              {activeTab==="redirect"&&(<>
                <div className="flex items-start gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 text-[11px] text-purple-700">
                  <Forward size={13} className="shrink-0 mt-0.5"/> Sélectionnez la catégorie et le service vers lesquels rediriger ce ticket.
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <Tag size={12} className="text-gray-400"/> Catégorie <span className="text-red-500">*</span>
                  </label>
                  <select value={redirectCategory} onChange={e=>setRedirectCategory(e.target.value)}
                    className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:border-purple-400 cursor-pointer">
                    <option value="">Choisir une catégorie...</option>
                    {CATEGORIES_MOCK.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <Layers size={12} className="text-gray-400"/> Service <span className="text-red-500">*</span>
                  </label>
                  <select value={redirectService} onChange={e=>setRedirectService(e.target.value)}
                    className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:border-purple-400 cursor-pointer">
                    <option value="">Choisir un service...</option>
                    {SERVICES_MOCK.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <MessageSquare size={12} className="text-gray-400"/> Note de redirection
                    <span className="text-gray-400 font-normal">(optionnel)</span>
                  </label>
                  <textarea rows={3} value={redirectNote} onChange={e=>setRedirectNote(e.target.value)}
                    placeholder="Expliquez la raison de la redirection..."
                    className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 resize-none focus:outline-none focus:border-purple-400 leading-relaxed"/>
                </div>

                <button onClick={handleRedirect} disabled={!redirectCategory||!redirectService||redirecting}
                  className="self-start flex items-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  <Forward size={13}/> {redirecting?"Redirection...":"Rediriger le ticket"}
                </button>
              </>)}
            </div>
          </div>

          {/* Timeline 2/5 */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={12}/> Activité
              </h2>
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                {timeline.length} événement{timeline.length!==1?"s":""}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[440px] pr-1">
              {timeline.length===0?(
                <div className="flex flex-col items-center justify-center h-36 text-center">
                  <Activity size={28} className="text-gray-200 mb-3"/>
                  <p className="text-[12px] text-gray-400 font-medium">Aucune activité</p>
                  <p className="text-[11px] text-gray-300 mt-1">Les actions apparaîtront ici.</p>
                </div>
              ):(
                <div className="pt-1">{timeline.map(item=><TimelineItem key={item.id} item={item}/>)}</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}