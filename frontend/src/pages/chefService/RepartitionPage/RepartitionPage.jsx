import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, ReferenceLine
} from 'recharts';
import {
  MdTrendingUp, MdTimer, MdCheckCircle, MdFileDownload, MdPeople,
  MdArrowBack, MdAssignment
} from 'react-icons/md';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';

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
  const { cx, cy } = props;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="#2563eb" stroke="#fff" strokeWidth={2} />
    </g>
  );
};

const CustomLabel = (props) => {
  const { x, y, value } = props;
  return (
    <text x={x} y={y - 10} fill="#2563eb" fontSize={11} fontWeight={700} textAnchor="middle">
      {value}
    </text>
  );
};

const MonthlyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1e3a8a', borderRadius: 12, padding: '10px 16px',
      boxShadow: '0 4px 20px rgba(37,99,235,0.18)', color: '#fff'
    }}>
      <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 700 }}>{payload[0].value} <span style={{ fontSize: 12, fontWeight: 400 }}>tickets</span></p>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
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

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
      Chargement...
    </div>
  );

  // VIEW 1: SERVICE SELECTION GRID
  if (!selectedServiceId) {
    return (
      <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', padding: '40px 32px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
          Répartition par Services
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 32 }}>
          Sélectionnez un service pour analyser ses performances.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {services.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelectedServiceId(s.id)}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderLeft: '4px solid #3b82f6',
                borderRadius: 16,
                padding: '20px 24px',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s, transform 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>{s.name}</h3>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Analyser →
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
      Chargement des données...
    </div>
  );

  const slaIn = stats.slaStats?.[0]?.value || 0;
  const slaOut = stats.slaStats?.[1]?.value || 0;
  const slaPct = Math.round((slaIn / (slaIn + slaOut || 1)) * 100);

  // VIEW 2: STATS DASHBOARD
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', padding: '40px 32px' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <button
            onClick={() => setSelectedServiceId(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9ca3af', fontSize: 12, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              marginBottom: 12, padding: 0
            }}
          >
            <MdArrowBack style={{ fontSize: 14 }} /> Retour aux services
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>
            Analyses & Performances
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{stats.serviceName}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={exportPDF} style={actionBtn('#dc2626')}>
            <MdFileDownload style={{ fontSize: 16 }} /> PDF
          </button>
          <button onClick={exportExcel} style={actionBtn('#16a34a')}>
            <MdFileDownload style={{ fontSize: 16 }} /> Excel
          </button>
        </div>
      </div>

      {/* KPI CARDS — same style as Mon Espace Support summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <KpiCard label="Total Global" value={stats.totalTickets} color="#3b82f6" bg="#eff6ff" icon={<MdAssignment />} />
        <KpiCard label="Taux Résolution" value={`${stats.resolutionRate}%`} color="#16a34a" bg="#f0fdf4" icon={<MdCheckCircle />} />
        <KpiCard label="Dans les Délais" value={slaIn} color="#d97706" bg="#fffbeb" icon={<MdTimer />} />
        <KpiCard label="Retards (SLA)" value={slaOut} color="#dc2626" bg="#fef2f2" icon={<MdTrendingUp />} />
      </div>

      {/* SECTION: Efficacité équipe */}
      <SectionLabel>Efficacité de l'équipe</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <Card title="Volume de travail par Technicien">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.techPerformance}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="resolu" name="Résolus" fill="#16a34a" radius={[6, 6, 0, 0]} barSize={20} />
              <Bar dataKey="rejete" name="Rejetés" fill="#dc2626" radius={[6, 6, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Productivité Individuelle (%)">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.techPerformance} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="resolutionRate" name="Taux" radius={[0, 6, 6, 0]} barSize={15}>
                {stats.techPerformance?.map((entry, index) => (
                  <Cell key={index} fill="#16a34a" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* SECTION: Répartition des flux */}
      <SectionLabel>Répartition des flux</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
        <Card title="État Actuel des Tickets">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.statusStats}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={30}>
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
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Santé du Service (SLA)">
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 48, fontWeight: 800, margin: '0 0 4px 0', color: slaPct > 80 ? '#16a34a' : '#dc2626' }}>
              {slaPct}%
            </p>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
              Conformité aux délais
            </p>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 32, borderTop: '1px solid #f3f4f6', paddingTop: 24 }}>
              <div>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#16a34a', margin: 0 }}>{slaIn}</p>
                <p style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', margin: '2px 0 0 0' }}>OK</p>
              </div>
              <div>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#dc2626', margin: 0 }}>{slaOut}</p>
                <p style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', margin: '2px 0 0 0' }}>Retards</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* SECTION: Tendances temporelles */}
      <SectionLabel>Tendances Temporelles</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        <Card title="Evolution Mensuelle des Tickets">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: -8 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', margin: 0 }}>Flux Mensuel</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={statBadge('#eff6ff', '#3b82f6', '#dbeafe')}>Total: {stats.totalTickets}</span>
              <span style={statBadge('#f9fafb', '#6b7280', '#e5e7eb')}>Moy: {avgMonthly}/mois</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={sortedMonthlyStats}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbeafe" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#1e40af', fontWeight: 500 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip content={<MonthlyTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorValue)"
                dot={<CustomDot />}
                activeDot={{ r: 8 }}
                label={<CustomLabel />}
              />
              <ReferenceLine
                y={avgMonthly}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                label={{ position: 'right', value: 'Moyenne', fill: '#94a3b8', fontSize: 10 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

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
              <Legend iconType="circle" verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

      </div>
    </div>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function KpiCard({ label, value, color, bg, icon }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 16,
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, color
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px 0' }}>
          {label}
        </p>
        <p style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1 }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 16,
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    }}>
      <p style={{
        fontSize: 11, fontWeight: 800, color: '#9ca3af',
        textTransform: 'uppercase', letterSpacing: '0.12em',
        margin: '0 0 20px 0'
      }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 800, color: '#9ca3af',
      textTransform: 'uppercase', letterSpacing: '0.2em',
      margin: '32px 0 16px 0'
    }}>
      {children}
    </p>
  );
}

function actionBtn(color) {
  return {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 18px', borderRadius: 12,
    border: `1px solid ${color}30`,
    background: `${color}10`,
    color, cursor: 'pointer',
    fontSize: 12, fontWeight: 700,
    fontFamily: 'Inter, sans-serif'
  };
}

function statBadge(bg, color, border) {
  return {
    padding: '4px 10px',
    background: bg,
    color,
    border: `1px solid ${border}`,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };
}
