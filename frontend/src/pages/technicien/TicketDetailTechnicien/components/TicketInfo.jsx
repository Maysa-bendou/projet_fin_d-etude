import {
  User, Mail, Building2, Briefcase, Phone, DoorOpen, Hash,
  Tag, Layers, AlertTriangle, FileText, Calendar, Clock, Lock, Circle
} from "lucide-react";
import UserTooltip from "./utils/UserTooltip";
import { PRIORITY_CLASS, PRIORITY_FR, IMPACT_FR, URGENCY_FR, CATEGORY_FR, TYPE_FR, STATUS_CLASS, STATUS_FR } from "./constants";

const PRIORITY_STYLE = {
  critical: { color: "#A32D2D", bg: "#FCEBEB" },
  high:     { color: "#854F0B", bg: "#FAEEDA" },
  medium:   { color: "#185FA5", bg: "#E6F1FB" },
  low:      { color: "#3B6D11", bg: "#EAF3DE" },
};

const STATUS_STYLE = {
  open:             { color: "#185FA5", bg: "#E6F1FB" },
  in_progress:      { color: "#854F0B", bg: "#FAEEDA" },
  pending:          { color: "#6b7280", bg: "#f3f4f6" },
  pending_supplier: { color: "#0F6E56", bg: "#E1F5EE" },
  resolved:         { color: "#3B6D11", bg: "#EAF3DE" },
  closed:           { color: "#3B6D11", bg: "#EAF3DE" },
  rejected:         { color: "#A32D2D", bg: "#FCEBEB" },
};

function getSLAInfo(slaDateLimite, slaDateDebut) {
  if (!slaDateLimite) return null;
  const deadline = new Date(slaDateLimite);
  const debut = slaDateDebut ? new Date(slaDateDebut) : null;
  const ms = deadline - new Date();
  const totalMs = debut ? deadline - debut : 24 * 3600000;
  return {
    deadline,
    diffH:   Math.floor(Math.abs(ms) / 3600000),
    diffM:   Math.floor((Math.abs(ms) % 3600000) / 60000),
    pct:     Math.max(0, Math.min(100, (ms / totalMs) * 100)),
    expired: ms < 0,
  };
}

export default function TicketInfo({ ticket, status, savingStatus, isClosed, handleStatusChange, currentUser }) {
  const emp = ticket.employee ?? {};
  const ini = `${emp.name?.[0] ?? "?"}${emp.surname?.[0] ?? ""}`;
  const empName = `${emp.name ?? ""} ${emp.surname ?? ""}`.trim();
  const sla = getSLAInfo(ticket.sla_date_limite, ticket.sla_date_debut);
  const fmtDate = (d) => new Date(d).toLocaleDateString("fr-DZ");
  const slaColor = sla ? (sla.expired ? "#dc2626" : sla.pct > 50 ? "#16a34a" : sla.pct > 20 ? "#d97706" : "#dc2626") : "#16a34a";
  const statusStyle = STATUS_STYLE[status] || { color: "#6b7280", bg: "#f3f4f6" };
  const priorityStyle = PRIORITY_STYLE[ticket.priority] || { color: "#6b7280", bg: "#f3f4f6" };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16, fontFamily: 'Inter, sans-serif' }}>

      {/* ── CARTE EMPLOYÉ ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={13} color="#9ca3af" />
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            Informations Employé
          </p>
        </div>

        {/* Avatar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <UserTooltip user={emp}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#eff6ff', border: '1px solid #dbeafe',
              borderRadius: 12, padding: '12px 16px', cursor: 'default'
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: '#3b82f6', color: '#fff',
                fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                {ini}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 2px 0' }}>{emp.name} {emp.surname}</p>
                <p style={{ fontSize: 12, color: '#3b82f6', fontWeight: 500, margin: 0 }}>{emp.job_title ?? emp.role ?? "N/A"}</p>
              </div>
            </div>
          </UserTooltip>
        </div>

        {/* Champs */}
        <div style={{ padding: '8px 20px 16px' }}>
          {[
            { Icon: Hash,      label: "ID",            value: emp.id },
            { Icon: Mail,      label: "Email",          value: emp.email },
            { Icon: Building2, label: "Département",    value: emp.department },
            { Icon: Briefcase, label: "Titre du poste", value: emp.job_title },
            { Icon: Phone,     label: "Numéro",         value: emp.phone },
            { Icon: Building2, label: "Block",          value: emp.block_number || emp.block || "N/A" },
            { Icon: DoorOpen,  label: "Bureau",         value: emp.office },
          ].map((f, i, arr) => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 0',
              borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none'
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <f.Icon size={12} color="#9ca3af" />
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px 0' }}>{f.label}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#111827', margin: 0 }}>{f.value ?? "N/A"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CARTE TICKET ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>

        {/* Header ticket */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', margin: '0 0 3px 0' }}>#{ticket.id}</p>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.3 }}>{ticket.title}</h1>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99,
            background: statusStyle.bg, color: statusStyle.color,
            border: `1px solid ${statusStyle.color}30`, whiteSpace: 'nowrap', flexShrink: 0
          }}>
            {STATUS_FR[status] ?? status}
          </span>
        </div>

        {/* Description */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px 0' }}>Description</p>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
            {ticket.description ?? "Aucune description."}
          </div>
        </div>

        {/* Specs — inner card avec header beige */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9f6f2', borderBottom: '1px solid #e8e4de' }}>
                  {['Priorité', 'Catégorie', 'Service', 'Impact', 'Urgence', 'Type', 'Assigné par', 'Créé le'].map((col, i) => (
                    <th key={i} style={{ padding: '9px 12px', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', whiteSpace: 'nowrap' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: priorityStyle.bg, color: priorityStyle.color }}>
                      {PRIORITY_FR[ticket.priority] ?? ticket.priority ?? "N/A"}
                    </span>
                  </td>
                  <td style={{ padding: '12px 12px', fontSize: 12, color: '#374151', fontWeight: 500 }}>{CATEGORY_FR[ticket.category] ?? ticket.category ?? "N/A"}</td>
                  <td style={{ padding: '12px 12px', fontSize: 12, color: '#374151', fontWeight: 500 }}>{ticket.service ?? "N/A"}</td>
                  <td style={{ padding: '12px 12px', fontSize: 12, color: '#374151', fontWeight: 500 }}>{IMPACT_FR[ticket.impact] ?? ticket.impact ?? "N/A"}</td>
                  <td style={{ padding: '12px 12px', fontSize: 12, color: '#374151', fontWeight: 500 }}>{URGENCY_FR[ticket.urgency] ?? ticket.urgency ?? "N/A"}</td>
                  <td style={{ padding: '12px 12px', fontSize: 12, color: '#374151', fontWeight: 500 }}>{TYPE_FR[ticket.type] ?? ticket.type ?? "Incident"}</td>
                  <td style={{ padding: '12px 12px' }}>
                    {ticket.assignedBy ? (
                      ticket.assignedBy.type === "auto"
                        ? <span style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>Auto / Système</span>
                        : <UserTooltip user={ticket.assignedBy}>
                            <span style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600, cursor: 'default', textDecoration: 'underline dotted' }}>{ticket.assignedBy.label}</span>
                          </UserTooltip>
                    ) : <span style={{ fontSize: 12, color: '#9ca3af' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 12px', fontSize: 12, color: '#374151', fontWeight: 500 }}>{ticket.createdAt ? fmtDate(ticket.createdAt) : "N/A"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SLA */}
        {sla && (
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} color={slaColor} />
                <p style={{ fontSize: 11, fontWeight: 700, color: '#111827', margin: 0 }}>SLA</p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: slaColor }}>
                {sla.expired ? `⚠ Dépassé de ${sla.diffH}h ${sla.diffM}m` : `${sla.diffH}h ${sla.diffM}m restants`}
              </span>
            </div>
            <div style={{ background: '#f3f4f6', height: 5, borderRadius: 99, marginBottom: 6, overflow: 'hidden' }}>
              <div style={{ width: sla.expired ? '100%' : `${sla.pct}%`, background: slaColor, height: '100%', borderRadius: 99, transition: 'width 1s ease' }} />
            </div>
            <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>Limite : {sla.deadline.toLocaleString("fr-DZ")}</p>
          </div>
        )}

        {/* Sélecteur statut */}
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={12} color="#9ca3af" />
            <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>Statut :</span>
          </div>
          {isClosed ? (
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={12} /> Ticket fermé — statut verrouillé
            </span>
          ) : (
            <select
              value={status}
              onChange={e => handleStatusChange(e.target.value)}
              style={{
                fontSize: 12, padding: '6px 12px', borderRadius: 8,
                border: '1px solid #e5e7eb', background: '#f9fafb',
                color: '#111827', cursor: 'pointer', outline: 'none',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {Object.entries(STATUS_FR).map(([val, lbl]) => (
                <option key={val} value={val}>{lbl}</option>
              ))}
            </select>
          )}
          {savingStatus && (
            <span style={{ fontSize: 10, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Circle size={8} /> Sauvegarde...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
