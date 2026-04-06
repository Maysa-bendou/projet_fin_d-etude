import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, ReferenceLine // <--- Added this
} from 'recharts';
import {
  MdTrendingUp, MdTimer, MdCheckCircle, MdFileDownload, MdPeople,
  MdArrowBack, MdAssignment
} from 'react-icons/md';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';

// --- MANAGER STYLE HELPERS ---
const getDynamicColor = (name, index) => {
  const map = {
    'open': '#2563eb', 'in_progress': '#7c3aed', 'resolved': '#16a34a',
    'closed': '#059669', 'rejected': '#dc2626', 'pending': '#d97706',
    'pending_supplier': '#0891b2', 'critical': '#dc2626', 'high': '#f97316',
    'medium': '#d97706', 'low': '#16a34a', 'incident': '#e11d48', 'demande': '#0ea5e9'
  };
  return map[name?.toLowerCase()] || ['#2563eb', '#7c3aed', '#0891b2', '#db2777', '#4b5563'][index % 5];
};
const CustomDot = (props) => {
  const { cx, cy, value } = props;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="#2563eb" stroke="#fff" strokeWidth={2} />
    </g>
  );
};

// ── Custom label above dot ───────────────────────────────────────────────────
const CustomLabel = (props) => {
  const { x, y, value } = props;
  return (
    <text x={x} y={y - 10} fill="#2563eb" fontSize={11} fontWeight={700} textAnchor="middle">
      {value}
    </text>
  );
};

// ── Monthly tooltip ──────────────────────────────────────────────────────────
const MonthlyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1e3a8a', borderRadius: 10, padding: '10px 16px',
      boxShadow: '0 4px 20px rgba(37,99,235,0.3)', color: '#fff'
    }}>
      <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 700 }}>{payload[0].value} <span style={{ fontSize: 12, fontWeight: 400 }}>tickets</span></p>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      {label && <p style={{ color: '#6b7280', fontSize: 11, marginBottom: 5, fontWeight: 700 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600, margin: '2px 0' }}>
          {p.name}: <span style={{ color: '#111827' }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function RepartitionPage() {
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/services');
        const data = res.data;
        setServices(Array.isArray(data) ? data : data.services || []);
      } catch (err) { console.error("Erreur services:", err); }
      finally { setLoading(false); }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedServiceId) {
      const fetchStats = async () => {
        setStats(null);
        try {
          const res = await axios.get(`http://localhost:3001/api/chef/stats/service/${selectedServiceId}`);
          setStats(res.data);
        } catch (err) { console.error("Erreur stats:", err); }
      };
      fetchStats();
    }
  }, [selectedServiceId]);

  const sortedMonthlyStats = useMemo(() => {
    if (!stats?.monthlyStats) return [];
    // Must match the "months" array in your Node.js backend exactly
    const order = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    
    return [...stats.monthlyStats].sort((a, b) => order.indexOf(a.month) - order.indexOf(b.month));
  }, [stats]);
  const avgMonthly = useMemo(() => {
    if (!sortedMonthlyStats.length) return 0;
    return Math.round(sortedMonthlyStats.reduce((s, m) => s + m.value, 0) / sortedMonthlyStats.length);
  }, [sortedMonthlyStats]);

  const exportPDF = () => {
    if (!stats) return;
    const doc = new jsPDF();
    doc.text(`Rapport de Performance: ${stats.serviceName}`, 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Métrique', 'Valeur']],
      body: [
        ['Total Tickets', stats.totalTickets],
        ['Taux de Résolution', `${stats.resolutionRate || 0}%`],
        ['SLA Respecté', stats.slaStats?.[0]?.value || 0],
        ['SLA Dépassé', stats.slaStats?.[1]?.value || 0],
      ],
    });
    doc.save(`Rapport_${stats.serviceName}.pdf`);
  };

  const exportExcel = () => {
    if (!stats) return;
    const worksheet = XLSX.utils.json_to_sheet(stats.techPerformance || []);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Performance");
    XLSX.writeFile(workbook, `Stats_${stats.serviceName}.xlsx`);
  };

  if (loading) return <div className="p-10 text-center font-bold">Chargement...</div>;

  // VIEW 1: SELECTION GRID
  if (!selectedServiceId) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <h1 className="text-xl font-black text-gray-400 mb-8 uppercase tracking-widest">Répartition par Services</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((s) => (
            <div key={s.id} onClick={() => setSelectedServiceId(s.id)}
              className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-500 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1 group">
              <h3 className="font-bold text-gray-700 text-lg group-hover:text-blue-600">{s.name}</h3>
              <p className="text-blue-600 font-bold text-sm mt-2 uppercase tracking-tighter">Analyser →</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // VIEW 2: DASHBOARD
  if (!stats) return <div className="p-10 text-center font-bold">Chargement des données...</div>;

  const slaIn = stats.slaStats?.[0]?.value || 0;
  const slaOut = stats.slaStats?.[1]?.value || 0;
  const slaPct = Math.round((slaIn / (slaIn + slaOut || 1)) * 100);

  return (
    <div className="min-h-screen bg-[#f9fafb] p-8 font-sans">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');`}</style>
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <button onClick={() => setSelectedServiceId(null)} className="flex items-center gap-2 text-gray-400 hover:text-blue-600 font-bold text-[10px] uppercase tracking-widest mb-4 transition-all">
            <MdArrowBack /> Retour aux services
          </button>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Chef de Service View • {stats.serviceName}</p>
          <h1 className="text-3xl font-black text-gray-900 leading-none">Analyses & Performances</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={exportPDF} style={btnStyle('#dc2626')}><MdFileDownload /> PDF</button>
          <button onClick={exportExcel} style={btnStyle('#16a34a')}><MdFileDownload /> Excel</button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Global" value={stats.totalTickets} color="#2563eb" icon={<MdAssignment />} />
        <KpiCard label="Taux Résolution" value={`${stats.resolutionRate}%`} color="#7c3aed" icon={<MdTrendingUp />} />
        <KpiCard label="Dans les Délais" value={slaIn} color="#16a34a" icon={<MdCheckCircle />} />
        <KpiCard label="Retards (SLA)" value={slaOut} color="#dc2626" icon={<MdTimer />} />
      </div>

      <SectionLabel>Efficacité de l'équipe</SectionLabel>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <Card title="Volume de travail par Technicien">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.techPerformance}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="resolu" name="Résolus" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="rejete" name="Rejetés" fill="#dc2626" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Productivité Individuelle (%)">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.techPerformance} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="resolutionRate" name="Taux" radius={[0, 4, 4, 0]} barSize={15}>
                {stats.techPerformance?.map((entry, index) => (
                  <Cell key={index} fill={getDynamicColor('resolved')} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <SectionLabel>Répartition des flux</SectionLabel>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Card title="État Actuel des Tickets">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.statusStats}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                {stats.statusStats?.map((entry, index) => (
                  <Cell key={index} fill={getDynamicColor(entry.name, index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Distribution par Type">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={stats.typeStats} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {stats.typeStats?.map((entry, index) => (
                  <Cell key={index} fill={getDynamicColor(entry.name, index)} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Santé du Service (SLA)">
          <div className="text-center py-6">
            <p className="text-5xl font-black mb-2" style={{ color: slaPct > 80 ? '#16a34a' : '#dc2626' }}>{slaPct}%</p>
            <p className="text-gray-400 text-xs font-bold uppercase">Conformité aux délais</p>
            <div className="mt-8 flex justify-center gap-6 border-t pt-6 border-gray-50">
               <div><span className="text-green-500 font-black">{slaIn}</span> <p className="text-[10px] text-gray-400 uppercase">OK</p></div>
               <div><span className="text-red-500 font-black">{slaOut}</span> <p className="text-[10px] text-gray-400 uppercase">Retards</p></div>
            </div>
          </div>
        </Card>
      </div>

<SectionLabel>Tendances Temporelles</SectionLabel>
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

  {/* CARD 1: Monthly Curve Chart */}
  <Card title="Evolution Mensuelle des Tickets">
    {/* Header Info (Total & Average) */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: -10 }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#1e3a8a', margin: 0 }}>Flux Mensuel</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-100">
          Total: {stats.totalTickets}
        </span>
        <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-[10px] font-bold uppercase tracking-wider border border-gray-100">
          Moy: {avgMonthly}/mois
        </span>
      </div>
    </div>
    
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={sortedMonthlyStats}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbeafe" />
        <XAxis 
          dataKey="month" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 11, fill: '#1e40af', fontWeight: 500 }} 
        />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
        <Tooltip content={<MonthlyTooltip />} />
        
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke="#2563eb" 
          strokeWidth={3} 
          fillOpacity={1} 
          fill="url(#colorValue)" 
          dot={<CustomDot />}
          activeDot={{ r: 8 }}
          label={<CustomLabel />}
        />
        
        {/* Average reference line - ensure ReferenceLine is imported in Recharts */}
        <ReferenceLine 
          y={avgMonthly} 
          stroke="#94a3b8" 
          strokeDasharray="3 3" 
          label={{ position: 'right', value: 'Moyenne', fill: '#94a3b8', fontSize: 10 }} 
        />
      </AreaChart>
    </ResponsiveContainer>
  </Card>

  {/* CARD 2: Répartition par Priorité */}
  <Card title="Répartition par Priorité">
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie 
          data={stats.priorityStats} 
          innerRadius={70} 
          outerRadius={90} 
          paddingAngle={5} 
          dataKey="value"
        >
          {stats.priorityStats?.map((entry, index) => (
            <Cell key={index} fill={getDynamicColor(entry.name)} />
          ))}
        </Pie>
        <Tooltip />
        <Legend iconType="circle" verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  </Card>

</div>
      </div>
  );
}

// --- SHARED COMPONENTS ---
function KpiCard({ label, value, color, icon }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${color}15`, color }}>{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <p className="text-[11px] font-black text-gray-400 uppercase mb-6 tracking-widest">{title}</p>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-10 mb-4">{children}</p>;
}

function btnStyle(color) {
  return {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12,
    border: `1px solid ${color}20`, background: `${color}10`, color, cursor: 'pointer',
    fontSize: 12, fontWeight: 700, transition: 'all 0.2s'
  };
}