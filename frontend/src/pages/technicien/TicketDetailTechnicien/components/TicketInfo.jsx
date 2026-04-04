import { 
  User, Mail, Building2, Briefcase, Phone, DoorOpen, Hash, 
  Tag, Layers, AlertTriangle, FileText, Calendar, Clock 
} from "lucide-react";
import UserTooltip from "./utils/UserTooltip";
import { PRIORITY_CLASS, PRIORITY_FR, IMPACT_FR, URGENCY_FR, CATEGORY_FR, TYPE_FR, STATUS_CLASS, STATUS_FR } from "./constants";

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

export default function TicketInfo({ 
  ticket, 
  status, 
  savingStatus, 
  isClosed, 
  handleStatusChange,
  currentUser 
}) {
  const emp = ticket.employee ?? {};
  const ini = `${emp.name?.[0] ?? "?"} ${emp.surname?.[0] ?? ""}`;
  const empName = `${emp.name ?? ""} ${emp.surname ?? ""}`.trim();
  const sla = ticket.createdAt ? getSLAInfo(ticket.createdAt, ticket.priority, ticket.sla_due_date) : null;
  const fmtDate = (d) => new Date(d).toLocaleDateString("fr-DZ");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
      {/* Employee card */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <User size={12}/> Informations Employé
        </h2>
        <UserTooltip user={emp}>
          <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 cursor-default">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white text-base font-bold flex items-center justify-center shrink-0 shadow-sm">
              {ini}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{emp.name} {emp.surname}</p>
              <p className="text-[11px] text-blue-600 font-medium mt-0.5">
                {emp.job_title ?? emp.role ?? "N/A"}
              </p>
            </div>
          </div>
        </UserTooltip>
        <div className="flex flex-col gap-0.5">
          {[
            { Icon:Hash, label:"ID", value:emp.id },
            { Icon:Mail, label:"Email", value:emp.email },
            { Icon:Building2, label:"Département", value:emp.department },
            { Icon:Briefcase, label:"Titre du poste", value:emp.job_title },
            { Icon:Phone, label:"Numéro", value:emp.phone },
            { Icon:Building2, label:"Block", value:emp.block_number || emp.block || "N/A" },
            { Icon:DoorOpen, label:"Bureau", value:emp.office },
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
            { Icon:Tag, label:"Catégorie", value: CATEGORY_FR[ticket.category] ?? ticket.category },
            { Icon:Layers, label:"Service", value: ticket.service ?? "N/A" },
            { Icon:AlertTriangle, label:"Impact", value: IMPACT_FR[ticket.impact] ?? ticket.impact ?? "N/A" },
            { Icon:AlertTriangle, label:"Urgence", value: URGENCY_FR[ticket.urgency] ?? ticket.urgency ?? "N/A" },
            { Icon:FileText, label:"Type", value: TYPE_FR[ticket.type] ?? ticket.type ?? "Incident" },
            { Icon:User, label:"Assigné par", custom: ticket.assignedBy
                ? ticket.assignedBy.type === "auto"
                  ? <span className="text-[12px] font-semibold text-gray-500 italic">Auto / Système</span>
                  : <UserTooltip user={ticket.assignedBy}>
                      <span className="text-[12px] font-semibold text-blue-700 cursor-default underline decoration-dotted">{ticket.assignedBy.label}</span>
                    </UserTooltip>
                : null },
            { Icon:Calendar, label:"Créé le", value: ticket.createdAt ? fmtDate(ticket.createdAt) : "N/A" },
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
            <p className="text-[10px] text-gray-400">
              Limite : {sla.deadline.toLocaleString("fr-DZ")} · SLA : {sla.hours}h
            </p>
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
            <select 
              value={status} 
              onChange={e => handleStatusChange(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 cursor-pointer focus:outline-none focus:border-blue-400"
            >
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
  );
}