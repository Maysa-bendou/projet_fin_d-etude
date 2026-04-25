import { useState, useEffect } from "react";import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AlertTriangle, Loader, Clock, LayoutGrid, UserCheck, ArrowUpRight, Flame } from "lucide-react";

const MOCK = {
  type: "technician",
  stats: { overdue: 3, inProgress: 7, pending: 4, total: 18 },
  charts: {
    priorityData: [
      { name:"Haute",    key:"high",    value:6 },
      { name:"Moyenne",  key:"medium",  value:7 },
      { name:"Faible",   key:"low",     value:2 },
    ],
    categoryData: [
      { name:"Matériel", value:5 },
      { name:"Logiciel", value:8 },
      { name:"Réseau",   value:3 },
      { name:"Compte",   value:2 },
    ],
    statusTimelineData: [
      { name:"Jan", 'Tickets':4,  'Résolu':1 },
      { name:"Fév", 'Tickets':7,  'Résolu':3 },
      { name:"Mar", 'Tickets':5,  'Résolu':5 },
      { name:"Avr", 'Tickets':10, 'Résolu':4 },
    ],
  },
  recentActivities: [
    { ticketId:142, ticketTitle:"VPN ne fonctionne plus",    priority:"high",     status:"in_progress", assigned_at: new Date(Date.now()-300000),    lastActivity:{ type:"solution",  label:"Solution envoyée",       date: new Date(Date.now()-120000) } },
    { ticketId:139, ticketTitle:"Imprimante bureau 3",       priority:"medium",   status:"open",        assigned_at: new Date(Date.now()-3600000),   lastActivity:{ type:"assigned",  label:"Ticket assigné",         date: new Date(Date.now()-3600000) } },
    { ticketId:135, ticketTitle:"Accès SharePoint refusé",   priority:"low",      status:"open",        assigned_at: new Date(Date.now()-7200000),   lastActivity:{ type:"confirm",   label:"Confirmation demandée",  date: new Date(Date.now()-5000000) } },
    { ticketId:128, ticketTitle:"PC ne démarre pas",         priority:"critical", status:"in_progress", assigned_at: new Date(Date.now()-86400000),  lastActivity:{ type:"status",    label:"Statut mis à jour",      date: new Date(Date.now()-80000000) } },
    { ticketId:120, ticketTitle:"Mise à jour bloquée",       priority:"medium",   status:"open",        assigned_at: new Date(Date.now()-172800000), lastActivity:{ type:"info",      label:"Info demandée",          date: new Date(Date.now()-170000000) } },
  ],
};

const timeAgo = (d) => {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60)    return "à l'instant";
  if (s < 3600)  return `${Math.floor(s/60)} min`;
  if (s < 86400) return `${Math.floor(s/3600)} h`;
  return `${Math.floor(s/86400)} j`;
};

const PRIO = {
  high:     { c:"#f97316", bg:"#fff7ed", l:"Haute" },
  medium:   { c:"#eab308", bg:"#fefce8", l:"Moyenne" },
  low:      { c:"#22c55e", bg:"#f0fdf4", l:"Faible" },
};
const STA = {
  open:             { c:"#3b82f6", bg:"#eff6ff", l:"Ouvert" },
  in_progress:      { c:"#10b981", bg:"#f0fdf4", l:"En cours" },
  pending:          { c:"#8b5cf6", bg:"#f5f3ff", l:"En attente" },
  pending_supplier: { c:"#f97316", bg:"#fff7ed", l:"Att. four." },
  resolved:         { c:"#6b7280", bg:"#f9fafb", l:"Résolu" },
};
const ACT_COLOR = { assigned:"#3b82f6", confirm:"#8b5cf6", solution:"#10b981", info:"#f97316", status:"#94a3b8", reopen:"#ef4444" };
const CAT_COLORS = ["#3b82f6","#8b5cf6","#10b981","#f97316","#ef4444"];

const Ring = ({ pct, color, size=76, sw=7 }) => {
  const r=(size-sw)/2, circ=2*Math.PI*r;
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-Math.min(pct,1))}
        style={{transition:"stroke-dashoffset .9s cubic-bezier(.4,0,.2,1)"}}/>
    </svg>
  );
};

const Spark = ({ data }) => {
  const [hovered, setHovered] = useState(null);
  if (!data.length) return null;
  const w = 120, h = 50;
  const n = data.length;
  const pts = data.map((m, i) => ({
  assigned: m['Tickets'] || m['assigned'] || 0,
  resolved: m['Résolu']  || m['resolved'] || 0,
  rest: Math.max(
    0,
    (m['Tickets'] || m['assigned'] || 0) -
    (m['Résolu'] || m['resolved'] || 0)
  ),
}));
  const maxVal = Math.max(...pts.map(p => p.assigned), 1);
  const x = i => (i / (n - 1 || 1)) * w;
  const y = v => h - (v / maxVal) * (h - 6);
  const polyline = (key, color) => {
    const d = pts.map((p, i) => `${x(i)},${y(p[key])}`).join(" ");
    return <polyline fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" points={d}/>;
  };

  return (
    <div style={{ position:"relative" }}>
      <svg width="100%" viewBox={`0 0 ${w} ${h + 16}`} style={{ overflow:"visible" }}>
        {/* grid lines */}
        {[0,.5,1].map(t => (
          <line key={t} x1={0} y1={y(maxVal*t)} x2={w} y2={y(maxVal*t)}
            stroke="#f1f5f9" strokeWidth={1}/>
        ))}
        {/* 3 lines */}
        {polyline("assigned","#6366f1")}
        {polyline("resolved","#10b981")}
        {polyline("rest","#f59e0b")}
        {/* dots + month labels */}
        {pts.map((p, i) => (
          <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor:"default" }}>
            <rect x={x(i)-6} y={0} width={12} height={h+16} fill="transparent"/>
            {[["assigned","#6366f1"],["resolved","#10b981"],["rest","#f59e0b"]].map(([k,c]) => (
              <circle key={k} cx={x(i)} cy={y(p[k])} r={hovered===i ? 4 : 2.5}
                fill={c} stroke="#fff" strokeWidth={1.5}
                style={{ transition:"r .1s" }}/>
            ))}
            <text x={x(i)} y={h+13} textAnchor="middle" fontSize={7} fontWeight="700" fill="#94a3b8">
              {data[i].name}
            </text>
          </g>
        ))}
      </svg>
      {/* Tooltip */}
      {hovered !== null && (() => {
        const p = pts[hovered], m = data[hovered];
        const lp = Math.min(Math.max((hovered/(n-1||1))*100, 10), 85);
        return (
          <div style={{ position:"absolute", bottom:"calc(100% + 4px)", left:`${lp}%`,
            transform:"translateX(-50%)", background:"#0f172a", borderRadius:8,
            padding:"8px 12px", fontSize:11, color:"#f1f5f9", whiteSpace:"nowrap",
            boxShadow:"0 4px 16px #0003", pointerEvents:"none", zIndex:10 }}>
            <p style={{ margin:"0 0 5px", fontWeight:700, color:"#94a3b8", fontSize:10 }}>{m.name}</p>
            <p style={{ margin:"0 0 2px" }}><span style={{ color:"#818cf8" }}>●</span> Assignés : <b>{p.assigned}</b></p>
            <p style={{ margin:"0 0 2px" }}><span style={{ color:"#34d399" }}>●</span> Résolus/Fermés : <b>{p.resolved}</b></p>
            <p style={{ margin:0, borderTop:"1px solid #1e293b", paddingTop:4 }}>
              <span style={{ color:"#fbbf24" }}>●</span> Restants : <b>{p.rest}</b>
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
  .row:hover{background:#f8fafc!important}
`;

export default function AccueilTechnicien() {
  const navigate        = useNavigate();
  const [d, setD]       = useState(null);
  const [load, setLoad] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("token");
    axios.get("http://localhost:3001/api/accueil/dashboard", { headers:{ Authorization:`Bearer ${t}` }})
      .then(r => r.data.type==="technician" && setD(r.data))
      .catch(()=> setD(MOCK))
      .finally(()=> setLoad(false));
  }, []);

  if (load) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#f8fafc",color:"#94a3b8",fontFamily:"Plus Jakarta Sans,sans-serif",gap:10}}>
      <style>{css}</style>
      <Loader size={16} style={{animation:"spin 1s linear infinite"}}/> Chargement…
    </div>
  );

  const { stats, charts, recentActivities } = d || MOCK;
  const maxCat  = Math.max(...(charts.categoryData?.map(c=>c.value)||[1]));
  const totalP  = charts.priorityData?.reduce((s,p)=>s+p.value,0)||1;

  // 5 tickets les plus récemment assignés uniquement
  const top5 = [...(recentActivities||[])]
    .sort((a,b)=> new Date(b.assigned_at)-new Date(a.assigned_at))
    .slice(0,5);

  const STATS = [
    { label:"En retard",   val:stats.overdue,    Icon:AlertTriangle, c:"#ef4444", bg:"#fef2f2", border:"#fecaca" },
    { label:"En cours",    val:stats.inProgress, Icon:Loader,        c:"#3b82f6", bg:"#eff6ff", border:"#bfdbfe" },
    { label:"En attente",  val:stats.pending,    Icon:Clock,         c:"#8b5cf6", bg:"#f5f3ff", border:"#ddd6fe" },
    { label:"Total actif", val:stats.total,      Icon:LayoutGrid,    c:"#10b981", bg:"#f0fdf4", border:"#a7f3d0" },
  ];

  return (
    <div style={{background:"#f8fafc",minHeight:"100vh",padding:"28px 32px",fontFamily:"'Plus Jakarta Sans',sans-serif",color:"#0f172a"}}>
      <style>{css}</style>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
        <div>
          <p style={{margin:0,fontSize:10,fontWeight:700,color:"#94a3b8",letterSpacing:"2px",textTransform:"uppercase"}}>
            Tableau de bord · Technicien
          </p>
          <h1 style={{margin:"3px 0 0",fontSize:22,fontWeight:800,color:"#0f172a",letterSpacing:"-0.5px"}}>
            Mes interventions
          </h1>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"7px 14px",fontSize:11,fontWeight:600,color:"#64748b",boxShadow:"0 1px 3px #0001"}}>
          {new Date().toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"long"})}
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {STATS.map(({label,val,Icon,c,bg,border},i)=>(
          <div key={label} className="c" style={{
            animationDelay:`${i*0.07}s`,
            background:"#fff",
            border:`1.5px solid ${border}`,
            borderRadius:16,
            padding:"18px 20px",
            boxShadow:`0 1px 3px #0001, inset 0 0 0 999px ${bg}30`,
            display:"flex",justifyContent:"space-between",alignItems:"flex-start",
          }}>
            <div>
              <p style={{margin:"0 0 10px",fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"1.5px"}}>{label}</p>
              <p style={{margin:0,fontSize:34,fontWeight:800,color:c,lineHeight:1}}>{val}</p>
            </div>
            <div style={{background:bg,border:`1.5px solid ${border}`,borderRadius:10,padding:8}}>
              <Icon size={15} color={c}/>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>

        {/* Priorité */}
        <div className="c" style={{animationDelay:".1s",background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:16,padding:"20px",boxShadow:"0 1px 4px #0001"}}>
          <p style={{margin:"0 0 16px",fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"2px"}}>Priorité · actifs</p>
          <div style={{display:"flex",justifyContent:"space-around",marginBottom:16}}>
            {charts.priorityData?.slice(0,3).map(p=>{
              const {c,l}=PRIO[p.key]||{c:"#3b82f6",l:p.name};
              return(
                <div key={p.name} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                  <div style={{position:"relative"}}>
                    <Ring pct={p.value/totalP} color={c}/>
                    <span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#0f172a"}}>{p.value}</span>
                  </div>
                  <span style={{fontSize:10,fontWeight:600,color:"#64748b"}}>{l}</span>
                </div>
              );
            })}
          </div>
          {charts.priorityData?.map(p=>{
            const {c,l}=PRIO[p.key]||{c:"#3b82f6",l:p.name};
            return(
              <div key={p.name} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:c,flexShrink:0}}/>
                <span style={{fontSize:11,color:"#64748b",flex:1,fontWeight:500}}>{l}</span>
                <span style={{fontSize:11,fontWeight:700,color:"#334155"}}>{Math.round(p.value/totalP*100)}%</span>
              </div>
            );
          })}
        </div>

        {/* Catégories */}
        <div className="c" style={{animationDelay:".17s",background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:16,padding:"20px",boxShadow:"0 1px 4px #0001"}}>
          <p style={{margin:"0 0 18px",fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"2px"}}>Catégories · service</p>
          {charts.categoryData?.map((cat,i)=>(
            <div key={cat.name} style={{marginBottom:13}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:11,fontWeight:600,color:"#475569"}}>{cat.name}</span>
                <span style={{fontSize:11,fontWeight:800,color:"#0f172a"}}>{cat.value}</span>
              </div>
              <div style={{height:6,borderRadius:99,background:"#f1f5f9"}}>
                <div style={{
                  height:"100%",borderRadius:99,
                  width:`${(cat.value/maxCat)*100}%`,
                  background:`linear-gradient(90deg,${CAT_COLORS[i%5]}99,${CAT_COLORS[i%5]})`,
                  transition:"width .8s ease",
                }}/>
              </div>
            </div>
          ))}
        </div>

        <div className="c" style={{animationDelay:".24s",background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:16,padding:"16px",boxShadow:"0 1px 4px #0001"}}>
          <p style={{margin:"0 0 2px",fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"2px"}}>Volume d'activité mensuel</p>
          <p style={{margin:"0 0 10px",fontSize:10,color:"#cbd5e1",fontWeight:500}}>Assignés vs résolus/fermés · {new Date().getFullYear()}</p>
          <div style={{display:"flex",gap:10,marginBottom:12}}>
            {[{c:"#6366f1",l:"Assignés"},{c:"#10b981",l:"Résolus/Fermés"},{c:"#f59e0b",l:"Restants"}].map(({c,l})=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:12,height:3,borderRadius:2,background:c}}/>
                <span style={{fontSize:9,color:"#94a3b8",fontWeight:600}}>{l}</span>
              </div>
            ))}
          </div>
          <Spark data={charts.statusTimelineData||[]}/>
        </div>
      </div>

      {/* Tableau : 5 tickets récemment assignés */}
      <div className="c" style={{animationDelay:".3s",background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:16,overflow:"hidden",boxShadow:"0 1px 4px #0001"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:"1.5px solid #f1f5f9"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{background:"#eff6ff",border:"1.5px solid #bfdbfe",borderRadius:8,padding:6}}><UserCheck size={13} color="#3b82f6"/></div>
            <p style={{margin:0,fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"2px"}}>Tickets récemment assignés</p>
          </div>
          <span style={{fontSize:10,fontWeight:700,background:"#f1f5f9",color:"#64748b",borderRadius:20,padding:"3px 10px"}}>5 tickets</span>
        </div>

        {/* En-têtes */}
        <div style={{display:"grid",gridTemplateColumns:"40px 1fr 90px 100px 1fr",padding:"8px 20px",background:"#fafafa",borderBottom:"1px solid #f1f5f9"}}>
          {["ID","Titre","Priorité","Statut","Dernière activité"].map(h=>(
            <span key={h} style={{fontSize:9,fontWeight:700,color:"#cbd5e1",textTransform:"uppercase",letterSpacing:"1px"}}>{h}</span>
          ))}
        </div>

        {/* Lignes */}
        {top5.map((a,i)=>{
          const p  = PRIO[a.priority]||{c:"#94a3b8",bg:"#f1f5f9",l:a.priority};
          const s  = STA[a.status]||{c:"#64748b",bg:"#f1f5f9",l:a.status};
          const ac = ACT_COLOR[a.lastActivity?.type] || "#94a3b8";
          return (
            <div key={a.ticketId} className="row" onClick={()=>navigate(`/technician/ticket-technicien/${a.ticketId}`)}
              style={{display:"grid",gridTemplateColumns:"40px 1fr 90px 100px 1fr",padding:"11px 20px",
                borderBottom:i<top5.length-1?"1px solid #f8fafc":"none",
                alignItems:"center",background:"#fff",transition:"background .15s",cursor:"pointer"}}>

              <span style={{fontSize:11,fontWeight:700,color:"#cbd5e1"}}>#{a.ticketId}</span>

              <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0,paddingRight:12}}>
                <span style={{fontSize:12,fontWeight:600,color:"#1e293b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.ticketTitle}</span>
                <ArrowUpRight size={11} color="#cbd5e1" style={{flexShrink:0}}/>
              </div>

              <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:6,background:p.bg,color:p.c,width:"fit-content"}}>{p.l}</span>

              <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:6,background:s.bg,color:s.c,width:"fit-content"}}>{s.l}</span>

              {/* Dernière activité */}
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:ac,flexShrink:0}}/>
                <span style={{fontSize:11,color:"#64748b",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.lastActivity?.label}</span>
                <span style={{fontSize:10,color:"#cbd5e1",fontWeight:600,flexShrink:0,marginLeft:4}}>{timeAgo(a.lastActivity?.date)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}