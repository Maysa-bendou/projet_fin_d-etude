import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area, ReferenceLine
} from 'recharts';
import {
  MdTrendingUp, MdTimer, MdCheckCircle, MdFileDownload, MdPeople,
  MdBarChart, MdAssignment
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

// ── Custom dot for area chart ────────────────────────────────────────────────
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
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
      padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
    }}>
      {label && <p style={{ color: '#6b7280', fontSize: 11, marginBottom: 5 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600, margin: '2px 0' }}>
          {p.name}: <span style={{ color: '#111827' }}>{p.value}</span>
        </p>
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
      } catch (err) {
        console.error("Erreur stats:", err);
      }
    };
    fetchStats();
  }, [user.id]);

  const sortedMonthlyStats = useMemo(() => {
    if (!stats?.monthlyStats) return [];
    const order = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    return [...stats.monthlyStats].sort((a, b) => order.indexOf(a.month) - order.indexOf(b.month));
  }, [stats]);

  const avgMonthly = useMemo(() => {
    if (!sortedMonthlyStats.length) return 0;
    return Math.round(sortedMonthlyStats.reduce((s, m) => s + m.value, 0) / sortedMonthlyStats.length);
  }, [sortedMonthlyStats]);

  const exportPDF = () => {
    if (!stats) return;
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(20);
    doc.text(`Rapport de Performance : ${stats.serviceName}`, 40, 50);
    autoTable(doc, {
      startY: 80,
      head: [['KPI', 'Valeur']],
      body: [
        ['Total Tickets', stats.totalTickets],
        ['Taux de Résolution', `${stats.resolutionRate}%`],
        ['Tickets Dans SLA', stats.slaStats[0].value],
        ['Tickets Hors SLA', stats.slaStats[1].value],
      ],
      theme: 'striped'
    });
    doc.text('Performance Techniciens', 40, doc.lastAutoTable.finalY + 30);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 40,
      head: [['Technicien', 'Résolus', 'Rejetés', 'Taux (%)']],
      body: stats.techPerformance.map(t => [t.name, t.resolu, t.rejete, `${t.resolutionRate}%`]),
      headStyles: { fillColor: [37, 99, 235] }
    });
    doc.save(`Performance_${stats.serviceName}.pdf`);
  };

  const exportExcel = () => {
    if (!stats) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.statusStats), "Statuts");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.techPerformance), "Techniciens");
    XLSX.writeFile(wb, `Stats_Service_${stats.serviceName}.xlsx`);
  };

  if (!stats) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      Chargement du tableau de bord...
    </div>
  );

  const slaIn = stats.slaStats[0].value;
  const slaOut = stats.slaStats[1].value;
  const slaPct = Math.round((slaIn / (slaIn + slaOut || 1)) * 100);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '32px', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        .monthly-chart-wrap { background: linear-gradient(135deg, #eff6ff 0%, #fff 60%); border-radius: 16px; padding: 24px; border: 1px solid #dbeafe; }
        .monthly-stat-badge { background: #2563eb; color: #fff; border-radius: 8px; padding: 6px 14px; font-size: 12px; font-weight: 600; }
        .monthly-stat-badge.avg { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Managerial View • {stats.serviceName}</p>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827' }}>Analyses & Performances</h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={exportPDF} style={btnStyle('#dc2626')}><MdFileDownload /> PDF</button>
          <button onClick={exportExcel} style={btnStyle('#16a34a')}><MdFileDownload /> Excel</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Total Global" value={stats.totalTickets} color="#2563eb" icon={<MdAssignment />} />
        <KpiCard label="Taux Résolution" value={`${stats.resolutionRate}%`} color="#7c3aed" icon={<MdTrendingUp />} />
        <KpiCard label="Dans les Délais" value={slaIn} color="#16a34a" icon={<MdCheckCircle />} />
        <KpiCard label="Retards (SLA)" value={slaOut} color="#dc2626" icon={<MdTimer />} />
      </div>

      <SectionLabel>Efficacité de l'équipe</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
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
                {stats.techPerformance.map((entry, index) => (
                  <Cell key={index} fill={getDynamicColor('resolved')} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <SectionLabel>Répartition des flux</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <Card title="État Actuel des Tickets">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.statusStats}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                {stats.statusStats.map((entry, index) => (
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
                {stats.typeStats.map((entry, index) => (
                  <Cell key={index} fill={getDynamicColor(entry.name, index)} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" formatter={(value) => `${value}`} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ textAlign: 'center', marginTop: -10 }}>
            {stats.typeStats.map((t, i) => (
              <span key={i} style={{ fontSize: 12, color: '#6b7280', margin: '0 8px' }}>
                {t.name}: <strong>{t.percentage}%</strong>
              </span>
            ))}
          </div>
        </Card>

        <Card title="Santé du Service (SLA)">
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: 48, fontWeight: 800, color: slaPct > 80 ? '#16a34a' : '#dc2626' }}>{slaPct}%</p>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Conformité aux délais</p>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 15 }}>
              <div style={{ fontSize: 12 }}><span style={{ color: '#16a34a' }}>●</span> {slaIn} OK</div>
              <div style={{ fontSize: 12 }}><span style={{ color: '#dc2626' }}>●</span> {slaOut} Retards</div>
            </div>
          </div>
        </Card>
      </div>

      <SectionLabel>Tendances Temporelles</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

        <Card title="Priorités">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={stats.priorityStats} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {stats.priorityStats.map((entry, index) => (
                  <Cell key={index} fill={getDynamicColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color, icon }) {
  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: 12, border: '1px solid #e5e7eb', display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: 10, background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{label}</p>
        <p style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>{value}</p>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 20 }}>{title}</p>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '24px 0 12px' }}>
      {children}
    </p>
  );
}

function btnStyle(color) {
  return {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8,
    border: `1px solid ${color}20`, background: `${color}10`, color, cursor: 'pointer',
    fontSize: 13, fontWeight: 600, transition: 'all 0.2s'
  };
}
