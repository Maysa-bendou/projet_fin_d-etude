import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, ReferenceLine, LabelList
} from 'recharts';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';
import { MdFileDownload, MdPeople, MdFilterList, MdDashboard, MdConfirmationNumber, MdPercent, MdCheckCircle, MdTimer, MdTimerOff, MdArrowBack } from 'react-icons/md';
import { MdCalendarMonth, MdCalendarViewMonth, MdOutlineInfo  } from 'react-icons/md';

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

// ── Custom chart sub-components ───────────────────────────────────────────────
const BarTopLabel = ({ x, y, width, value }) => {
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 5} fill="#64748b" fontSize={11} fontWeight={600} textAnchor="middle">
      {value}
    </text>
  );
};

const AreaDot = ({ cx, cy, value }) => {
  if (!value) return null;
  return <circle cx={cx} cy={cy} r={4} fill="#6366f1" stroke="#fff" strokeWidth={2} />;
};

const AreaValueLabel = ({ x, y, value }) => {
  if (!value) return null;
  return <text x={x} y={y - 10} fill="#6366f1" fontSize={10} fontWeight={700} textAnchor="middle">{value}</text>;
};

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

// ── Shared sub-components ─────────────────────────────────────────────────────
function Indicator({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#475569', fontWeight: 500, whiteSpace: 'nowrap' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
      {label}
    </span>
  );
}

function KpiCard({ label, desc, value, color, bg, border, Icon }) {
  return (
    <div style={{
      background: "#fff",
      border: `1.5px solid ${border}`,
      borderRadius: 16,
      padding: "18px 20px",
      boxShadow: `0 1px 3px #0001, inset 0 0 0 999px ${bg}30`,
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    }}>
      <div>
        <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.5px" }}>
          {label}
        </p>
        <p style={{ margin: 0, fontSize: 34, fontWeight: 800, color: color, lineHeight: 1 }}>{value}</p>
      </div>
      <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 10, padding: 8 }}>
        <Icon size={18} color={color} />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RepartitionPage() {
  // Single namespace — access common via "common:key" prefix, same as PerformancesPage
  const { t, i18n } = useTranslation('chef');

  // Translation helpers — use "common:" prefix through the same t() function
  // This is the pattern that works in PerformancesPage
  const tStatus   = useCallback((key) => t(`common:status.${key?.toLowerCase()}`,   { defaultValue: key }), [t]);
  const tPriority = useCallback((key) => t(`common:priority.${key?.toLowerCase()}`, { defaultValue: key }), [t]);
  const tCategory = useCallback((key) => t(`common:category.${key?.toLowerCase()}`, { defaultValue: key }), [t]);

  // Month list — use i18n.language directly, same as PerformancesPage
  const MONTHS = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i, 1).toLocaleString(i18n.language, { month: 'long' }),
  })), [i18n.language]);

  // Abbreviated month labels for X-axis
  const MONTH_SHORT = useMemo(() => Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleString(i18n.language, { month: 'short' })
  ), [i18n.language]);

  // Lookup table for ALL month names in both locales — same robust approach as PerformancesPage
  const monthStringToIndex = useMemo(() => {
    const map = {};
    ['fr-FR', 'en-US'].forEach(locale => {
      for (let i = 0; i < 12; i++) {
        const label = new Date(2000, i, 1).toLocaleString(locale, { month: 'long' }).toLowerCase();
        map[label] = i;
        const short = new Date(2000, i, 1).toLocaleString(locale, { month: 'short' }).toLowerCase();
        map[short] = i;
      }
    });
    // Also map numeric strings "1"–"12"
    for (let i = 0; i < 12; i++) map[String(i + 1)] = i;
    return map;
  }, []);

  const MONTH_ORDER = MONTHS.map(m => m.label);

  const [services, setServices]                   = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [stats, setStats]                         = useState(null);
  const [loadingServices, setLoadingServices]     = useState(true);
  const [loadingStats, setLoadingStats]           = useState(false);

  const [selectedYear, setSelectedYear]   = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  // ── Fetch service list ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/services');
        const data = res.data;
        const raw = Array.isArray(data) ? data : (data.services || []);
        setServices(raw.filter(s => s.id !== 0));
      } catch (err) {
        console.error("Erreur services:", err);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  // ── Fetch stats for the selected service ─────────────────────────────────
  const fetchStats = useCallback(async (serviceId, year, month) => {
    if (!serviceId) return;
    setLoadingStats(true);
    try {
      const params = {};
      if (year)  params.year  = year;
      if (month) params.month = month;
      const res = await axios.get(
        `http://localhost:3001/api/chef/stats/service/${serviceId}`,
        { params }
      );
      setStats(res.data);
    } catch (err) {
      console.error("Erreur stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(selectedServiceId, selectedYear, selectedMonth);
  }, [selectedServiceId, selectedYear, selectedMonth, fetchStats]);

  // ── Filter handlers ───────────────────────────────────────────────────────
  const handleYearChange  = (e) => { setSelectedYear(e.target.value); if (!e.target.value) setSelectedMonth(''); };
  const handleMonthChange = (e) => setSelectedMonth(e.target.value);
  const clearFilters      = () => { setSelectedYear(''); setSelectedMonth(''); };

  const handleSelectService = (id) => {
    setSelectedServiceId(id);
    setStats(null);
    setSelectedYear('');
    setSelectedMonth('');
  };

  const handleBack = () => {
    setSelectedServiceId(null);
    setStats(null);
    setSelectedYear('');
    setSelectedMonth('');
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  // Same robust approach as PerformancesPage: sort + translate month labels
  const sortedMonthlyStats = useMemo(() => {
    if (!stats?.monthlyStats) return [];
    const toIdx = (raw) => monthStringToIndex[raw?.toLowerCase()] ?? 99;
    const toLabel = (raw) => MONTH_SHORT[monthStringToIndex[raw?.toLowerCase()] ?? 0] ?? raw;
    if (selectedMonth) {
      return stats.monthlyStats.map(entry => ({ ...entry, month: toLabel(entry.month) }));
    }
    return [...stats.monthlyStats]
      .sort((a, b) => toIdx(a.month) - toIdx(b.month))
      .map(entry => ({ ...entry, month: toLabel(entry.month) }));
  }, [stats, selectedMonth, monthStringToIndex, MONTH_SHORT]);

  const filterLabel = useMemo(() => {
    if (!selectedYear && !selectedMonth) return t('filter.allPeriods');
    if (selectedYear && selectedMonth) {
      const mLabel = MONTHS.find(m => m.value === parseInt(selectedMonth))?.label;
      return `${mLabel} ${selectedYear}`;
    }
    if (selectedYear) return `${t('filter.year')} ${selectedYear}`;
    return '';
  }, [selectedYear, selectedMonth, t, MONTHS]);

  // Translate stat arrays — same helper pattern as PerformancesPage
  const translateStatArray = useCallback((arr, translateFn) => {
    if (!arr) return [];
    return arr.map(item => ({ ...item, label: translateFn(item.name) }));
  }, []);

  // ── Export PDF ────────────────────────────────────────────────────────────
  const exportPDF = () => {
    if (!stats) return;
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(20);
    doc.text(`${t('pdf.reportTitle')} : ${stats.serviceName}`, 40, 50);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${t('pdf.period')} : ${filterLabel}`, 40, 72);
    autoTable(doc, {
      startY: 90,
      head: [[t('pdf.indicator'), t('pdf.value')]],
      body: [
        [t('pdf.totalTickets'),     stats.totalTickets],
        [t('pdf.resolutionRate'),   `${stats.resolutionRate}%`],
        [t('pdf.slaIn'),            stats.slaStats?.[0]?.value ?? 0],
        [t('pdf.slaOut'),           stats.slaStats?.[1]?.value ?? 0],
      ],
      theme: 'striped'
    });
    if (stats.techPerformance?.length) {
      doc.text(t('pdf.techPerf'), 40, doc.lastAutoTable.finalY + 30);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 40,
        head: [[t('table.technician'), t('table.assigned'), t('table.resolved'), t('table.rejected'), t('table.resolutionRate')]],
        body: stats.techPerformance.map(tech => [tech.name, tech.totalAssigned, tech.resolu, tech.rejete, `${tech.resolutionRate}%`]),
        headStyles: { fillColor: [99, 102, 241] }
      });
    }
    doc.save(`${t('pdf.reportFile')}_${stats.serviceName}_${filterLabel.replace(/\s/g, '_')}.pdf`);
  };

  // ── Export Excel ──────────────────────────────────────────────────────────
  const exportExcel = () => {
    if (!stats) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { [t('pdf.indicator')]: t('pdf.totalTickets'),   [t('pdf.value')]: stats.totalTickets },
      { [t('pdf.indicator')]: t('pdf.resolutionRate'), [t('pdf.value')]: `${stats.resolutionRate}%` },
      { [t('pdf.indicator')]: t('pdf.slaConform'),     [t('pdf.value')]: stats.slaStats?.[0]?.value ?? 0 },
      { [t('pdf.indicator')]: t('pdf.slaExceeded'),    [t('pdf.value')]: stats.slaStats?.[1]?.value ?? 0 },
      { [t('pdf.indicator')]: t('pdf.period'),         [t('pdf.value')]: filterLabel },
    ]), "KPIs");
    if (stats.statusStats?.length)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.statusStats), t('excel.statuses'));
    if (stats.techPerformance?.length)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
        stats.techPerformance.map(tech => ({
          [t('table.technician')]:     tech.name,
          [t('table.assigned')]:       tech.totalAssigned,
          [t('table.resolved')]:       tech.resolu,
          [t('table.rejected')]:       tech.rejete,
          [t('table.resolutionRate')]: `${tech.resolutionRate}%`
        }))
      ), t('excel.technicians'));
    if (stats.priorityStats?.length)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.priorityStats), t('excel.priorities'));
    if (sortedMonthlyStats.length)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sortedMonthlyStats), t('excel.trends'));
    XLSX.writeFile(wb, `${t('excel.statsFile')}_${stats.serviceName}_${filterLabel.replace(/\s/g, '_')}.xlsx`);
  };

  // ── Global styles ─────────────────────────────────────────────────────────
  const globalStyles = `
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
    .service-card { background: #fff; border: 1px solid #e5e7eb; border-left: 4px solid #6366f1; border-radius: 14px; padding: 20px 24px; cursor: pointer; transition: box-shadow 0.2s, transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .service-card:hover { box-shadow: 0 8px 24px rgba(99,102,241,0.14); transform: translateY(-2px); }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;

  // ── RENDER: Loading services ──────────────────────────────────────────────
  if (loadingServices) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', color: '#64748b', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ width: 44, height: 44, border: '3px solid #6366f1', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontWeight: 600 }}>{t('loading.services')}</p>
      </div>
    </div>
  );

  // ── VIEW 1: SERVICE SELECTION GRID ────────────────────────────────────────
  if (!selectedServiceId) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: "sans-serif" }}>
  <style>{globalStyles}</style>
  <div style={{ borderBottom: '1px solid #e8e2d9', padding: '14px 28px' }}>
    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>
      {t('repartition.title')}
    </h1>
    <p style={{ fontSize: 14, color: '#53575c', margin: 0, fontWeight: 530 }}>
      {t('repartition.subtitle')}
    </p>
  </div>
  <div style={{ padding: '20px 28px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
  {services.map((s, i) => {
    const colors = [
      { bg: '#eff6ff', border: '#bfdbfe', icon: '#3b82f6', text: '#1d4ed8' },
      { bg: '#f5f3ff', border: '#ddd6fe', icon: '#8b5cf6', text: '#6d28d9' },
      { bg: '#f0fdf4', border: '#a7f3d0', icon: '#10b981', text: '#047857' },
      { bg: '#fff7ed', border: '#fed7aa', icon: '#f97316', text: '#c2410c' },
      { bg: '#fdf2f8', border: '#f5d0fe', icon: '#a855f7', text: '#7e22ce' },
    ];
    const c = colors[i % colors.length];
    const initials = s.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    return (
      <div
        key={s.id}
        onClick={() => handleSelectService(s.id)}
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          padding: '22px 24px',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s, transform 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        {/* Icon */}
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: c.bg, border: `1.5px solid ${c.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 800, color: c.icon,
          marginBottom: 16,
        }}>
          {initials}
        </div>

        {/* Name */}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
          {s.name}
        </h3>

        {/* Stats avec Icône */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontWeight: 500 }}>
            {s.resolutionRate ?? 0}% {t('repartition.resolved')}
          </p>
        </div>

        {/* Barre de progression */}
        <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ 
            width: `${s.resolutionRate ?? 0}%`, 
            height: '100%', 
            background: '#10b981',
            borderRadius: 10,
            transition: 'width 1s ease-in-out'
          }} />
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t('repartition.analyze')} →
          </span>
          <div style={{
            background: c.bg, border: `1px solid ${c.border}`,
            borderRadius: 20, padding: '3px 10px',
            fontSize: 11, fontWeight: 700, color: c.icon,
          }}>
            {s.totalTickets ?? 0} tickets
          </div>
        </div>
      </div>
    );
  })}
</div>
  </div>     
</div>       
    
    );
  }

  // ── LOADING STATS ─────────────────────────────────────────────────────────
  if (loadingStats && !stats) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', color: '#64748b', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ width: 44, height: 44, border: '3px solid #6366f1', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontWeight: 600 }}>{t('loading.dashboard')}</p>
      </div>
    </div>
  );

  if (!stats) return null;

  // ── Derived values for VIEW 2 ─────────────────────────────────────────────
  const slaIn  = stats.slaStats?.[0]?.value ?? 0;
  const slaOut = stats.slaStats?.[1]?.value ?? 0;
  const resolvedCount  = stats.resolvedCount  ?? 0;
  const resolutionRate = stats.resolutionRate ?? 0;

  const techTableData = (stats.techPerformance || []).map(tech => ({
    ...tech,
    tauxParService: stats.totalTickets > 0 ? Math.round((tech.totalAssigned / stats.totalTickets) * 100) : 0,
  }));

  // FIX: pre-translate all chart data sets so X-axis labels + legends both use active language
  // Pre-translate all chart arrays — using translateStatArray + common: prefix helpers
  const statusStatsT   = translateStatArray(stats.statusStats,   tStatus);
  const categoryStatsT = translateStatArray(stats.categoryStats, tCategory);
  const priorityStatsT = translateStatArray(stats.priorityStats, tPriority);
  const typeStatsT     = translateStatArray(stats.typeStats,     (name) => t(`common:type.${name?.toLowerCase()}`, { defaultValue: name }));

  // ── VIEW 2: FULL STATS DASHBOARD ─────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: "sans-serif" }}>
  <style>{globalStyles}</style>

  {/* ── Header ── */}
  <div style={{ borderBottom: '1px solid #e8e2d9', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div>
      <button
        onClick={handleBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
          cursor: 'pointer', color: '#94a3b8', fontSize: 12, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, padding: 0,
          fontFamily: 'inherit'
        }}
      >
        <MdArrowBack style={{ fontSize: 14 }} /> {t('repartition.backToServices')}
      </button>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 0px' }}>
        {t('dashboard.title')}
      </h1>
      <p style={{ fontSize: 14, color: '#53575c', margin: 0, fontWeight: 530 }}>
        {stats.serviceName} · {t('dashboard.detailedView')}
      </p>
    </div>
    <div style={{ display: 'flex', gap: 10 }}>
      <button className="pp-btn" onClick={exportExcel} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1.5px solid #bfdbfe' }}>
        <MdFileDownload size={17} /> {t('export.excel')}
      </button>
      <button className="pp-btn" onClick={exportPDF} style={{ background: '#1e3a8a', color: '#fff', border: 'none' }}>
        <MdFileDownload size={17} /> {t('export.pdf')}
      </button>
    </div>
  </div>

 <div style={{ padding: '20px 28px' }}>
      {/* ── Filter Bar ── */}
      <div className="pp-card" style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>

  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 13, fontWeight: 700 }}>
    <MdFilterList size={18} color="#1e3a8a" />
    {t('filter.filterBy')}
  </div>

  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
      <MdCalendarMonth size={12} color="#94a3b8" /> {t('filter.year')}
    </label>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <MdCalendarMonth size={14} color="#94a3b8" style={{ position: 'absolute', left: 9, pointerEvents: 'none', zIndex: 1 }} />
      <select className="pp-filter-select" value={selectedYear} onChange={handleYearChange} style={{ paddingLeft: 28 }}>
        <option value="">{t('filter.all')}</option>
        {(stats.availableYears || []).map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  </div>

  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
      <MdCalendarViewMonth size={12} color="#94a3b8" /> {t('filter.month')}
    </label>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <MdCalendarViewMonth size={14} color="#94a3b8" style={{ position: 'absolute', left: 9, pointerEvents: 'none', zIndex: 1 }} />
      {/* FIX: month dropdown uses locale-aware MONTHS array */}
      <select className="pp-filter-select" value={selectedMonth} onChange={handleMonthChange} disabled={!selectedYear} style={{ paddingLeft: 28 }}>
        <option value="">{t('filter.allMonths')}</option>
        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
    </div>
  </div>

  {(selectedYear || selectedMonth) && (
    <button className="pp-clear-btn" onClick={clearFilters} style={{ marginTop: 18 }}>
      ✕ {t('filter.reset')}
    </button>
  )}

  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
    <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
      <MdCalendarMonth size={14} color="#94a3b8" /> {filterLabel}
    </span>
    {loadingStats && (
      <span style={{ width: 18, height: 18, border: '2.5px solid #6366f1', borderTop: '2.5px solid transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
    )}
  </div>

</div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        {/* FIX: KPI labels already come from chef namespace — no change needed */}
        <KpiCard label={t('kpi.total')}         value={stats.totalTickets}         color="#6366f1" bg="#eff0ff" border="#c7d2fe" Icon={MdConfirmationNumber} />
        <KpiCard label={t('kpi.resolutionRate')} value={`${stats.resolutionRate}%`} color="#8b5cf6" bg="#f5f3ff" border="#ddd6fe" Icon={MdPercent}            />
        <KpiCard label={t('kpi.resolved')}       value={stats.resolvedCount}        color="#0891b2" bg="#ecfeff" border="#a5f3fc" Icon={MdCheckCircle}         />
        <KpiCard label={t('kpi.slaIn')}          value={slaIn}                      color="#10b981" bg="#f0fdf4" border="#a7f3d0" Icon={MdTimer}              />
        <KpiCard label={t('kpi.slaOut')}         value={slaOut}                     color="#ef4444" bg="#fef2f2" border="#fecaca" Icon={MdTimerOff}            />
      </div>

      {/* ── Section: Efficacité Équipe ── */}
      <p className="pp-section-title">{t('section.teamEfficiency')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>

        {/* Bar chart: Volume par Technicien */}
        <div className="pp-card">
          <p className="pp-chart-title">{t('chart.workloadByTech')}</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.techPerformance} barCategoryGap="30%" barGap={3}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} interval={0} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Bar dataKey="resolu" name={t('table.resolved')} fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={22}>
                <LabelList content={<BarTopLabel />} />
              </Bar>
              <Bar dataKey="rejete" name={t('table.rejected')} fill="#f43f5e" radius={[5, 5, 0, 0]} maxBarSize={22}>
                <LabelList content={<BarTopLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: 10 }}>
            <Indicator color="#10b981" label={t('table.resolved')} />
            <Indicator color="#f43f5e" label={t('table.rejected')} />
          </div>
        </div>

        {/* Technician Table */}
        <div className="pp-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MdPeople color="#6366f1" size={17} /> {t('chart.techDetail')}
            </p>
            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
              {t('chart.rateFormula')}
            </span>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 280 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                  {[t('table.technician'), t('table.assigned'), t('table.resolved'), t('table.resolutionRate')].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: h === t('table.technician') ? 'left' : 'center', color: '#64748b', fontWeight: 700, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {techTableData.map((tech, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '11px 14px', fontWeight: 600, color: '#1e293b' }}>{tech.name}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>{tech.totalAssigned}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                      <span style={{ background: '#d1fae5', color: '#059669', borderRadius: 7, padding: '2px 10px', fontWeight: 700, fontSize: 12 }}>{tech.resolu}</span>
                    </td>
                    <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                        <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 3, maxWidth: 70 }}>
                          <div style={{
                            width: `${tech.resolutionRate}%`, height: '100%', borderRadius: 3,
                            background: tech.resolutionRate >= 70 ? '#10b981' : tech.resolutionRate >= 40 ? '#f59e0b' : '#ef4444',
                            transition: 'width 0.6s ease'
                          }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12, minWidth: 36, color: tech.resolutionRate >= 70 ? '#059669' : tech.resolutionRate >= 40 ? '#d97706' : '#dc2626' }}>
                          {tech.resolutionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {techTableData.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>{t('table.noTech')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
            <Indicator color="#10b981" label={t('legend.excellent')} />
            <Indicator color="#f59e0b" label={t('legend.average')} />
            <Indicator color="#ef4444" label={t('legend.weak')} />
          </div>
        </div>
      </div>

      {/* ── Section: Répartition des flux ── */}
      <p className="pp-section-title">{t('section.flowDistribution')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>

        {/* État Actuel des Tickets — Bar Chart */}
        {/* FIX: use statusStatsT with translated `label` field for X-axis and legend */}
        <div className="pp-card">
          <p className="pp-chart-title">{t('chart.currentStatus')}</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusStatsT} barCategoryGap="35%" margin={{ bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                axisLine={false} tickLine={false} interval={0}
                tick={{ fontSize: 10, fill: '#64748b' }} angle={-35} textAnchor="end" height={60}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={36}>
                {statusStatsT.map((entry, index) => (
                  <Cell key={index} fill={getDynamicColor(entry.name, index)} />
                ))}
                <LabelList content={<BarTopLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: statusStatsT.length > 3 ? 'repeat(2, 1fr)' : '1fr', gap: '4px 12px', marginTop: 12 }}>
            {statusStatsT.map((s, i) => (
              // FIX: legend label uses translated s.label instead of raw s.name
              <Indicator key={i} color={getDynamicColor(s.name, i)} label={`${s.label}: ${s.value}`} />
            ))}
          </div>
        </div>

        {/* Distribution par Type — Pie Chart */}
        {/* FIX: use typeStatsT with translated `label` field for legend */}
        <div className="pp-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <p className="pp-chart-title">{t('chart.typeDistribution')}</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={typeStatsT}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={100}
                labelLine={false}
                label={renderPieLabel}
              >
                {typeStatsT.map((entry, index) => (
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
            {typeStatsT.map((item, i) => (
              // FIX: legend label uses translated item.label
              <Indicator key={i} color={getDynamicColor(item.name, i)} label={`${item.label}: ${item.value} (${item.percentage}%)`} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Section: Répartition par Catégorie ── */}
      {/* FIX: use categoryStatsT with translated `label` field for X-axis and legend */}
      {(categoryStatsT.length > 0) && (
        <>
          <p className="pp-section-title">{t('section.categoryDistribution')}</p>
          <div className="pp-card" style={{ marginBottom: 22 }}>
            <p className="pp-chart-title">{t('chart.ticketsByCategory')}</p>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={categoryStatsT} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {categoryStatsT.map((entry, index) => (
                    <Cell key={index} fill={getDynamicColor(entry.name, index)} />
                  ))}
                  <LabelList content={<BarTopLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gridTemplateColumns: categoryStatsT.length > 3 ? 'repeat(2, 1fr)' : '1fr', gap: '4px 12px', marginTop: 12 }}>
              {categoryStatsT.map((c, i) => (
                // FIX: legend label uses translated c.label
                <Indicator key={i} color={getDynamicColor(c.name, i)} label={`${c.label}: ${c.value}`} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Section: Tendances Temporelles ── */}
      <p className="pp-section-title">{t('section.timeTrends')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Area chart — Monthly / Daily trend */}
        {/* FIX: sortedMonthlyStats already has locale-aware `month` labels for X-axis */}
        <div className="pp-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <p className="pp-chart-title" style={{ marginBottom: 2 }}>
                {selectedMonth
                  ? `${t('chart.dailyEvolution')} — ${MONTHS.find(m => m.value === parseInt(selectedMonth))?.label} ${selectedYear}`
                  : `${t('chart.monthlyEvolution')} ${selectedYear || new Date().getFullYear()}`}
              </p>
              <span style={{ fontSize: 11, color: '#94a3b8' }}> <MdCalendarMonth size={12} color="#94a3b8" /> {filterLabel}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                {t('chart.total')}: <strong style={{ color: '#1e293b' }}>{stats.totalTickets}</strong>
              </p>
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
              {/* FIX: dataKey is "month" — already translated to locale-aware short labels */}
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10.5, fill: '#6366f1', fontWeight: 500 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Area
                type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5}
                fillOpacity={1} fill="url(#gradIndigo)"
                dot={<AreaDot />} activeDot={false} label={<AreaValueLabel />}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Priorités — Pie Chart */}
        {/* FIX: use priorityStatsT with translated `label` field for legend */}
        <div className="pp-card">
          <p className="pp-chart-title">{t('chart.priorityDistribution')}</p>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={priorityStatsT} cx="50%" cy="50%"
                innerRadius={55} outerRadius={85} paddingAngle={3}
                dataKey="value" labelLine={false} label={renderPieLabel}
              >
                {priorityStatsT.map((entry, index) => (
                  <Cell key={index} fill={getDynamicColor(entry.name, index)} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: priorityStatsT.length > 3 ? 'repeat(2, 1fr)' : '1fr', gap: '4px 12px', marginTop: 10 }}>
            {priorityStatsT.map((p, i) => (
              // FIX: legend label uses translated p.label
              <Indicator key={i} color={getDynamicColor(p.name, i)} label={`${p.label}: ${p.value}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}