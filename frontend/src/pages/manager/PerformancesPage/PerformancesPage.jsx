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
import { useTranslation } from 'react-i18next';
import { MdConfirmationNumber, MdPercent, MdCheckCircle, MdTimer, MdTimerOff } from 'react-icons/md';
import { MdCalendarMonth, MdOutlineInfo } from 'react-icons/md';
import { MdCalendarViewMonth } from 'react-icons/md';

// ── Color map ──────────────────────────────────────────────────────────────────
const getDynamicColor = (name, index) => {
  const map = {
 'open': '#1d4ed8', 'in_progress': '#7c3aed', 'resolved': '#15803d',
  'closed': '#6b7280', 'rejected': '#dc2626', 'pending': '#a16207',
  'pending_supplier': '#c2410c', 'critical': '#dc2626', 'high': '#ea580c',
  'medium': '#ca8a04', 'low': '#16a34a','incident': '#e11d48', 'demande': '#0ea5e9',
    'problem': '#7c3aed', 'problème': '#7c3aed'
  };
  const palette = ['#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#f97316'];
  return map[name?.toLowerCase()] || palette[index % palette.length];
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function PerformancesPage() {
  const { t, i18n } = useTranslation("manager");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const user = JSON.parse(localStorage.getItem("user"));

  // ── Month names (derived from locale) ─────────────────────────────────────
  const MONTHS = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: new Date(2000, i, 1).toLocaleString(i18n.language, { month: 'long' }),
    }));
  }, [i18n.language]);


  // ── Translation helpers using common.json keys ────────────────────────────
  // These translate backend raw keys (e.g. "open", "high", "hardware") to the
  // current language label. Falls back to the original name if no key found.
  const tStatus   = useCallback((key) => t(`common:status.${key?.toLowerCase()}`,   { defaultValue: key }), [t]);
  const tPriority = useCallback((key) => t(`common:priority.${key?.toLowerCase()}`, { defaultValue: key }), [t]);
  const tCategory = useCallback((key) => t(`common:category.${key?.toLowerCase()}`, { defaultValue: key }), [t]);
  const tUrgency  = useCallback((key) => t(`common:urgency.${key?.toLowerCase()}`,  { defaultValue: key }), [t]);
  const tImpact   = useCallback((key) => t(`common:impact.${key?.toLowerCase()}`,   { defaultValue: key }), [t]);

  // ── Resolve any month string (in any language) → 0-based index ───────────
  // We build a lookup table of ALL 12 months in BOTH supported locales so
  // switching language never breaks the match.
  const monthStringToIndex = useMemo(() => {
    const map = {};
    ['fr-FR', 'en-US'].forEach(locale => {
      for (let i = 0; i < 12; i++) {
        const label = new Date(2000, i, 1).toLocaleString(locale, { month: 'long' }).toLowerCase();
        map[label] = i; // 0-based
      }
    });
    return map;
  }, []);

  // Convert a raw month label (from backend, any locale) → current-locale label
  const tMonth = useCallback((rawLabel) => {
    if (!rawLabel) return rawLabel;
    const idx = monthStringToIndex[rawLabel.toLowerCase()];
    if (idx !== undefined) return MONTHS[idx]?.label ?? rawLabel;
    return rawLabel;
  }, [monthStringToIndex, MONTHS]);

  // ── Translate stat arrays (add a `label` field for display) ───────────────
  const translateStatArray = useCallback((arr, translateFn) => {
    if (!arr) return [];
    return arr.map((item) => ({
      ...item,
      label: translateFn(item.name),
    }));
  }, []);

  const fetchStats = useCallback(async (year, month) => {
    setLoading(true);
    try {
      const params = {};
      if (year) params.year = year;
      if (month) params.month = month;
      const res = await axios.get(`https://ticket-backend-4uw2.onrender.com/api/manager/stats/${user.id}`, { params });
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
    if (selectedMonth) return stats.monthlyStats;
    // Sort using the language-agnostic monthStringToIndex map
    return [...stats.monthlyStats].sort((a, b) => {
      const idxA = monthStringToIndex[a.month?.toLowerCase()] ?? 99;
      const idxB = monthStringToIndex[b.month?.toLowerCase()] ?? 99;
      return idxA - idxB;
    });
  }, [stats, selectedMonth, monthStringToIndex]);

const translatedMonthlyStats = useMemo(() => {
  return sortedMonthlyStats.map((item) => ({
    ...item,
    month: selectedMonth
      ? item.month?.toString().replace(/^[A-Za-z]+/, i18n.language === 'fr' ? 'j' : 'd')
      : tMonth(item.month),
  }));
}, [sortedMonthlyStats, tMonth, selectedMonth, i18n.language]);

  const avgMonthly = useMemo(() => {
    if (!sortedMonthlyStats.length) return 0;
    return Math.round(sortedMonthlyStats.reduce((s, m) => s + m.value, 0) / sortedMonthlyStats.length);
  }, [sortedMonthlyStats]);

  const filterLabel = useMemo(() => {
    if (!selectedYear && !selectedMonth) return t("performances.filter.allPeriods");
    if (selectedYear && selectedMonth) {
      const mLabel = MONTHS.find(m => m.value === parseInt(selectedMonth))?.label;
      return `${mLabel} ${selectedYear}`;
    }
    if (selectedYear) return `${t("performances.filter.year")} ${selectedYear}`;
    return '';
  }, [selectedYear, selectedMonth, MONTHS, t]);

  // ── KPI Meta (translated) ─────────────────────────────────────────────────
  const KPI_META = useMemo(() => ({
    total:         { motCle: t("performances.kpi.total"),        desc: '' },
    serviceRate:   { motCle: t("performances.kpi.serviceRate"),  desc: '' },
    resolvedCount: { motCle: t("performances.kpi.resolved"),     desc: '' },
    slaIn:         { motCle: t("performances.kpi.slaIn"),        desc: '' },
    slaOut:        { motCle: t("performances.kpi.slaOut"),       desc: '' },
  }), [t]);

  // ── Translated chart data ─────────────────────────────────────────────────
  // We create display-ready arrays with a `label` field for XAxis & legends.
  // The original `name` (raw key) is preserved for color lookup.
  const translatedStatusStats   = useMemo(() => translateStatArray(stats?.statusStats,   tStatus),   [stats, tStatus, translateStatArray]);
  const translatedPriorityStats = useMemo(() => translateStatArray(stats?.priorityStats, tPriority), [stats, tPriority, translateStatArray]);
  const translatedCategoryStats = useMemo(() => translateStatArray(stats?.categoryStats, tCategory), [stats, tCategory, translateStatArray]);
  // typeStats names may be 'incident', 'demande', 'problem' etc. — translate via t() with common namespace fallback
  const translatedTypeStats     = useMemo(() => translateStatArray(stats?.typeStats, (name) => t('common:type.' + name?.toLowerCase(), { defaultValue: name })), [stats, t, translateStatArray]);
  // For urgency / impact — translate if your backend sends those arrays:
  const translatedUrgencyStats  = useMemo(() => translateStatArray(stats?.urgencyStats,  tUrgency),  [stats, tUrgency, translateStatArray]);
  const translatedImpactStats   = useMemo(() => translateStatArray(stats?.impactStats,   tImpact),   [stats, tImpact, translateStatArray]);

// ── Export PDF ────────────────────────────────────────────────────────────
const exportPDF = async () => {
  if (!stats) return;
  const doc = new jsPDF('p', 'pt', 'a4');
  const BLACK = [30, 30, 30];
  const RED = [180, 25, 25];
  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  const MARGIN = 40;

  const tableOptions = {
    headStyles: { fillColor: RED, textColor: [255, 255, 255], fontStyle: 'bold' },
    showHead: 'everyPage',
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 10, cellPadding: 7 },
    alternateRowStyles: { fillColor: [255, 245, 245] },
  };

  // ── helper: ensure enough space before each section ──
  const ensureSpace = (neededHeight) => {
    const currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 160;
    if (currentY + neededHeight > PAGE_HEIGHT - 40) {
      doc.addPage();
      return MARGIN + 20;
    }
    return currentY + 40;  // more space between tables
  };

// ── Logo drawn with jsPDF (no image) ──
  // Triangle rouge
  doc.setFillColor(255, 1, 19);
  doc.triangle(MARGIN, 20, MARGIN, 60, MARGIN + 45, 40, 'F');
  // Text DJEZZY
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('DJEZZY', MARGIN + 8, 36);
  // Text جازی
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('جازی', MARGIN + 10, 50);

  doc.setFontSize(18);
  doc.setTextColor(...BLACK);
  doc.setFont(undefined, 'bold');
  doc.text(`${t("performances.export.reportTitle")} — ${stats.serviceName}`, MARGIN + 60, 36);

  // ── Period subtitle ──
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.setFont(undefined, 'normal');
  doc.text(`${t("performances.export.period")} : ${filterLabel}`, MARGIN + 60, 50);

  // ── Divider line ──
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, 70, PAGE_WIDTH - MARGIN, 70);

  // ── KPIs ──
  autoTable(doc, {
    ...tableOptions,
    startY: 90,
    head: [[t("performances.export.indicator"), t("performances.export.value")]],
    body: [
      [t("performances.export.totalService"),      stats.totalTickets],
      [t("performances.export.resolutionService"), `${stats.resolutionRate}%`],
      [t("performances.export.resolutionGlobal"),  `${stats.globalResolutionRate}%`],
      [t("performances.export.slaIn"),             stats.slaStats[0].value],
      [t("performances.export.slaOut"),            stats.slaStats[1].value],
    ],
    theme: 'striped',
  });

  // ── Section helper ──
const addSection = (title, head, body) => {
  const y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 40 : 160;

  doc.setFontSize(12);
  doc.setTextColor(...BLACK);
  doc.setFont(undefined, 'bold');
  doc.text(title, MARGIN, y);

  autoTable(doc, {
    ...tableOptions,
    startY: y + 14,
    head: [head],
    body,
  });
};

  // ── Technician Details ──
  addSection(
    t("performances.techDetail.title"),
    [
      t("performances.techDetail.tech"),
      t("performances.techDetail.assigned"),
      t("performances.techDetail.resolved"),
      t("performances.techDetail.closed"),
      t("performances.techDetail.rejected"),
      t("performances.techDetail.resolutionRate"),
    ],
    stats.techPerformance.map(tech => [
      tech.name,
      tech.totalAssigned,
      tech.resolu,
      tech.ferme,
      tech.rejete,
      `${tech.resolutionRate}%`,
    ])
  );

  // ── Status Distribution ──
  addSection(
    t("performances.statusDistribution"),
    [t("performances.export.status"), t("performances.export.count")],
    translatedStatusStats.map(s => [s.label, s.value])
  );

  // ── Category Distribution ──
  addSection(
    t("performances.charts.categoryDistribution"),
    [t("performances.export.category"), t("performances.export.count")],
    translatedCategoryStats.map(s => [s.label, s.value])
  );

  // ── Priority Distribution ──
  addSection(
    t("performances.charts.priorityDistribution"),
    [t("performances.export.priority"), t("performances.export.count")],
    translatedPriorityStats.map(s => [s.label, s.value])
  );

  // ── Type Distribution ──
  addSection(
    t("performances.charts.typeDistribution"),
    [t("performances.export.type"), t("performances.export.count")],
    translatedTypeStats.map(s => [s.label, s.value])
  );

  // ── Monthly Trends ──
  addSection(
    t("performances.charts.monthlyEvolution"),
    [t("performances.export.month"), t("performances.export.count")],
    translatedMonthlyStats.map(s => [s.month, s.value])
  );

  // ── Urgency (if exists) ──
  if (translatedUrgencyStats?.length > 0) {
    addSection(
      t("performances.charts.urgencyDistribution"),
      [t("performances.export.urgency"), t("performances.export.count")],
      translatedUrgencyStats.map(s => [s.label, s.value])
    );
  }

  // ── Impact (if exists) ──
  if (translatedImpactStats?.length > 0) {
    addSection(
      t("performances.charts.impactDistribution"),
      [t("performances.export.impact"), t("performances.export.count")],
      translatedImpactStats.map(s => [s.label, s.value])
    );
  }

  doc.save(`Performance_${stats.serviceName}_${filterLabel.replace(/\s/g, '_')}.pdf`);
};

  // ── Export Excel ──────────────────────────────────────────────────────────
  const exportExcel = () => {
    if (!stats) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { [t("performances.export.indicator")]: t("performances.export.totalService"),       [t("performances.export.value")]: stats.totalTickets },
      { [t("performances.export.indicator")]: t("performances.export.resolutionService"),  [t("performances.export.value")]: `${stats.resolutionRate}%` },
      { [t("performances.export.indicator")]: t("performances.export.resolutionGlobal"),   [t("performances.export.value")]: `${stats.globalResolutionRate}%` },
      { [t("performances.export.indicator")]: t("performances.export.slaIn"),              [t("performances.export.value")]: stats.slaStats[0].value },
      { [t("performances.export.indicator")]: t("performances.export.slaOut"),             [t("performances.export.value")]: stats.slaStats[1].value },
      { [t("performances.export.indicator")]: t("performances.filter.allPeriods"),         [t("performances.export.value")]: filterLabel },
    ]), "KPIs");
    // Use translated labels for status sheet
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      translatedStatusStats.map(s => ({ name: s.label, value: s.value }))
    ), t("performances.sheets.statuses"));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      stats.techPerformance.map(tech => ({
        [t("performances.techDetail.tech")]:          tech.name,
        [t("performances.techDetail.assigned")]:      tech.totalAssigned,
        [t("performances.techDetail.resolved")]:      tech.resolu,
        [t("performances.techDetail.closed")]:        tech.ferme,
        [t("performances.techDetail.rejected")]:      tech.rejete,
        [t("performances.techDetail.resolutionRate")]: `${tech.resolutionRate}%`,
      }))
    ), t("performances.sheets.technicians"));
    // Use translated priority labels
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      translatedPriorityStats.map(p => ({ name: p.label, value: p.value }))
    ), t("performances.sheets.priorities"));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(translatedMonthlyStats), t("performances.sheets.trends"));
    // ── Add after priorities sheet (after line 291) ──

// Category sheet
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
  translatedCategoryStats.map(s => ({ name: s.label, value: s.value }))
), t("performances.sheets.categories"));

// Type sheet
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
  translatedTypeStats.map(s => ({ name: s.label, value: s.value }))
), t("performances.sheets.types"));

// Urgency sheet (if exists)
if (translatedUrgencyStats?.length > 0) {
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    translatedUrgencyStats.map(s => ({ name: s.label, value: s.value }))
  ), t("performances.sheets.urgency"));
}

// Impact sheet (if exists)
if (translatedImpactStats?.length > 0) {
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    translatedImpactStats.map(s => ({ name: s.label, value: s.value }))
  ), t("performances.sheets.impact"));
}
    XLSX.writeFile(wb, `Stats_${stats.serviceName}_${filterLabel.replace(/\s/g, '_')}.xlsx`);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!stats && loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <div style={{ width: 44, height: 44, border: '3px solid #6366f1', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>{t("performances.loading")}</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (!stats) return null;

  const slaIn = stats.slaStats[0].value;
  const slaOut = stats.slaStats[1].value;

  const techTableData = stats.techPerformance.map(tech => ({
    ...tech,
    tauxParService: stats.totalTickets > 0 ? Math.round((tech.totalAssigned / stats.totalTickets) * 100) : 0,
  }));

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: "sans-serif" }}>
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
      <div style={{ borderBottom: '1px solid #e8e2d9', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 0px' }}>{t("performances.title")}</h1>
          <p style={{ fontSize: 14, color: '#53575c', margin: 0, fontWeight: 530 }}>{stats.serviceName} · {t("performances.managerView")}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="pp-btn" onClick={exportExcel} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1.5px solid #bfdbfe' }}>
            <MdFileDownload size={17} /> {t("performances.export.excel")}
          </button>
          <button className="pp-btn" onClick={exportPDF} style={{ background: '#1e3a8a', color: '#fff', border: 'none' }}>
            <MdFileDownload size={17} /> {t("performances.export.pdf")}
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 28px' }}>
        {/* ── Filter Bar ── */}
        <div className="pp-card" style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 13, fontWeight: 700 }}>
            <MdFilterList size={18} color="#1e3a8a" />
            {t("performances.filter.filterBy")}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
              <MdCalendarMonth size={12} color="#94a3b8" /> {t("performances.filter.year")}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <MdCalendarMonth size={14} color="#94a3b8" style={{ position: 'absolute', left: 9, pointerEvents: 'none', zIndex: 1 }} />
              <select className="pp-filter-select" value={selectedYear} onChange={handleYearChange} style={{ paddingLeft: 28 }}>
                <option value="">{t("performances.filter.all")}</option>
                {(stats.availableYears || []).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
              <MdCalendarViewMonth size={12} color="#94a3b8" /> {t("performances.filter.month")}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <MdCalendarViewMonth size={14} color="#94a3b8" style={{ position: 'absolute', left: 9, pointerEvents: 'none', zIndex: 1 }} />
              <select className="pp-filter-select" value={selectedMonth} onChange={handleMonthChange} disabled={!selectedYear} style={{ paddingLeft: 28 }}>
                <option value="">{t("performances.filter.all")}</option>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          {(selectedYear || selectedMonth) && (
            <button className="pp-clear-btn" onClick={clearFilters} style={{ marginTop: 18 }}>
              ✕ {t("performances.filter.reset")}
            </button>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
              <MdCalendarMonth size={14} color="#94a3b8" /> {filterLabel}
            </span>
            {loading && (
              <span style={{ width: 18, height: 18, border: '2.5px solid #6366f1', borderTop: '2.5px solid transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
            )}
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
          <KpiCard meta={KPI_META.total}         value={stats.totalTickets}         color="#6366f1" bg="#eff0ff" border="#c7d2fe" Icon={MdConfirmationNumber} />
          <KpiCard meta={KPI_META.serviceRate}   value={`${stats.resolutionRate}%`} color="#8b5cf6" bg="#f5f3ff" border="#ddd6fe" Icon={MdPercent}            />
          <KpiCard meta={KPI_META.resolvedCount} value={stats.resolvedCount}        color="#0891b2" bg="#ecfeff" border="#a5f3fc" Icon={MdCheckCircle}         />
          <KpiCard meta={KPI_META.slaIn}         value={slaIn}                      color="#10b981" bg="#f0fdf4" border="#a7f3d0" Icon={MdTimer}              />
          <KpiCard meta={KPI_META.slaOut}        value={slaOut}                     color="#ef4444" bg="#fef2f2" border="#fecaca" Icon={MdTimerOff}            />
        </div>

        {/* ── Section: Team Efficiency ── */}
        <p className="pp-section-title">{t("performances.sections.teamEfficiency")}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>

          {/* Bar chart: Volume par Technicien */}
          <div className="pp-card">
            <p className="pp-chart-title">{t("performances.charts.workVolume")}</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.techPerformance} barCategoryGap="30%" barGap={3}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
<XAxis
  dataKey="name"
  axisLine={false}
  tickLine={false}
  interval={0}
  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
  angle={-45}
  textAnchor="end"
  height={80}
/>
<YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} tickFormatter={(v) => Number.isInteger(v) ? v : ''} domain={[0, dataMax => Math.ceil(dataMax * 1.2)]} />
                <Bar dataKey="ferme" name={t("performances.techDetail.closed")} fill="#06b6d4" radius={[5, 5, 0, 0]} maxBarSize={22}>
                  <LabelList content={<BarTopLabel />} />
                </Bar>
                <Bar dataKey="rejete" name={t("performances.techDetail.rejected")} fill="#f43f5e" radius={[5, 5, 0, 0]} maxBarSize={22}>
                  <LabelList content={<BarTopLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px', marginTop: 10 }}>
              <Indicator color="#06b6d4" label={t("performances.techDetail.closed")} />
              <Indicator color="#f43f5e" label={t("performances.techDetail.rejected")} />
            </div>
          </div>

          {/* Technician Table */}
          <div className="pp-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MdPeople color="#6366f1" size={17} /> {t("performances.techDetail.title")}
              </p>
              <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
                {t("performances.techDetail.rateNote")}
              </span>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 280 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                    {[
                      t("performances.techDetail.tech"),
                      t("performances.techDetail.assigned"),
                      t("performances.techDetail.resolved"),
                      t("performances.techDetail.resolutionRate"),
                    ].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: h === t("performances.techDetail.tech") ? 'left' : 'center', color: '#64748b', fontWeight: 700, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {techTableData.map((tech, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
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
                    <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>{t("performances.techDetail.noTech")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
              <Indicator color="#10b981" label={`≥ 70% ${t("performances.techDetail.excellent")}`} />
              <Indicator color="#f59e0b" label={`40–69% ${t("performances.techDetail.average")}`} />
              <Indicator color="#ef4444" label={`< 40% ${t("performances.techDetail.weak")}`} />
            </div>
          </div>
        </div>

        {/* ── Section: Flux Distribution ── */}
        <p className="pp-section-title">{t("performances.sections.fluxDistribution")}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>

          {/* État Actuel des Tickets — uses translatedStatusStats for translated X-axis & legend */}
          <div className="pp-card">
            <p className="pp-chart-title">{t("performances.charts.currentStatus")}</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={translatedStatusStats} barCategoryGap="35%" margin={{ bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                />
<YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} tickFormatter={(v) => Number.isInteger(v) ? v : ''} domain={[0, dataMax => Math.ceil(dataMax * 1.2)]} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {translatedStatusStats.map((entry, index) => (
                    <Cell key={index} fill={getDynamicColor(entry.name, index)} />
                  ))}
                  <LabelList content={<BarTopLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gridTemplateColumns: translatedStatusStats.length > 3 ? 'repeat(2, 1fr)' : '1fr', gap: '4px 12px', marginTop: 12 }}>
              {translatedStatusStats.map((s, i) => (
                <Indicator key={i} color={getDynamicColor(s.name, i)} label={`${s.label}: ${s.value}`} />
              ))}
            </div>
          </div>

          {/* Distribution par Type — type names are not in common.json so kept as-is */}
          <div className="pp-card">
            <p className="pp-chart-title">{t("performances.charts.typeDistribution")}</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={translatedTypeStats} barCategoryGap="40%" margin={{ bottom: 10 }}>
                <defs>
                  {translatedTypeStats.map((entry, index) => (
                    <linearGradient key={index} id={`typeGrad${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={getDynamicColor(entry.name, index)} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={getDynamicColor(entry.name, index)} stopOpacity={0.5} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} interval={0} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} tickFormatter={(v) => Number.isInteger(v) ? v : ''} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={60}>
                  {translatedTypeStats.map((entry, index) => (
                    <Cell key={index} fill={`url(#typeGrad${index})`} />
                  ))}
                  <LabelList content={<BarTopLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gridTemplateColumns: translatedTypeStats.length > 3 ? 'repeat(2, 1fr)' : '1fr', gap: '4px 12px', marginTop: 10 }}>
              {translatedTypeStats.map((tp, i) => (
                <Indicator key={i} color={getDynamicColor(tp.name, i)} label={`${tp.label}: ${tp.value} (${tp.percentage}%)`} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Section: Category Distribution ── */}
        {translatedCategoryStats?.length > 0 && (
          <>
            <p className="pp-section-title">{t("performances.sections.categoryDistribution")}</p>
            <div className="pp-card" style={{ marginBottom: 22 }}>
              <p className="pp-chart-title">{t("performances.charts.ticketsByCategory")}</p>
              <ResponsiveContainer width="100%" height={230}>
                {/* Uses translatedCategoryStats: X-axis shows translated category names */}
                <BarChart data={translatedCategoryStats} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} tickFormatter={(v) => Number.isInteger(v) ? v : ''} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {translatedCategoryStats.map((entry, index) => (
                      <Cell key={index} fill={getDynamicColor(entry.name, index)} />
                    ))}
                    <LabelList content={<BarTopLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'grid', gridTemplateColumns: translatedCategoryStats.length > 3 ? 'repeat(2, 1fr)' : '1fr', gap: '4px 12px', marginTop: 12 }}>
                {translatedCategoryStats.map((c, i) => (
                  <Indicator key={i} color={getDynamicColor(c.name, i)} label={`${c.label}: ${c.value}`} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Section: Time Trends ── */}
        <p className="pp-section-title">{t("performances.sections.timeTrends")}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Area chart — X-axis uses translated month names via translatedMonthlyStats */}
          <div className="pp-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <p className="pp-chart-title" style={{ marginBottom: 2 }}>
                  {selectedMonth
                    ? `${t("performances.charts.dailyEvolution")} — ${MONTHS.find(m => m.value === parseInt(selectedMonth))?.label} ${selectedYear}`
                    : `${t("performances.charts.monthlyEvolution")} ${selectedYear || new Date().getFullYear()}`}
                </p>
                <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MdCalendarMonth size={12} color="#94a3b8" /> {filterLabel}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px' }}>
                  {t("performances.charts.total")}: <strong style={{ color: '#1e293b' }}>{stats.totalTickets}</strong>
                </p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={280}>
              {/* translatedMonthlyStats has `month` field already re-mapped to current locale */}
              <AreaChart data={translatedMonthlyStats} margin={{ top: 24, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradIndigo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e0e7ff" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10.5, fill: '#6366f1', fontWeight: 500 }} />
<YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} tickCount={9} interval={0} domain={[0, dataMax => Math.ceil(dataMax / 2) * 2]} />
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

          {/* Priority Pie Chart — uses translatedPriorityStats for translated legend */}
          <div className="pp-card">
            <p className="pp-chart-title">{t("performances.charts.priorityDistribution")}</p>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={translatedPriorityStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={renderPieLabel}
                >
                  {translatedPriorityStats.map((entry, index) => (
                    <Cell key={index} fill={getDynamicColor(entry.name, index)} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Legend shows translated priority label */}
            <div style={{ display: 'grid', gridTemplateColumns: translatedPriorityStats.length > 3 ? 'repeat(2, 1fr)' : '1fr', gap: '4px 12px', marginTop: 10 }}>
              {translatedPriorityStats.map((p, i) => (
                <Indicator key={i} color={getDynamicColor(p.name, i)} label={`${p.label}: ${p.value}`} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Section: Urgency & Impact (if provided by backend) ── */}
        {(translatedUrgencyStats?.length > 0 || translatedImpactStats?.length > 0) && (
          <>
            <p className="pp-section-title">{t("performances.sections.urgencyImpact", { defaultValue: "Urgency & Impact" })}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
              {translatedUrgencyStats?.length > 0 && (
                <div className="pp-card">
                  <p className="pp-chart-title">{t("performances.charts.urgencyDistribution", { defaultValue: "Urgency Distribution" })}</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={translatedUrgencyStats} barCategoryGap="35%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} tickFormatter={(v) => Number.isInteger(v) ? v : ''} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {translatedUrgencyStats.map((entry, index) => (
                          <Cell key={index} fill={getDynamicColor(entry.name, index)} />
                        ))}
                        <LabelList content={<BarTopLabel />} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px', marginTop: 10 }}>
                    {translatedUrgencyStats.map((u, i) => (
                      <Indicator key={i} color={getDynamicColor(u.name, i)} label={`${u.label}: ${u.value}`} />
                    ))}
                  </div>
                </div>
              )}
              {translatedImpactStats?.length > 0 && (
                <div className="pp-card">
                  <p className="pp-chart-title">{t("performances.charts.impactDistribution", { defaultValue: "Impact Distribution" })}</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={translatedImpactStats} barCategoryGap="35%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} tickFormatter={(v) => Number.isInteger(v) ? v : ''} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {translatedImpactStats.map((entry, index) => (
                          <Cell key={index} fill={getDynamicColor(entry.name, index)} />
                        ))}
                        <LabelList content={<BarTopLabel />} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px', marginTop: 10 }}>
                    {translatedImpactStats.map((imp, i) => (
                      <Indicator key={i} color={getDynamicColor(imp.name, i)} label={`${imp.label}: ${imp.value}`} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

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

function KpiCard({ meta, value, color, bg, border, Icon }) {
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
          {meta.motCle}
        </p>
        <p style={{ margin: 0, fontSize: 34, fontWeight: 800, color: color, lineHeight: 1 }}>{value}</p>
      </div>
      <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 10, padding: 8 }}>
        <Icon size={18} color={color} />
      </div>
    </div>
  );
}
