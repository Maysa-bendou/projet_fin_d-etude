import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { AlertTriangle, Loader, Clock, LayoutGrid, UserCheck, ArrowUpRight } from "lucide-react";

const MOCK = {
  type: "technician",
  stats: { overdue: 3, inProgress: 7, pending: 4, total: 18 },
  charts: {
    priorityData: [
      { name: "Haute",   key: "high",   value: 6 },
      { name: "Moyenne", key: "medium", value: 7 },
      { name: "Faible",  key: "low",    value: 2 },
    ],
    categoryData: [
      { name: "Matériel", value: 5 },
      { name: "Logiciel", value: 8 },
      { name: "Réseau",   value: 3 },
      { name: "Compte",   value: 2 },
    ],
    statusTimelineData: [
      { name: "Jan", 'Tickets': 4,  'Résolu': 1 },
      { name: "Fév", 'Tickets': 7,  'Résolu': 3 },
      { name: "Mar", 'Tickets': 5,  'Résolu': 5 },
      { name: "Avr", 'Tickets': 10, 'Résolu': 4 },
    ],
  },
  recentActivities: [
    { ticketId: 142, ticketTitle: "VPN ne fonctionne plus",  priority: "high",     status: "in_progress", assigned_at: new Date(Date.now()-300000),    lastActivity: { type: "solution", label: "Solution envoyée",      date: new Date(Date.now()-120000)   } },
    { ticketId: 139, ticketTitle: "Imprimante bureau 3",     priority: "medium",   status: "open",        assigned_at: new Date(Date.now()-3600000),   lastActivity: { type: "assigned", label: "Ticket assigné",        date: new Date(Date.now()-3600000)  } },
    { ticketId: 135, ticketTitle: "Accès SharePoint refusé", priority: "low",      status: "open",        assigned_at: new Date(Date.now()-7200000),   lastActivity: { type: "confirm",  label: "Confirmation demandée", date: new Date(Date.now()-5000000)  } },
    { ticketId: 128, ticketTitle: "PC ne démarre pas",       priority: "critical", status: "in_progress", assigned_at: new Date(Date.now()-86400000),  lastActivity: { type: "status",   label: "Statut mis à jour",     date: new Date(Date.now()-80000000) } },
    { ticketId: 120, ticketTitle: "Mise à jour bloquée",     priority: "medium",   status: "open",        assigned_at: new Date(Date.now()-172800000), lastActivity: { type: "info",     label: "Info demandée",         date: new Date(Date.now()-170000000)} },
  ],
};

// ── colors/styles — never translated, purely visual ──
const PRIO_STYLE = {
  high:     { c: "#f97316", bg: "#fff7ed" },
  medium:   { c: "#eab308", bg: "#fefce8" },
  low:      { c: "#22c55e", bg: "#f0fdf4" },
  critical: { c: "#ef4444", bg: "#fef2f2" },
};
const STA_STYLE = {
  open:             { c: "#1d4ed8", bg: "#eff6ff" },
  in_progress:      { c: "#7c3aed", bg: "#f5f3ff" },
  pending:          { c: "#a16207", bg: "#fefce8" },
  pending_supplier: { c: "#c2410c", bg: "#fff7ed" },
  resolved:         { c: "#15803d", bg: "#f0fdf4" },
};
const ACT_COLOR  = { assigned: "#3b82f6", confirm: "#8b5cf6", solution: "#10b981", info: "#f97316", status: "#94a3b8", reopen: "#ef4444" };
const CAT_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f97316", "#ef4444"];

// ── Ring SVG ──
const Ring = ({ pct, color, size = 76, sw = 7 }) => {
  const r = (size - sw) / 2, circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - Math.min(pct, 1))}
        style={{ transition: "stroke-dashoffset .9s cubic-bezier(.4,0,.2,1)" }}/>
    </svg>
  );
};

// ── Spark chart ──
const Spark = ({ data, labels }) => {
  const [hovered, setHovered] = useState(null);
  if (!data.length) return null;
  const w = 120, h = 50, n = data.length;
  const pts = data.map(m => ({
    assigned: m['Tickets'] || m['assigned'] || 0,
    resolved: m['Résolu']  || m['resolved'] || 0,
    rest: Math.max(0, (m['Tickets'] || m['assigned'] || 0) - (m['Résolu'] || m['resolved'] || 0)),
  }));
  const maxVal = Math.max(...pts.map(p => p.assigned), 1);
  const x = i => (i / (n - 1 || 1)) * w;
  const y = v => h - (v / maxVal) * (h - 6);
  const polyline = (key, color) => {
    const d = pts.map((p, i) => `${x(i)},${y(p[key])}`).join(" ");
    return <polyline fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" points={d}/>;
  };

  return (
    <div style={{ position: "relative" }}>
      <svg width="100%" viewBox={`0 0 ${w} ${h + 16}`} style={{ overflow: "visible" }}>
        {[0, .5, 1].map(t => (
          <line key={t} x1={0} y1={y(maxVal * t)} x2={w} y2={y(maxVal * t)} stroke="#f1f5f9" strokeWidth={1}/>
        ))}
        {polyline("assigned", "#6366f1")}
        {polyline("resolved", "#10b981")}
        {polyline("rest",     "#f59e0b")}
        {pts.map((p, i) => (
          <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: "default" }}>
            <rect x={x(i)-6} y={0} width={12} height={h+16} fill="transparent"/>
            {[["assigned","#6366f1"],["resolved","#10b981"],["rest","#f59e0b"]].map(([k,c]) => (
              <circle key={k} cx={x(i)} cy={y(p[k])} r={hovered===i ? 4 : 2.5}
                fill={c} stroke="#fff" strokeWidth={1.5} style={{ transition: "r .1s" }}/>
            ))}
            <text x={x(i)} y={h+13} textAnchor="middle" fontSize={7} fontWeight="700" fill="#94a3b8">
              {data[i].name}
            </text>
          </g>
        ))}
      </svg>
      {hovered !== null && (() => {
        const p = pts[hovered], m = data[hovered];
        const lp = Math.min(Math.max((hovered/(n-1||1))*100, 10), 85);
        return (
          <div style={{ position:"absolute", bottom:"calc(100% + 4px)", left:`${lp}%`,
            transform:"translateX(-50%)", background:"#0f172a", borderRadius:8,
            padding:"8px 12px", fontSize:11, color:"#f1f5f9", whiteSpace:"nowrap",
            boxShadow:"0 4px 16px #0003", pointerEvents:"none", zIndex:10 }}>
            <p style={{ margin:"0 0 5px", fontWeight:700, color:"#94a3b8", fontSize:10 }}>{m.name}</p>
            <p style={{ margin:"0 0 2px" }}><span style={{ color:"#818cf8" }}>●</span> {labels.assigned} : <b>{p.assigned}</b></p>
            <p style={{ margin:"0 0 2px" }}><span style={{ color:"#34d399" }}>●</span> {labels.resolved} : <b>{p.resolved}</b></p>
            <p style={{ margin:0, borderTop:"1px solid #1e293b", paddingTop:4 }}>
              <span style={{ color:"#fbbf24" }}>●</span> {labels.remaining} : <b>{p.rest}</b>
            </p>
          </div>
        );
      })()}
    </div>
  );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  @keyframes up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .c{animation:up .45s ease both}
  .row:hover{background:#faf8f5!important}
`;

// ── category key map: backend sends French names in mock, real API sends keys ──
const CAT_KEY_MAP = {
  "Matériel": "hardware", "Logiciel": "software", "Réseau": "network",
  "Compte": "access", "Accès": "access", "Sécurité": "security", "Messagerie": "messagerie",
};

export default function AccueilTechnicien() {
  const navigate              = useNavigate();
  // FIX 1: load both namespaces + i18n for currentLang re-render trigger
  const { t, i18n }           = useTranslation(['technicien', 'common']);
  const currentLang           = i18n.language;
  const [d, setD]             = useState(null);
  const [load, setLoad]       = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get("https://ticket-backend-4uw2.onrender.com/api/accueil/dashboard", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.data.type === "technician" && setD(r.data))
      .catch(() => setD(MOCK))
      .finally(() => setLoad(false));
  }, []);

  if (load) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#faf9f7", color:"#94a3b8", fontFamily:"Plus Jakarta Sans,sans-serif", gap:10 }}>
      <style>{css}</style>
      <Loader size={16} style={{ animation:"spin 1s linear infinite" }}/> {t('accueilTech.loading')}
    </div>
  );

  const { stats, charts, recentActivities } = d || MOCK;
  const maxCat = Math.max(...(charts.categoryData?.map(c => c.value) || [1]));
  const totalP = charts.priorityData?.reduce((s, p) => s + p.value, 0) || 1;

  const top5 = [...(recentActivities || [])]
    .sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at))
    .slice(0, 5);

  // timeAgo — unchanged logic, uses translation keys
  const timeAgo = (dateVal) => {
    const s = (Date.now() - new Date(dateVal)) / 1000;
    if (s < 60)    return t('accueilTech.timeAgo.justNow');
    if (s < 3600)  return `${Math.floor(s / 60)} min`;
    if (s < 86400) return `${Math.floor(s / 3600)} h`;
    return `${Math.floor(s / 86400)} ${t('accueilTech.timeAgo.days')}`;
  };

  // FIX 2: priority labels from common namespace
  const prioLabel = (key) => {
    const map = {
      high:     t("priority.high",     { ns:"common" }),
      medium:   t("priority.medium",   { ns:"common" }),
      low:      t("priority.low",      { ns:"common" }),
      critical: t("priority.critical", { ns:"common" }),
    };
    return map[key] || key;
  };

  // FIX 3: status labels from common namespace
  const staLabel = (key) => {
    const map = {
      open:             t("status.open",            { ns:"common" }),
      in_progress:      t("status.in_progress",     { ns:"common" }),
      pending:          t("status.pending",          { ns:"common" }),
      pending_supplier: t("status.pending_supplier", { ns:"common" }),
      resolved:         t("status.resolved",         { ns:"common" }),
      closed:           t("status.closed",           { ns:"common" }),
      rejected:         t("status.rejected",         { ns:"common" }),
    };
    return map[key] || key;
  };

  // FIX 4: category labels from common namespace
  // backend/mock may send French display names — normalize to key first
  const catLabel = (nameOrKey) => {
    const key = CAT_KEY_MAP[nameOrKey] ?? nameOrKey;
    return t(`category.${key}`, { ns:"common", defaultValue: nameOrKey });
  };

  const MONTH_KEY_MAP = {
  "Jan":"january","Fév":"february","Mar":"march","Avr":"april",
  "Mai":"may","Juin":"june","Juil":"july","Aoû":"august",
  "Sep":"september","Oct":"october","Nov":"november","Déc":"december",
  "Feb":"february","Apr":"april","Jun":"june","Jul":"july",
  "Aug":"august","Dec":"december",
};

const translateMonthName = (name) => {
  const key = MONTH_KEY_MAP[name];
  if (!key) return name;
  return t(`date.months.${key}`, { ns:"common" }).slice(0, 3);
};

  // FIX 5: last activity labels from technicien namespace
  const activityLabel = (type, fallback) => {
    const map = {
      solution:  t('accueilTech.activity.solution'),
      assigned:  t('accueilTech.activity.assigned'),
      confirm:   t('accueilTech.activity.confirm'),
      status:    t('accueilTech.activity.status'),
      info:      t('accueilTech.activity.info'),
      reopen:    t('accueilTech.activity.reopen'),
      emp_reply: t('accueilTech.activity.emp_reply'),
    };
    return map[type] || fallback || type;
  };

const STATS = [
  { labelKey: 'accueilTech.stats.overdue',    val: stats.overdue,    Icon: AlertTriangle, c: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  { labelKey: 'accueilTech.stats.inProgress', val: stats.inProgress, Icon: Loader,        c: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { labelKey: 'accueilTech.stats.pending',    val: stats.pending,    Icon: Clock,         c: "#a16207", bg: "#fefce8", border: "#fde68a" },
  { labelKey: 'accueilTech.stats.activeTotal',val: stats.total,      Icon: LayoutGrid,    c: "#10b981", bg: "#f0fdf4", border: "#a7f3d0" },
];
  const sparkLabels = {
    assigned:  t('accueilTech.spark.assigned'),
    resolved:  t('accueilTech.spark.resolved'),
    remaining: t('accueilTech.spark.remaining'),
  };

  const tableHeaders = [
    t('accueilTech.table.id'),
    t('accueilTech.table.title_col'),
    t('accueilTech.table.priority'),
    t('accueilTech.table.status'),
    t('accueilTech.table.lastActivity'),
  ];

  // FIX 6: date locale from common namespace
  const dateLocale = t("date.locale", { ns:"common" });

  return (
    <div style={{ background:"#faf9f7", minHeight:"100vh", fontFamily:"sans-serif", color:"#0f172a" }}> <style>{css}</style>

      {/* Header */}
      <div style={{ borderBottom:"1px solid #e8e2d9", padding:"14px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <h1 style={{ margin:"0", fontSize:22, fontWeight:700, color:"#0f172a" }}>
            {t('accueilTech.header.title')}
          </h1>
          <p style={{ fontSize:14, color:"#53575c", margin:0, fontWeight:530 }}>
            {t('accueilTech.header.subtitle')}
          </p>
        </div>
        {/* FIX 6: use dateLocale instead of hardcoded "fr-FR" */}
        <div style={{ display:"flex", alignItems:"center", gap:6, background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"7px 14px", fontSize:11, fontWeight:600, color:"#64748b", boxShadow:"0 1px 3px #0001" }}>
          {new Date().toLocaleDateString(dateLocale, { weekday:"short", day:"numeric", month:"long" })}
        </div>
      </div>

      <div style={{ padding:"20px 28px" }}>
        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
          {STATS.map(({ labelKey, val, Icon, c, bg, border }, i) => (
            <div key={labelKey} className="c" style={{
              animationDelay: `${i * 0.07}s`,
              background: "#fff",
              border: `1.5px solid ${border}`,
              borderRadius: 16,
              padding: "18px 20px",
              boxShadow: `0 1px 3px #0001, inset 0 0 0 999px ${bg}30`,
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            }}>
              <div>
                <p style={{ margin:"0 0 10px", fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"1.5px" }}>
                  {t(labelKey)}
                </p>
                <p style={{ margin:0, fontSize:34, fontWeight:800, color:c, lineHeight:1 }}>{val}</p>
              </div>
              <div style={{ background:bg, border:`1.5px solid ${border}`, borderRadius:10, padding:8 }}>
                <Icon size={15} color={c}/>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16 }}>

          {/* Priority rings */}
          <div className="c" style={{ animationDelay:".1s", background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:16, padding:"20px", boxShadow:"0 1px 4px #0001" }}>
            <p style={{ margin:"0 0 16px", fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"2px" }}>
              {t('accueilTech.charts.priority')}
            </p>
            <div style={{ display:"flex", justifyContent:"space-around", marginBottom:16 }}>
              {charts.priorityData?.slice(0, 3).map(p => {
                const style = PRIO_STYLE[p.key] || { c:"#3b82f6", bg:"#eff6ff" };
                return (
                  <div key={p.key} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                    <div style={{ position:"relative" }}>
                      <Ring pct={p.value / totalP} color={style.c}/>
                      <span style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#0f172a" }}>{p.value}</span>
                    </div>
                    {/* FIX 2: translated priority label */}
                    <span style={{ fontSize:10, fontWeight:600, color:"#64748b" }}>{prioLabel(p.key)}</span>
                  </div>
                );
              })}
            </div>
            {charts.priorityData?.map(p => {
              const style = PRIO_STYLE[p.key] || { c:"#3b82f6" };
              return (
                <div key={p.key} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:style.c, flexShrink:0 }}/>
                  {/* FIX 2: translated priority label */}
                  <span style={{ fontSize:11, color:"#64748b", flex:1, fontWeight:500 }}>{prioLabel(p.key)}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:"#334155" }}>{Math.round(p.value / totalP * 100)}%</span>
                </div>
              );
            })}
          </div>

          {/* Categories */}
          <div className="c" style={{ animationDelay:".17s", background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:16, padding:"20px", boxShadow:"0 1px 4px #0001" }}>
            <p style={{ margin:"0 0 18px", fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"2px" }}>
              {t('accueilTech.charts.categories')}
            </p>
            {charts.categoryData?.map((cat, i) => (
              <div key={cat.name} style={{ marginBottom:13 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  {/* FIX 4: translated category label */}
                  <span style={{ fontSize:11, fontWeight:600, color:"#475569" }}>{catLabel(cat.name)}</span>
                  <span style={{ fontSize:11, fontWeight:800, color:"#0f172a" }}>{cat.value}</span>
                </div>
                <div style={{ height:6, borderRadius:99, background:"#f1f5f9" }}>
                  <div style={{
                    height:"100%", borderRadius:99,
                    width:`${(cat.value / maxCat) * 100}%`,
                    background:`linear-gradient(90deg,${CAT_COLORS[i%5]}99,${CAT_COLORS[i%5]})`,
                    transition:"width .8s ease",
                  }}/>
                </div>
              </div>
            ))}
          </div>

          {/* Spark chart */}
          <div className="c" style={{ animationDelay:".24s", background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:16, padding:"16px", boxShadow:"0 1px 4px #0001" }}>
            <p style={{ margin:"0 0 2px", fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"2px" }}>
              {t('accueilTech.charts.volumeTitle')}
            </p>
            <p style={{ margin:"0 0 10px", fontSize:10, color:"#cbd5e1", fontWeight:500 }}>
              {t('accueilTech.charts.volumeSubtitle', { year: new Date().getFullYear() })}
            </p>
            <div style={{ display:"flex", gap:10, marginBottom:12 }}>
              {[
                { c:"#6366f1", l: t('accueilTech.spark.assigned')  },
                { c:"#10b981", l: t('accueilTech.spark.resolved')  },
                { c:"#f59e0b", l: t('accueilTech.spark.remaining') },
              ].map(({ c, l }) => (
                <div key={l} style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <div style={{ width:12, height:3, borderRadius:2, background:c }}/>
                  <span style={{ fontSize:9, color:"#94a3b8", fontWeight:600 }}>{l}</span>
                </div>
              ))}
            </div>
            <Spark
  data={(charts.statusTimelineData || []).map(m => ({
    ...m,
    name: translateMonthName(m.name),
  }))}
  labels={sparkLabels}
/>
          </div>
        </div>

        {/* Recent tickets table */}
        <div className="c" style={{ animationDelay:".3s", background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:16, overflow:"hidden", boxShadow:"0 1px 4px #0001" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px", borderBottom:"1.5px solid #f1f5f9" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ background:"#eff6ff", border:"1.5px solid #bfdbfe", borderRadius:8, padding:6 }}>
                <UserCheck size={13} color="#3b82f6"/>
              </div>
              <p style={{ margin:0, fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"2px" }}>
                {t('accueilTech.table.title')}
              </p>
            </div>
            <span style={{ fontSize:10, fontWeight:700, background:"#f1f5f9", color:"#64748b", borderRadius:20, padding:"3px 10px" }}>
              5 tickets
            </span>
          </div>

          {/* Table headers */}
          <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 90px 100px 1fr", padding:"8px 20px", background:"#faf9f7", borderBottom:"1px solid #f1f5f9" }}>
            {tableHeaders.map(h => (
              <span key={h} style={{ fontSize:9, fontWeight:700, color:"#cbd5e1", textTransform:"uppercase", letterSpacing:"1px" }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {top5.map((a, i) => {
            const pStyle = PRIO_STYLE[a.priority] || { c:"#94a3b8", bg:"#f1f5f9" };
            const sStyle = STA_STYLE[a.status]    || { c:"#64748b", bg:"#f1f5f9" };
            const ac     = ACT_COLOR[a.lastActivity?.type] || "#94a3b8";
            return (
              <div key={a.ticketId} className="row"
                onClick={() => navigate(`/technician/ticket-technicien/${a.ticketId}`)}
                style={{ display:"grid", gridTemplateColumns:"40px 1fr 90px 100px 1fr", padding:"11px 20px",
                  borderBottom: i < top5.length - 1 ? "1px solid #f8fafc" : "none",
                  alignItems:"center", background:"#fff", transition:"background .15s", cursor:"pointer" }}>

                <span style={{ fontSize:11, fontWeight:700, color:"#cbd5e1" }}>#{a.ticketId}</span>

                <div style={{ display:"flex", alignItems:"center", gap:6, minWidth:0, paddingRight:12 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:"#1e293b", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {a.ticketTitle}
                  </span>
                  <ArrowUpRight size={11} color="#cbd5e1" style={{ flexShrink:0 }}/>
                </div>

                {/* FIX 2: translated priority */}
                <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:6, background:pStyle.bg, color:pStyle.c, width:"fit-content" }}>
                  {prioLabel(a.priority)}
                </span>

                {/* FIX 3: translated status */}
                <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:6, background:sStyle.bg, color:sStyle.c, width:"fit-content" }}>
                  {staLabel(a.status)}
                </span>

                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:ac, flexShrink:0 }}/>
                  {/* FIX 5: translated activity label */}
                  <span style={{ fontSize:11, color:"#64748b", fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {activityLabel(a.lastActivity?.type, a.lastActivity?.label)}
                  </span>
                  <span style={{ fontSize:10, color:"#cbd5e1", fontWeight:600, flexShrink:0, marginLeft:4 }}>
                    {timeAgo(a.lastActivity?.date)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
