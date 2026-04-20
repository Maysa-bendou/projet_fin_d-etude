import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area, ReferenceLine
} from 'recharts';
import {
  MdTrendingUp, MdTimer, MdCheckCircle, MdFileDownload, MdAssignment
} from 'react-icons/md';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';

const getDynamicColor = (name, index) => {
  const map = {
    'open': '#3b82f6', 'in_progress': '#8b5cf6', 'resolved': '#22c55e',
    'closed': '#10b981', 'rejected': '#ef4444', 'pending': '#f59e0b',
    'critical': '#ef4444', 'high': '#f97316', 'medium': '#f59e0b', 'low': '#22c55e'
  };
  return map[name?.toLowerCase()] || ['#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'][index % 5];
};

const CustomDot = (props) => {
  const { cx, cy } = props;
  return <circle cx={cx} cy={cy} r={4} fill="#3b82f6" stroke="#fff" strokeWidth={2} />;
};

const MonthlyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f172a] text-white p-3 rounded-xl shadow-xl text-[11px] border border-slate-700">
      <p className="opacity-70 mb-1 uppercase tracking-widest">{label}</p>
      <p className="text-base font-bold">{payload[0].value} tickets</p>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-[12px]">
      {label && <p className="text-slate-400 font-bold mb-2 uppercase">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-4 my-1">
          <span style={{ color: p.color }} className="font-medium">{p.name}:</span>
          <span className="font-bold text-slate-900">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function PerformancesPage() {
  const [stats, setStats] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/api/manager/stats/${user.id}`);
        setStats(res.data);
      } catch (err) { console.error("Erreur stats:", err); }
    };
    fetchStats();
  }, [user.id]);

  const sortedMonthlyStats = useMemo(() => {
    if (!stats?.monthlyStats) return [];
    const order = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    return [...stats.monthlyStats].sort((a, b) => order.indexOf(a.month) - order.indexOf(b.month));
  }, [stats]);

  const avgMonthly = useMemo(() => {
    if (!sortedMonthlyStats.length) return 0;
    return Math.round(sortedMonthlyStats.reduce((s, m) => s + m.value, 0) / sortedMonthlyStats.length);
  }, [sortedMonthlyStats]);

  const exportPDF = () => {
    if (!stats) return;
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.text(`Rapport : ${stats.serviceName}`, 40, 50);
    autoTable(doc, {
      startY: 80,
      head: [['KPI', 'Valeur']],
      body: [['Total Tickets', stats.totalTickets], ['Résolution', `${stats.resolutionRate}%`]],
    });
    doc.save(`Performance_${stats.serviceName}.pdf`);
  };

  const exportExcel = () => {
    if (!stats) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.techPerformance), "Techniciens");
    XLSX.writeFile(wb, `Stats_${stats.serviceName}.xlsx`);
  };

  if (!stats) return <div className="p-10 text-slate-400 font-bold animate-pulse text-sm uppercase tracking-widest">Chargement des analyses...</div>;

  const slaIn = stats.slaStats[0].value;
  const slaOut = stats.slaStats[1].value;
  const slaPct = Math.round((slaIn / (slaIn + slaOut || 1)) * 100);

  return (
    <div className="p-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] mb-1">Analyses & Performances</h1>
          <p className="text-sm text-slate-500">{stats.serviceName} • Vue Managériale</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <MdFileDownload className="text-emerald-500" size={18} /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-[#0f172a] text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-md">
            <MdFileDownload className="text-red-400" size={18} /> Rapport PDF
          </button>
        </div>
      </div>

      {/* KPI Cards - Style Capture 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <KpiCard label="Total Global" value={stats.totalTickets} icon={<MdAssignment />} type="blue" />
        <KpiCard label="Taux Résolution" value={`${stats.resolutionRate}%`} icon={<MdTrendingUp />} type="purple" />
        <KpiCard label="Dans les Délais" value={slaIn} icon={<MdCheckCircle />} type="green" />
        <KpiCard label="Retards (SLA)" value={slaOut} icon={<MdTimer />} type="red" />
      </div>

      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Efficacité de l'équipe</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card title="Volume de travail par Technicien">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.techPerformance}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="resolu" name="Résolus" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="rejete" name="Rejetés" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Productivité Individuelle (%)">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.techPerformance} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="resolutionRate" name="Taux %" radius={[0, 4, 4, 0]} barSize={15}>
                {stats.techPerformance.map((entry, index) => (
                  <Cell key={index} fill="#3b82f6" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Répartition & Tendances</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card title="État Actuel des Tickets">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.statusStats}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={30}>
                {stats.statusStats.map((entry, index) => (
                  <Cell key={index} fill={getDynamicColor(entry.name, index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Distribution par Type">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats.typeStats} innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value">
                {stats.typeStats.map((entry, index) => (
                  <Cell key={index} fill={getDynamicColor(entry.name, index)} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {stats.typeStats.map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getDynamicColor(t.name, i) }} />
                <span className="text-[10px] font-bold text-slate-500 uppercase">{t.name}: {t.percentage}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Santé du Service (SLA)">
          <div className="flex flex-col items-center justify-center py-6">
            <div className={`text-5xl font-bold mb-2 ${slaPct > 80 ? 'text-green-500' : 'text-red-500'}`}>{slaPct}%</div>
            <p className="text-slate-400 text-sm font-medium mb-6 uppercase tracking-tighter">Conformité aux délais</p>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
               <div className={`h-full ${slaPct > 80 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${slaPct}%` }} />
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase font-bold">OK</p>
                <p className="text-lg font-bold text-green-600">{slaIn}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase font-bold">Retards</p>
                <p className="text-lg font-bold text-red-600">{slaOut}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Évolution Mensuelle</h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold">Moy: {avgMonthly}/mois</span>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sortedMonthlyStats}>
                <defs>
                  <linearGradient id="colorCurve" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip content={<MonthlyTooltip />} />
                <ReferenceLine y={avgMonthly} stroke="#cbd5e1" strokeDasharray="5 5" />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCurve)" dot={<CustomDot />} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Card title="Priorités des demandes">
           <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={stats.priorityStats} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {stats.priorityStats.map((entry, index) => (
                  <Cell key={index} fill={getDynamicColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, type }) {
  const styles = {
    blue:   { bg: 'bg-blue-50', text: 'text-blue-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-500' },
    green:  { bg: 'bg-green-50', text: 'text-green-500' },
    red:    { bg: 'bg-red-50', text: 'text-red-500' },
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${styles[type].bg} ${styles[type].text}`}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-widest border-l-4 border-blue-500 pl-3 leading-none">{title}</h3>
      {children}
    </div>
  );
}