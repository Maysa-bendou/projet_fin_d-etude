import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area, ReferenceLine, LabelList
} from 'recharts';
import {
  MdFileDownload, MdPeople, MdFilterList
} from 'react-icons/md';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';

// ── Color map ──────────────────────────────────────────────────────────────────
const getDynamicColor = (name, index) => {
  const map = {
    'open': '#3b82f6', 'in_progress': '#8b5cf6', 'resolved': '#10b981',
    'closed': '#06b6d4', 'rejected': '#ef4444', 'pending': '#f59e0b',
    'pending_supplier': '#0284c7', 'critical': '#ef4444', 'high': '#f97316',
    'medium': '#f59e0b', 'low': '#10b981', 'incident': '#e11d48', 'demande': '#0ea5e9',
    'problem': '#7c3aed', 'problème': '#7c3aed'
  };
  const palette = ['#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#f97316'];
  return map[name?.toLowerCase()] || palette[index % palette.length];
};

// ── Month names ───────────────────────────────────────────────────────────────
const MONTHS = [
  { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' }, { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' }, { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' }, { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' },
];

// ── Custom Bar Label ──────────────────────────────────────────────────────────
const BarTopLabel = (props) => {
  const { x, y, width, value } = props;
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 5} fill="#64748b" fontSize={11} fontWeight={600} textAnchor="middle">
      {value}
    </text>
  );
};

// ── Custom Area Dot ───────────────────────────────────────────────────────────
const AreaDot = (props) => {
  const { cx, cy, value } = props;
  if (!value) return null;
  return <circle cx={cx} cy={cy} r={4} fill="#6366f1" stroke="#fff" strokeWidth={2} />;
};

// ── Custom Area Value Label ───────────────────────────────────────────────────
const AreaValueLabel = (props) => {
  const { x, y, value } = props;
  if (!value) return null;
  return <text x={x} y={y - 10} fill="#6366f1" fontSize={10} fontWeight={700} textAnchor="middle">{value}</text>;
};

// ── Pie custom label ──────────────────────────────────────────────────────────
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
  if (percent < 0.04) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" fontSize={11} fontWeight={700} textAnchor="middle" dominantBaseline="central">
      {value}
    </text>
  );
};

// ── KPI Meta ─────────────────────────────────────────────────────────────────
const KPI_META = {
  total:       { motCle: 'Total Tickets',    desc: 'Tous les tickets du service' },
  serviceRate: { motCle: 'Taux Résolution',  desc: 'Tickets résolus ÷ total (votre service)' },
  resolvedCount: { motCle: 'Tickets Résolus', desc: 'Nbr tickets résolus de votre service' },
  slaIn:       { motCle: 'Dans SLA',         desc: 'Tickets dans le délai SLA' },
  slaOut:      { motCle: 'Hors SLA',         desc: 'Tickets hors délai SLA' },
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function PerformancesPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchStats = useCallback(async (year, month) => {
    setLoading(true);
    try {
      const params = {};
      if (year) params.year = year;
      if (month) params.month = month;
      const res = await axios.get(`http://localhost:3001/api/manager/stats/${user.id}`, { params });
      setStats(res.data);
    } catch (err) {
      console.error("Erreur stats:", err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchStats(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, fetchStats]);

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    if (!e.target.value) setSelectedMonth('');
  };

  const handleMonthChange = (e) => setSelectedMonth(e.target.value);

  const clearFilters = () => {
    setSelectedYear('');
    setSelectedMonth('');
  };

  const sortedMonthlyStats = useMemo(() => {
    if (!stats?.monthlyStats) return [];
    const order = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
    if (selectedMonth) return stats.monthlyStats;
    return [...stats.monthlyStats].sort((a, b) => order.indexOf(a.month) - order.indexOf(b.month));
  }, [stats, selectedMonth]);

  const avgMonthly = useMemo(() => {
    if (!sortedMonthlyStats.length) return 0;
    return Math.round(sortedMonthlyStats.reduce((s, m) => s + m.value, 0) / sortedMonthlyStats.length);
  }, [sortedMonthlyStats]);

  const filterLabel = useMemo(() => {
    if (!selectedYear && !selectedMonth) return 'Toutes les périodes';
    if (selectedYear && selectedMonth) {
      const mLabel = MONTHS.find(m => m.value === parseInt(selectedMonth))?.label;
      return `${mLabel} ${selectedYear}`;
    }
    if (selectedYear) return `Année ${selectedYear}`;
    return '';
  }, [selectedYear, selectedMonth]);

  // ── Export PDF ────────────────────────────────────────────────────────────
  const exportPDF = () => {
    if (!stats) return;
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(20);
    doc.text(`Rapport de Performance : ${stats.serviceName}`, 40, 50);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Période : ${filterLabel}`, 40, 72);
    autoTable(doc, {
      startY: 90,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Total Tickets (Service)', stats.totalTickets],
        ['Taux de Résolution (Service)', `${stats.resolutionRate}%`],
        ['Taux de Résolution (Global)', `${stats.globalResolutionRate}%`],
        ['Tickets Dans SLA', stats.slaStats[0].value],
        ['Tickets Hors SLA', stats.slaStats[1].value],
      ],
      theme: 'striped'
    });
    doc.text('Performance Techniciens', 40, doc.lastAutoTable.finalY + 30);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 40,
      head: [['Technicien', 'Assignés', 'Résolus', 'Fermés', 'Rejetés', 'Taux Résolution (%)']],
      body: stats.techPerformance.map(t => [t.name, t.totalAssigned, t.resolu, t.ferme, t.rejete, `${t.resolutionRate}%`]),
      headStyles: { fillColor: [99, 102, 241] }
    });
    doc.text('Répartition par Statut', 40, doc.lastAutoTable.finalY + 30);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 40,
      head: [['Statut', 'Nombre']],
      body: stats.statusStats.map(s => [s.name, s.value]),
      headStyles: { fillColor: [99, 102, 241] }
    });
    doc.save(`Performance_${stats.serviceName}_${filterLabel.replace(/\s/g, '_')}.pdf`);
  };

  // ── Export Excel ──────────────────────────────────────────────────────────
  const exportExcel = () => {
    if (!stats) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { Indicateur: 'Total Tickets (Service)', Valeur: stats.totalTickets },
      { Indicateur: 'Taux Résolution (Service)', Valeur: `${stats.resolutionRate}%` },
      { Indicateur: 'Taux Résolution (Global)', Valeur: `${stats.globalResolutionRate}%` },
      { Indicateur: 'SLA Conformes', Valeur: stats.slaStats[0].value },
      { Indicateur: 'SLA Dépassés', Valeur: stats.slaStats[1].value },
      { Indicateur: 'Période', Valeur: filterLabel },
    ]), "KPIs");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.statusStats), "Statuts");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      stats.techPerformance.map(t => ({
        Technicien: t.name,
        'Total Assignés': t.totalAssigned,
        Résolus: t.resolu,
        Fermés: t.ferme,
        Rejetés: t.rejete,
        'Taux Résolution (%)': `${t.resolutionRate}%`
      }))
    ), "Techniciens");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.priorityStats), "Priorités");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sortedMonthlyStats), "Tendances");
    XLSX.writeFile(wb, `Stats_${stats.serviceName}_${filterLabel.replace(/\s/g, '_')}.xlsx`);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!stats && loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <div style={{ width: 44, height: 44, border: '3px solid #6366f1', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>Chargement du tableau de bord...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (!stats) return null;

  const slaIn = stats.slaStats[0].value;
  const slaOut = stats.slaStats[1].value;
  const slaPct = Math.round((slaIn / (slaIn + slaOut || 1)) * 100);

  // Taux résolution per technician = tickets assignés à technician ÷ total tickets du service
  const techTableData = stats.techPerformance.map(t => ({
    ...t,
    tauxParService: stats.totalTickets > 0 ? Math.round((t.totalAssigned / stats.totalTickets) * 100) : 0,
  }));

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '28px 32px', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .pp-card { background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px 22px; }
        .pp-section-title { font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin: 24px 0 10px; }
        .pp-chart-title { font-size: 13px; font-weight: 700; color: #1e293b; margin: 0 0 16px; }
        .pp-filter-select { border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 12px; font-size: 13px; color: #334155; background: #fff; cursor: pointer; outline: none; font-family: inherit; transition: border-color 0.2s; }
        .pp-filter-select:focus { border-color: #6366f1; }
        .pp-filter-select:disabled { opacity: 0.45; cursor: not-allowed; }
        .pp-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; font-family: inherit; transition: opacity 0.15s; }
        .pp-btn:hover { opacity: 0.82; }
        .pp-clear-btn { border: 1px solid #fecdd3; border-radius: 8px; padding: 7px 13px; font-size: 12px; color: #e11d48; background: transparent; cursor: pointer; font-weight: 600; font-family: inherit; }
        .pp-clear-btn:hover { background: #fff1f2; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Analyses & Performances
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, fontWeight: 500 }}>
            {stats.serviceName} · Vue Managériale
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="pp-btn" onClick={exportExcel} style={{ background: '#f0fdf4', color: '#15803d', border: '1.5px solid #bbf7d0' }}>
            <MdFileDownload size={17} /> Excel
          </button>
          <button className="pp-btn" onClick={exportPDF} style={{ background: '#0f172a', color: '#fff' }}>
            <MdFileDownload size={17} /> Rapport PDF
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="pp-card" style={{ marginBottom: 22, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 13, fontWeight: 700 }}>
          <MdFilterList size={18} color="#6366f1" />
          Filtrer par :
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Année</label>
          <select className="pp-filter-select" value={selectedYear} onChange={handleYearChange}>
            <option value="">Toutes</option>
            {(stats.availableYears || []).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mois</label>
          <select className="pp-filter-select" value={selectedMonth} onChange={handleMonthChange} disabled={!selectedYear}>
            <option value="">Tous</option>
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        {(selectedYear || selectedMonth) && (
          <button className="pp-clear-btn" onClick={clearFilters} style={{ marginTop: 18 }}>✕ Réinitialiser</button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>📅 {filterLabel}</span>
          {loading && (
            <span style={{ width: 18, height: 18, border: '2.5px solid #6366f1', borderTop: '2.5px solid transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        <KpiCard meta={KPI_META.total} value={stats.totalTickets} color="#6366f1" />
        <KpiCard meta={KPI_META.serviceRate} value={`${stats.resolutionRate}%`} color="#8b5cf6" />
        <KpiCard meta={KPI_META.resolvedCount} value={stats.resolvedCount} color="#0891b2" />
        <KpiCard meta={KPI_META.slaIn} value={slaIn} color="#10b981" />
        <KpiCard meta={KPI_META.slaOut} value={slaOut} color="#ef4444" />
      </div>

      {/* ── Section: Efficacité Équipe ── */}
      <p className="pp-section-title">Efficacité de l'Équipe</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>

        {/* Bar chart: Volume par Technicien */}
        <div className="pp-card">
          <p className="pp-chart-title">Volume de Travail par Technicien</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.techPerformance} barCategoryGap="30%" barGap={3}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} interval={0} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Bar dataKey="ferme" name="Fermés" fill="#06b6d4" radius={[5, 5, 0, 0]} maxBarSize={22}>
                <LabelList content={<BarTopLabel />} />
              </Bar>
              <Bar dataKey="rejete" name="Rejetés" fill="#f43f5e" radius={[5, 5, 0, 0]} maxBarSize={22}>
                <LabelList content={<BarTopLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px', marginTop: 10 }}>
            <Indicator color="#06b6d4" label="Fermés" />
            <Indicator color="#f43f5e" label="Rejetés" />
          </div>
        </div>

        {/* Technician Table */}
        <div className="pp-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MdPeople color="#6366f1" size={17} /> Détail des Techniciens
            </p>
            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
              Taux = assignés ÷ total service
            </span>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 280 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                  {['Technicien', 'Assignés', 'Résolus', 'Taux Résolution'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Technicien' ? 'left' : 'center', color: '#64748b', fontWeight: 700, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {techTableData.map((t, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                    <td style={{ padding: '11px 14px', fontWeight: 600, color: '#1e293b' }}>{t.name}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>{t.totalAssigned}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                      <span style={{ background: '#d1fae5', color: '#059669', borderRadius: 7, padding: '2px 10px', fontWeight: 700, fontSize: 12 }}>{t.resolu}</span>
                    </td>
                    <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                        <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 3, maxWidth: 70 }}>
                          <div style={{
                            width: `${t.resolutionRate}%`, height: '100%', borderRadius: 3,
                            background: t.resolutionRate >= 70 ? '#10b981' : t.resolutionRate >= 40 ? '#f59e0b' : '#ef4444',
                            transition: 'width 0.6s ease'
                          }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12, minWidth: 36, color: t.resolutionRate >= 70 ? '#059669' : t.resolutionRate >= 40 ? '#d97706' : '#dc2626' }}>
                          {t.resolutionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {techTableData.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Aucun technicien trouvé</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
            <Indicator color="#10b981" label="≥ 70% Excellent" />
            <Indicator color="#f59e0b" label="40–69% Moyen" />
            <Indicator color="#ef4444" label="< 40% Faible" />
          </div>
        </div>
      </div>

      {/* ── Section: Répartition des flux ── */}
      <p className="pp-section-title">Répartition des Flux</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>

        {/* État Actuel des Tickets — Bar Chart */}
        <div className="pp-card">
          <p className="pp-chart-title">État Actuel des Tickets</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.statusStats} barCategoryGap="35%" margin={{ bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                interval={0}
                tick={{ fontSize: 10, fill: '#64748b' }}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={36}>
                {stats.statusStats.map((entry, index) => (
                  <Cell key={index} fill={getDynamicColor(entry.name, index)} />
                ))}
                <LabelList content={<BarTopLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: stats.statusStats.length > 3 ? 'repeat(2, 1fr)' : '1fr', gap: '4px 12px', marginTop: 12 }}>
            {stats.statusStats.map((s, i) => (
              <Indicator key={i} color={getDynamicColor(s.name, i)} label={`${s.name}: ${s.value}`} />
            ))}
          </div>
        </div>

        {/* Distribution par Type — Area/Line Chart */}
        <div className="pp-card">
          <p className="pp-chart-title">Distribution par Type</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.typeStats} barCategoryGap="40%" margin={{ bottom: 10 }}>
              <defs>
                {stats.typeStats.map((entry, index) => (
                  <linearGradient key={index} id={`typeGrad${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={getDynamicColor(entry.name, index)} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={getDynamicColor(entry.name, index)} stopOpacity={0.5} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                interval={0}
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={60}>
                {stats.typeStats.map((entry, index) => (
                  <Cell key={index} fill={`url(#typeGrad${index})`} />
                ))}
                <LabelList content={<BarTopLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: stats.typeStats.length > 3 ? 'repeat(2, 1fr)' : '1fr', gap: '4px 12px', marginTop: 10 }}>
            {stats.typeStats.map((t, i) => (
              <Indicator key={i} color={getDynamicColor(t.name, i)} label={`${t.name}: ${t.value} (${t.percentage}%)`} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Section: Répartition par Catégorie ── */}
      {stats.categoryStats?.length > 0 && (
        <>
          <p className="pp-section-title">Répartition par Catégorie</p>
          <div className="pp-card" style={{ marginBottom: 22 }}>
            <p className="pp-chart-title">Tickets par Catégorie</p>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={stats.categoryStats} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {stats.categoryStats.map((entry, index) => (
                    <Cell key={index} fill={getDynamicColor(entry.name, index)} />
                  ))}
                  <LabelList content={<BarTopLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gridTemplateColumns: stats.categoryStats.length > 3 ? 'repeat(2, 1fr)' : '1fr', gap: '4px 12px', marginTop: 12 }}>
              {stats.categoryStats.map((c, i) => (
                <Indicator key={i} color={getDynamicColor(c.name, i)} label={`${c.name}: ${c.value}`} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Section: Tendances Temporelles ── */}
      <p className="pp-section-title">Tendances Temporelles</p>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Area chart — Monthly / Daily trend */}
        <div className="pp-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <p className="pp-chart-title" style={{ marginBottom: 2 }}>
                {selectedMonth
                  ? `Évolution Journalière — ${MONTHS.find(m => m.value === parseInt(selectedMonth))?.label} ${selectedYear}`
                  : `Évolution Mensuelle ${selectedYear || new Date().getFullYear()}`}
              </p>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>📅 {filterLabel}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px' }}>Total: <strong style={{ color: '#1e293b' }}>{stats.totalTickets}</strong></p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={sortedMonthlyStats} margin={{ top: 24, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradIndigo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e0e7ff" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10.5, fill: '#6366f1', fontWeight: 500 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <ReferenceLine y={avgMonthly} stroke="#a5b4fc" strokeDasharray="4 3" label={{ position: 'right', value: 'Moy', fill: '#a5b4fc', fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#6366f1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gradIndigo)"
                dot={<AreaDot />}
                activeDot={false}
                label={<AreaValueLabel />}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Priorités — Pie Chart */}
        <div className="pp-card">
          <p className="pp-chart-title">Répartition par Priorité</p>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={stats.priorityStats}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={renderPieLabel}
              >
                {stats.priorityStats.map((entry, index) => (
                  <Cell key={index} fill={getDynamicColor(entry.name, index)} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: stats.priorityStats.length > 3 ? 'repeat(2, 1fr)' : '1fr', gap: '4px 12px', marginTop: 10 }}>
            {stats.priorityStats.map((p, i) => (
              <Indicator key={i} color={getDynamicColor(p.name, i)} label={`${p.name}: ${p.value}`} />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Indicator({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#475569', fontWeight: 500, whiteSpace: 'nowrap' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
      {label}
    </span>
  );
}

function KpiCard({ meta, value, color }) {
  return (
    <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #e2e8f0', borderLeft: `4px solid ${color}` }}>
      <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{meta.motCle}</p>
      <p style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1 }}>{value}</p>
    </div>
  );
}