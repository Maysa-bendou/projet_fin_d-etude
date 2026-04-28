import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell,
  AreaChart, Area, ReferenceLine, LabelList,
  PieChart, Pie, Tooltip
} from 'recharts';
import {
  MdFileDownload, MdPeople, MdFilterList, MdDashboard
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

// ── Pie Chart Custom Label ────────────────────────────────────────────────────
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
  if (!value) return null;
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function ChefPerformancesPage() {
  const { t, i18n } = useTranslation('chef');

  // Month list built from translation keys so it reacts to language switches
  const MONTHS = useMemo(() => [
    { value: 1,  label: t('months.jan') }, { value: 2,  label: t('months.feb') },
    { value: 3,  label: t('months.mar') }, { value: 4,  label: t('months.apr') },
    { value: 5,  label: t('months.may') }, { value: 6,  label: t('months.jun') },
    { value: 7,  label: t('months.jul') }, { value: 8,  label: t('months.aug') },
    { value: 9,  label: t('months.sep') }, { value: 10, label: t('months.oct') },
    { value: 11, label: t('months.nov') }, { value: 12, label: t('months.dec') },
  ], [i18n.language]);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const user = JSON.parse(localStorage.getItem("user"));

  // Fetch aggregated stats for ALL services belonging to this chef
  const fetchStats = useCallback(async (year, month) => {
    setLoading(true);
    try {
      const params = {};
      if (year) params.year = year;
      if (month) params.month = month;
      const res = await axios.get(`http://localhost:3001/api/chef/stats/${user.id}`, { params });
      setStats(res.data);
    } catch (err) {
      console.error("Erreur stats chef:", err);
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
    const order = MONTHS.map(m => m.label);
    if (selectedMonth) return stats.monthlyStats;
    return [...stats.monthlyStats].sort((a, b) => order.indexOf(a.month) - order.indexOf(b.month));
  }, [stats, selectedMonth, MONTHS]);

  const avgMonthly = useMemo(() => {
    if (!sortedMonthlyStats.length) return 0;
    return Math.round(sortedMonthlyStats.reduce((s, m) => s + m.value, 0) / sortedMonthlyStats.length);
  }, [sortedMonthlyStats]);

  const filterLabel = useMemo(() => {
    if (!selectedYear && !selectedMonth) return t('filter.allPeriods');
    if (selectedYear && selectedMonth) {
      const mLabel = MONTHS.find(m => m.value === parseInt(selectedMonth))?.label;
      return `${mLabel} ${selectedYear}`;
    }
    if (selectedYear) return `${t('filter.year')} ${selectedYear}`;
    return '';
  }, [selectedYear, selectedMonth, t, MONTHS]);

  // ── Export PDF ────────────────────────────────────────────────────────────
  const exportPDF = () => {
    if (!stats) return;
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(20);
    doc.text(t('global.pdf.reportTitle'), 40, 50);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${t('pdf.period')} : ${filterLabel}`, 40, 72);
    autoTable(doc, {
      startY: 90,
      head: [[t('pdf.indicator'), t('pdf.value')]],
      body: [
        [t('global.pdf.totalAllServices'),      stats.totalTickets],
        [t('global.pdf.resolutionAllServices'),  `${stats.resolutionRate}%`],
        [t('pdf.resolvedTickets'),               stats.resolvedCount],
        [t('pdf.slaIn'),                         stats.slaStats[0].value],
        [t('pdf.slaOut'),                        stats.slaStats[1].value],
      ],
      theme: 'striped'
    });
    if (stats.serviceBreakdown?.length) {
      doc.text(t('section.servicePerformance'), 40, doc.lastAutoTable.finalY + 30);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 40,
        head: [[t('table.service'), t('table.totalTickets'), t('table.resolutionRate')]],
        body: stats.serviceBreakdown.map(s => [s.name, s.totalTickets, `${s.resolutionRate}%`]),
        headStyles: { fillColor: [99, 102, 241] }
      });
    }
    doc.text(t('pdf.techPerf'), 40, doc.lastAutoTable.finalY + 30);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 40,
      head: [[t('table.technician'), t('table.service'), t('table.assigned'), t('table.resolved'), t('table.rejected'), t('table.resolutionRate')]],
      body: stats.techPerformance.map(tech => [tech.name, tech.serviceName || '', tech.totalAssigned, tech.resolu, tech.rejete, `${tech.resolutionRate}%`]),
      headStyles: { fillColor: [99, 102, 241] }
    });
    doc.text(t('chart.currentStatus'), 40, doc.lastAutoTable.finalY + 30);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 40,
      head: [[t('table.status'), t('table.count')]],
      body: stats.statusStats.map(s => [s.name, s.value]),
    });
    doc.save(`${t('global.pdf.reportFile')}_${filterLabel.replace(/\s/g, '_')}.pdf`);
  };

  // ── Export Excel ──────────────────────────────────────────────────────────
  const exportExcel = () => {
    if (!stats) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { [t('pdf.indicator')]: t('global.pdf.totalAllServices'),     [t('pdf.value')]: stats.totalTickets },
      { [t('pdf.indicator')]: t('global.pdf.resolutionAllServices'), [t('pdf.value')]: `${stats.resolutionRate}%` },
      { [t('pdf.indicator')]: t('pdf.resolvedTickets'),              [t('pdf.value')]: stats.resolvedCount },
      { [t('pdf.indicator')]: t('pdf.slaConform'),                   [t('pdf.value')]: stats.slaStats[0].value },
      { [t('pdf.indicator')]: t('pdf.slaExceeded'),                  [t('pdf.value')]: stats.slaStats[1].value },
      { [t('pdf.indicator')]: t('pdf.period'),                       [t('pdf.value')]: filterLabel },
    ]), "KPIs");
    if (stats.serviceBreakdown?.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
        stats.serviceBreakdown.map(s => ({
          [t('table.service')]:        s.name,
          [t('table.totalTickets')]:   s.totalTickets,
          [t('table.resolutionRate')]: `${s.resolutionRate}%`
        }))
      ), t('excel.services'));
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.statusStats), t('excel.statuses'));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      stats.techPerformance.map(tech => ({
        [t('table.technician')]:     tech.name,
        [t('table.service')]:        tech.serviceName || '',
        [t('table.assigned')]:       tech.totalAssigned,
        [t('table.resolved')]:       tech.resolu,
        [t('table.rejected')]:       tech.rejete,
        [t('table.resolutionRate')]: `${tech.resolutionRate}%`
      }))
    ), t('excel.technicians'));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.priorityStats), t('excel.priorities'));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sortedMonthlyStats), t('excel.trends'));
    XLSX.writeFile(wb, `${t('global.excel.statsFile')}_${filterLabel.replace(/\s/g, '_')}.xlsx`);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!stats && loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f7' }}>
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <div style={{ width: 44, height: 44, border: '3px solid #6366f1', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>{t('loading.dashboard')}</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (!stats) return null;

  const slaIn  = stats.slaStats[0].value;
  const slaOut = stats.slaStats[1].value;
  const slaPct = Math.round((slaIn / (slaIn + slaOut || 1)) * 100);

  const techTableData = stats.techPerformance;

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7', padding: '28px 32px', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>  <style>{`
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
           <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 px' }}>
            {t('dashboard.title')}
          </h1>
          <p style={{ fontSize: 14, color: '#43464c', margin: 0, fontWeight: 530 }}>
            {t('global.header.subtitle')} · {stats.serviceNames || ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="pp-btn" onClick={exportExcel} style={{ background: '#f0fdf4', color: '#15803d', border: '1.5px solid #bbf7d0' }}>
            <MdFileDownload size={17} /> {t('export.excel')}
          </button>
          <button className="pp-btn" onClick={exportPDF} style={{ background: '#0f172a', color: '#fff' }}>
            <MdFileDownload size={17} /> {t('export.pdf')}
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="pp-card" style={{ marginBottom: 22, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 13, fontWeight: 700 }}>
          <MdFilterList size={18} color="#6366f1" />
          {t('filter.filterBy')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('filter.year')}</label>
          <select className="pp-filter-select" value={selectedYear} onChange={handleYearChange}>
            <option value="">{t('filter.all')}</option>
            {(stats.availableYears || []).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('filter.month')}</label>
          <select className="pp-filter-select" value={selectedMonth} onChange={handleMonthChange} disabled={!selectedYear}>
            <option value="">{t('filter.allMonths')}</option>
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        {(selectedYear || selectedMonth) && (
          <button className="pp-clear-btn" onClick={clearFilters} style={{ marginTop: 18 }}>✕ {t('filter.reset')}</button>
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
        <KpiCard label={t('kpi.total')}          desc={t('kpi.totalDesc')}         value={stats.totalTickets}         color="#6366f1" />
        <KpiCard label={t('kpi.resolutionRate')}  desc={t('kpi.resolutionRateDesc')} value={`${stats.resolutionRate}%`} color="#8b5cf6" />
        <KpiCard label={t('kpi.resolved')}        desc={t('kpi.resolvedDesc')}      value={stats.resolvedCount}        color="#0891b2" />
        <KpiCard label={t('kpi.slaIn')}           desc={t('kpi.slaInDesc')}         value={slaIn}                     color="#10b981" />
        <KpiCard label={t('kpi.slaOut')}          desc={t('kpi.slaOutDesc')}        value={slaOut}                    color="#ef4444" />
      </div>

      {/* ── Section: Répartition des flux ── */}
      <p className="pp-section-title">{t('global.section.flowDistributionAll')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22, alignItems: 'stretch' }}>

        {/* État Actuel des Tickets — Bar Chart */}
        <div className="pp-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <p className="pp-chart-title">{t('chart.currentStatus')}</p>
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

        {/* Répartition par Type — Pie Chart */}
        <div className="pp-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <p className="pp-chart-title">{t('chart.typeDistribution')}</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={stats.typeStats ?? []}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                labelLine={false}
                label={renderPieLabel}
              >
                {(stats.typeStats ?? []).map((entry, index) => (
                  <Cell key={index} fill={getDynamicColor(entry.name, index)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} ticket${value > 1 ? 's' : ''}`, name]}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 12px', marginTop: 12 }}>
            {(stats.typeStats ?? []).map((item, i) => (
              <Indicator key={i} color={getDynamicColor(item.name, i)} label={`${item.name}: ${item.value} (${item.percentage}%)`} />
            ))}
          </div>
        </div>

      </div>

      {/* ── Section: Performance par Service ── */}
      {stats.serviceBreakdown?.length > 0 && (
        <>
          <p className="pp-section-title">{t('section.servicePerformance')}</p>
          <div className="pp-card" style={{ marginBottom: 22, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left',   padding: '8px 12px', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('table.service')}</th>
                  <th style={{ textAlign: 'center', padding: '8px 12px', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('table.totalTickets')}</th>
                  <th style={{ textAlign: 'center', padding: '8px 12px', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('table.resolutionRate')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.serviceBreakdown.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>{s.totalTickets}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{ background: s.resolutionRate >= 70 ? '#dcfce7' : s.resolutionRate >= 40 ? '#fef9c3' : '#fee2e2', color: s.resolutionRate >= 70 ? '#15803d' : s.resolutionRate >= 40 ? '#a16207' : '#b91c1c', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                        {s.resolutionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Section: Performance Techniciens ── */}
      {stats.techPerformance?.length > 0 && (
        <>
          <p className="pp-section-title">{t('global.section.techPerfAll')}</p>
          <div className="pp-card" style={{ marginBottom: 22, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left',   padding: '8px 12px', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('table.technician')}</th>
                  <th style={{ textAlign: 'left',   padding: '8px 12px', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('table.service')}</th>
                  <th style={{ textAlign: 'center', padding: '8px 12px', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('table.assigned')}</th>
                  <th style={{ textAlign: 'center', padding: '8px 12px', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('table.resolved')}</th>
                  <th style={{ textAlign: 'center', padding: '8px 12px', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('table.rejected')}</th>
                  <th style={{ textAlign: 'center', padding: '8px 12px', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('table.resolutionRate')}</th>
                </tr>
              </thead>
              <tbody>
                {techTableData.map((tech, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#6366f1', flexShrink: 0 }}>
                          {tech.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        {tech.name}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12 }}>{tech.serviceName || '—'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>{tech.totalAssigned}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#10b981', fontWeight: 700 }}>{tech.resolu}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#ef4444', fontWeight: 700 }}>{tech.rejete}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{ background: tech.resolutionRate >= 70 ? '#dcfce7' : tech.resolutionRate >= 40 ? '#fef9c3' : '#fee2e2', color: tech.resolutionRate >= 70 ? '#15803d' : tech.resolutionRate >= 40 ? '#a16207' : '#b91c1c', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                        {tech.resolutionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Section: Répartition par Catégorie ── */}
      {stats.categoryStats?.length > 0 && (
        <>
          <p className="pp-section-title">{t('global.section.categoryAll')}</p>
          <div className="pp-card" style={{ marginBottom: 22 }}>
            <p className="pp-chart-title">{t('chart.ticketsByCategory')}</p>
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
      <p className="pp-section-title">{t('global.section.timeTrendsAll')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Area chart — Monthly / Daily trend */}
        <div className="pp-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <p className="pp-chart-title" style={{ marginBottom: 2 }}>
                {selectedMonth
                  ? `${t('chart.dailyEvolution')} — ${MONTHS.find(m => m.value === parseInt(selectedMonth))?.label} ${selectedYear}`
                  : `${t('chart.monthlyEvolution')} ${selectedYear || new Date().getFullYear()}`}
              </p>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>📅 {filterLabel}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px' }}>{t('chart.total')}: <strong style={{ color: '#1e293b' }}>{stats.totalTickets}</strong></p>
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
              <ReferenceLine y={avgMonthly} stroke="#a5b4fc" strokeDasharray="4 3" label={{ position: 'right', value: t('chart.avg'), fill: '#a5b4fc', fontSize: 10 }} />
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

function KpiCard({ label, desc, value, color }) {
  return (
    <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #e2e8f0', borderLeft: `4px solid ${color}` }}>
      <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ fontSize: 10, color: '#cbd5e1', margin: '0 0 8px', fontStyle: 'italic' }}>{desc}</p>
      <p style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1 }}>{value}</p>
    </div>
  );
}